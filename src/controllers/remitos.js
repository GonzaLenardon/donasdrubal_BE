import { Remitos, RemitoItems, RemitoItemLots, WarehouseStock, StockMovements, Warehouses, Clientes, Users, Products, ProductLots, ProductPresentations } from '../models/index.js';
import db from '../config/database.js';

const generateRemitoNumber = async (warehouse_id, transaction) => {
  const warehouse = await Warehouses.findByPk(warehouse_id, { transaction });
  if (!warehouse) throw new Error('Depósito no encontrado');

  const lastRemito = await Remitos.findOne({
    where: { origin_warehouse_id: warehouse_id },
    order: [['id', 'DESC']],
    transaction,
  });

  const nextCorrelative = lastRemito
    ? parseInt(lastRemito.remito_number.split('-')[2]) + 1
    : 1;

  return `REM-${String(warehouse.id).padStart(4, '0')}-${String(nextCorrelative).padStart(4, '0')}`;
};

export const allRemitos = async (req, res) => {
  try {
    const remitos = await Remitos.findAll({
      include: [
        { model: Warehouses, as: 'depositoOrigen' },
        { model: Clientes, as: 'cliente' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(remitos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addRemito = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { type, origin_warehouse_id, destination_client_id, notes, created_by, items } = req.body;

    const remito_number = await generateRemitoNumber(origin_warehouse_id, transaction);

    const remito = await Remitos.create(
      {
        company_id: 1,
        remito_number,
        type,
        origin_warehouse_id,
        destination_client_id,
        created_by,
        notes,
      },
      { transaction },
    );

    for (const item of items) {
      // Buscar presentación para conversión a unidad base
      const presentacion = item.product_presentation_id
        ? await ProductPresentations.findByPk(item.product_presentation_id, { transaction })
        : null;
      const cantidadBase = presentacion?.cantidad_base ? parseFloat(presentacion.cantidad_base) : 1;

      // Convertir cantidad solicitada a unidad base
      const qtyBase = parseFloat(item.quantity_requested) * cantidadBase;

      const remitoItem = await RemitoItems.create(
        {
          remito_id: remito.id,
          product_id: item.product_id,
          product_presentation_id: item.product_presentation_id,
          quantity_requested: qtyBase,
          description: item.description,
        },
        { transaction },
      );

      // FIFO: buscar SOLO lotes de la misma presentación, ordenados por fecha
      let remaining = qtyBase;
      const stockLots = await WarehouseStock.findAll({
        where: {
          warehouse_id: origin_warehouse_id,
          product_id: item.product_id,
        },
        include: [{
          model: ProductLots,
          as: 'lote',
          where: item.product_presentation_id
            ? { product_presentation_id: item.product_presentation_id }
            : {},
        }],
        order: [[{ model: ProductLots, as: 'lote' }, 'manufacturing_date', 'ASC']],
        transaction,
      });

      for (const stockEntry of stockLots) {
        if (remaining <= 0) break;

        const available = parseFloat(stockEntry.quantity);
        const toDispatch = Math.min(remaining, available);

        await RemitoItemLots.create(
          {
            remito_item_id: remitoItem.id,
            product_lot_id: stockEntry.product_lot_id,
            quantity_dispatched: toDispatch,
          },
          { transaction },
        );

        stockEntry.quantity = available - toDispatch;
        await stockEntry.save({ transaction });

        await StockMovements.create(
          {
            company_id: 1,
            warehouse_id: origin_warehouse_id,
            product_id: item.product_id,
            product_lot_id: stockEntry.product_lot_id,
            movement_type: 'SALIDA',
            quantity: toDispatch,
            reference_type: 'remito',
            reference_id: remito.id,
            remito_id: remito.id,
            created_by,
          },
          { transaction },
        );

        remaining -= toDispatch;
      }

      if (remaining > 0) {
        const unidadLabel = presentacion?.nombre || 'unidad base';
        throw new Error(`Stock insuficiente para producto ${item.product_id}. Faltante: ${remaining / cantidadBase} ${unidadLabel}`);
      }

      remitoItem.quantity_dispatched = qtyBase;
      await remitoItem.save({ transaction });
    }

    await transaction.commit();
    res.status(201).json(remito);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
};

export const dispatchRemito = async (req, res) => {
  try {
    await Remitos.update(
      { status: 'DESPACHADO', dispatched_at: new Date() },
      { where: { id: req.params.id } },
    );
    res.json({ message: 'Remito despachado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const receiveRemito = async (req, res) => {
  try {
    await Remitos.update(
      { status: 'RECIBIDO', received_at: new Date(), received_by: req.body.received_by },
      { where: { id: req.params.id } },
    );
    res.json({ message: 'Remito recibido' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const cancelRemito = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const remito = await Remitos.findByPk(req.params.id, { transaction });
    if (!remito) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Remito no encontrado' });
    }

    if (remito.status === 'ANULADO') {
      await transaction.rollback();
      return res.status(400).json({ message: 'El remito ya está anulado' });
    }

    // Buscar todos los ítems del remito con sus lotes consumidos
    const items = await RemitoItems.findAll({
      where: { remito_id: remito.id },
      include: [{ model: RemitoItemLots, as: 'lotes' }],
      transaction,
    });

    // Revertir stock: sumar vuelta cada lote consumido
    for (const item of items) {
      for (const lot of item.lotes) {
        const stock = await WarehouseStock.findOne({
          where: {
            warehouse_id: remito.origin_warehouse_id,
            product_id: item.product_id,
            product_lot_id: lot.product_lot_id,
          },
          transaction,
        });

        if (stock) {
          stock.quantity = parseFloat(stock.quantity) + parseFloat(lot.quantity_dispatched);
          await stock.save({ transaction });
        }

        // Crear movimiento ENTRADA (reversa)
        await StockMovements.create(
          {
            company_id: 1,
            warehouse_id: remito.origin_warehouse_id,
            product_id: item.product_id,
            product_lot_id: lot.product_lot_id,
            movement_type: 'ENTRADA',
            quantity: lot.quantity_dispatched,
            reference_type: 'remito_cancel',
            reference_id: remito.id,
            remito_id: remito.id,
            created_by: remito.created_by,
          },
          { transaction },
        );
      }
    }

    // Marcar remito como ANULADO
    await Remitos.update(
      { status: 'ANULADO' },
      { where: { id: remito.id }, transaction },
    );

    await transaction.commit();
    res.json({ message: 'Remito anulado y stock revertido' });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
};

export const getRemitoById = async (req, res) => {
  try {
    const remito = await Remitos.findByPk(req.params.id, {
      include: [
        { model: Warehouses, as: 'depositoOrigen' },
        { model: Clientes, as: 'cliente' },
        {
          model: RemitoItems,
          as: 'items',
          include: [
            { model: Products, as: 'producto' },
            {
              model: RemitoItemLots,
              as: 'lotes',
              include: [{ model: ProductLots, as: 'lote' }],
            },
          ],
        },
      ],
    });
    if (!remito) return res.status(404).json({ message: 'Remito no encontrado' });
    res.json(remito);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
