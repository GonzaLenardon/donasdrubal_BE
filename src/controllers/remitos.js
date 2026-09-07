import { Remitos, RemitoItems, RemitoItemLots, WarehouseStock, StockMovements, Warehouses, Clientes, Users, Products, ProductLots } from '../models/index.js';
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
      const remitoItem = await RemitoItems.create(
        {
          remito_id: remito.id,
          product_id: item.product_id,
          product_presentation_id: item.product_presentation_id,
          quantity_requested: item.quantity_requested,
          description: item.description,
        },
        { transaction },
      );

      // FIFO: consume oldest lots first
      let remaining = parseFloat(item.quantity_requested);
      const stockLots = await WarehouseStock.findAll({
        where: {
          warehouse_id: origin_warehouse_id,
          product_id: item.product_id,
        },
        include: [{ model: ProductLots, as: 'lote' }],
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
        throw new Error(`Stock insuficiente para producto ${item.product_id}. Faltante: ${remaining}`);
      }

      remitoItem.quantity_dispatched = parseFloat(item.quantity_requested) - remaining;
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
  try {
    await Remitos.update(
      { status: 'ANULADO' },
      { where: { id: req.params.id } },
    );
    res.json({ message: 'Remito anulado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getRemitoById = async (req, res) => {
  try {
    const remito = await Remitos.findByPk(req.params.id, {
      include: [
        { model: Warehouses, as: 'depositoOrigen' },
        { model: Clientes, as: 'cliente' },
        { model: RemitoItems, as: 'items', include: [{ model: Products, as: 'producto' }] },
      ],
    });
    if (!remito) return res.status(404).json({ message: 'Remito no encontrado' });
    res.json(remito);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
