import { Purchases, PurchaseItems, PurchaseItemLots, PurchaseItemDestinations, Products, ProductPresentations, ProductLots, Providers, Warehouses, StockMovements, WarehouseStock } from '../models/index.js';
import db from '../config/database.js';

export const allPurchases = async (req, res) => {
  try {
    const purchases = await Purchases.findAll({
      include: [
        { model: Providers, as: 'proveedor' },
        {
          model: PurchaseItems,
          as: 'items',
          include: [
            { model: Products, as: 'producto' },
            { model: ProductPresentations, as: 'presentacion' },
            {
              model: PurchaseItemDestinations,
              as: 'destinos',
              include: [{ model: Warehouses, as: 'deposito' }],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addPurchase = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { provider_id, purchase_date, notes, created_by, items } = req.body;

    // Tomar el primer depósito destino como referencia de la cabecera
    const firstDestination = items?.[0]?.destinos?.[0];
    const warehouse_id = firstDestination?.warehouse_id || null;

    const purchase = await Purchases.create(
      { provider_id, warehouse_id, purchase_date, notes, created_by },
      { transaction },
    );

    for (const item of items) {
      const purchaseItem = await PurchaseItems.create(
        {
          purchase_id: purchase.id,
          product_id: item.product_id,
          product_presentation_id: item.product_presentation_id,
          quantity: item.quantity,
        },
        { transaction },
      );

      // Crear lotes
      for (const lot of item.lotes) {
        let productLot = await ProductLots.findOne({
          where: { product_id: item.product_id, lot_number: lot.lot_number },
        });

        if (!productLot) {
          productLot = await ProductLots.create(
            {
              product_id: item.product_id,
              product_presentation_id: item.product_presentation_id,
              lot_number: lot.lot_number,
              manufacturing_date: lot.manufacturing_date,
              expiration_date: lot.expiration_date,
            },
            { transaction },
          );
        }

        await PurchaseItemLots.create(
          {
            purchase_item_id: purchaseItem.id,
            product_lot_id: productLot.id,
            quantity: lot.quantity,
          },
          { transaction },
        );
      }

      // Crear destinos y distribuir stock
      for (const destino of item.destinos) {
        await PurchaseItemDestinations.create(
          {
            purchase_item_id: purchaseItem.id,
            warehouse_id: destino.warehouse_id,
            quantity: destino.quantity,
          },
          { transaction },
        );

        // Para cada lote del ítem, distribuir proporcionalmente al destino
        const totalItemQty = parseFloat(item.quantity);
        const destinoQty = parseFloat(destino.quantity);

        for (const lot of item.lotes) {
          const lotQty = parseFloat(lot.quantity);
          const proporcion = destinoQty / totalItemQty;
          const lotDestinoQty = lotQty * proporcion;

          const productLot = await ProductLots.findOne({
            where: { product_id: item.product_id, lot_number: lot.lot_number },
            transaction,
          });

          if (!productLot) continue;

          // Actualizar stock del depósito
          const [stock, created] = await WarehouseStock.findOrCreate({
            where: {
              warehouse_id: destino.warehouse_id,
              product_id: item.product_id,
              product_lot_id: productLot.id,
            },
            defaults: { quantity: lotDestinoQty },
            transaction,
          });

          if (!created) {
            stock.quantity = parseFloat(stock.quantity) + lotDestinoQty;
            await stock.save({ transaction });
          }

          // Crear movimiento de stock
          await StockMovements.create(
            {
              company_id: 1,
              warehouse_id: destino.warehouse_id,
              product_id: item.product_id,
              product_lot_id: productLot.id,
              movement_type: 'ENTRADA',
              quantity: lotDestinoQty,
              reference_type: 'purchase',
              reference_id: purchase.id,
              movement_date: purchase_date,
              created_by,
            },
            { transaction },
          );
        }
      }
    }

    await transaction.commit();
    res.status(201).json(purchase);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
};
