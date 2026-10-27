import { Op } from 'sequelize';
import { Remitos, RemitoItems, RemitoItemLots, WarehouseStock, StockMovements, Warehouses, Clientes, Users, ProductLots, ProductPresentations, ProductVariants, Products, ClienteIngenieros } from '../models/index.js';
import { ROLES } from '../config/constants/roles.js';
import db from '../config/database.js';
import path from 'path';
import fs from 'fs';

export const allRemitos = async (req, res) => {
  try {
    const where = {};

    if (req.user?.rol !== ROLES.ADMIN) {
      const vinculos = await ClienteIngenieros.findAll({
        where: { user_id: req.user.id },
        attributes: ['cliente_id'],
      });
      where.destination_client_id = { [Op.in]: vinculos.map((v) => v.cliente_id) };
    }

    const remitos = await Remitos.findAll({
      where,
      include: [
        { model: Warehouses, as: 'depositoOrigen' },
        { model: Clientes, as: 'cliente' },
        { model: Users, as: 'creadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Users, as: 'confirmadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Users, as: 'canceladoPor', attributes: ['id', 'nombre', 'email'] },
        {
          model: RemitoItems,
          as: 'items',
          attributes: ['id', 'product_variant_id'],
          include: [
            {
              model: ProductVariants,
              as: 'variante',
              attributes: ['id', 'codigo'],
              include: [
                { model: Products, as: 'producto', attributes: ['id', 'nombre', 'codigo'] },
                { model: ProductPresentations, as: 'presentacion', attributes: ['id', 'nombre'] },
              ],
            },
          ],
        },
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
    const { type, origin_warehouse_id, destination_client_id, notes, created_by, items, remito_number } = req.body;

    // Validar remito_number
    if (!remito_number || !/^\d{1,8}$/.test(String(remito_number))) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El número de remito debe ser numérico de hasta 8 dígitos' });
    }

    const formattedNumber = String(remito_number).padStart(8, '0');

    // Validar unicidad por depósito
    const existing = await Remitos.findOne({
      where: {
        company_id: 1,
        origin_warehouse_id,
        remito_number: formattedNumber,
      },
      transaction,
    });

    if (existing) {
      await transaction.rollback();
      return res.status(409).json({ message: `El número de remito ${formattedNumber} ya existe para este depósito` });
    }

    const remito = await Remitos.create(
      {
        company_id: 1,
        remito_number: formattedNumber,
        type,
        status: 'PENDIENTE',
        origin_warehouse_id,
        destination_client_id,
        created_by,
        notes,
      },
      { transaction },
    );

    for (const item of items) {
      const variante = await ProductVariants.findByPk(item.product_variant_id, {
        transaction,
        include: [{ model: ProductPresentations, as: 'presentacion' }],
      });

      if (!variante) {
        throw new Error(`Variante ${item.product_variant_id} no encontrada`);
      }

      const cantidadBase = variante?.presentacion?.cantidad_base ? parseFloat(variante.presentacion.cantidad_base) : 1;
      const qtyBase = parseFloat(item.quantity_requested) * cantidadBase;

      const remitoItem = await RemitoItems.create(
        {
          remito_id: remito.id,
          product_variant_id: item.product_variant_id,
          quantity_requested: qtyBase,
          description: item.description,
        },
        { transaction },
      );

      let remaining = qtyBase;
      const stockLots = await WarehouseStock.findAll({
        where: {
          warehouse_id: origin_warehouse_id,
        },
        include: [{
          model: ProductLots,
          as: 'lote',
          where: { product_variant_id: item.product_variant_id },
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
        const unidadLabel = variante?.presentacion?.nombre || 'unidad base';
        throw new Error(`Stock insuficiente para variante ${item.product_variant_id}. Faltante: ${remaining / cantidadBase} ${unidadLabel}`);
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

export const cancelRemito = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const remito = await Remitos.findByPk(req.params.id, { transaction });
    if (!remito) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Remito no encontrado' });
    }

    if (remito.status === 'COMPLETADO' || remito.status === 'ANULADO') {
      await transaction.rollback();
      return res.status(400).json({ message: 'No se puede anular un remito en estado ' + remito.status });
    }

    const items = await RemitoItems.findAll({
      where: { remito_id: remito.id },
      include: [{ model: RemitoItemLots, as: 'lotes' }],
      transaction,
    });

    for (const item of items) {
      for (const lot of item.lotes) {
        const stock = await WarehouseStock.findOne({
          where: {
            warehouse_id: remito.origin_warehouse_id,
            product_lot_id: lot.product_lot_id,
          },
          transaction,
        });

        if (stock) {
          stock.quantity = parseFloat(stock.quantity) + parseFloat(lot.quantity_dispatched);
          await stock.save({ transaction });
        }

        await StockMovements.create(
          {
            company_id: 1,
            warehouse_id: remito.origin_warehouse_id,
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

    await Remitos.update(
      {
        status: 'ANULADO',
        cancelled_at: new Date(),
        cancelled_by: req.body.cancelled_by || null,
      },
      { where: { id: remito.id }, transaction },
    );

    await transaction.commit();
    res.json({ message: 'Remito anulado y stock revertido' });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
};

export const confirmRemito = async (req, res) => {
  try {
    const remito = await Remitos.findByPk(req.params.id);
    if (!remito) {
      return res.status(404).json({ message: 'Remito no encontrado' });
    }

    if (remito.status !== 'REVISION') {
      return res.status(400).json({ message: 'Solo se pueden confirmar remitos en estado REVISION' });
    }

    await Remitos.update(
      {
        status: 'COMPLETADO',
        confirmed_at: new Date(),
        confirmed_by: req.body.confirmed_by || null,
      },
      { where: { id: req.params.id } },
    );

    res.json({ message: 'Remito confirmado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadRemitoPhoto = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const remito = await Remitos.findByPk(req.params.id, { transaction });

    if (!remito) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Remito no encontrado' });
    }

    if (remito.status === 'COMPLETADO' || remito.status === 'ANULADO') {
      await transaction.rollback();
      return res.status(400).json({ message: 'No se puede modificar un remito en estado ' + remito.status });
    }

    if (!req.file) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    if (remito.photo_path) {
      const oldPath = path.join(process.cwd(), remito.photo_path);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    remito.photo_path = `/uploads/remitos/${req.file.filename}`;
    remito.photo_uploaded_at = new Date();
    remito.status = 'REVISION';
    await remito.save({ transaction });

    await transaction.commit();
    res.json({ message: 'Foto subida correctamente', remito });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

export const getCatalogo = async (req, res) => {
  try {
    const { warehouse_id } = req.params;

    const stock = await WarehouseStock.findAll({
      where: {
        warehouse_id,
        quantity: { [Op.gt]: 0 },
      },
      include: [
        {
          model: ProductLots,
          as: 'lote',
          include: [
            {
              model: ProductVariants,
              as: 'variante',
              include: [
                { model: ProductPresentations, as: 'presentacion' },
              ],
            },
          ],
        },
      ],
    });

    const catalogo = {};
    for (const s of stock) {
      const variant = s.lote?.variante;
      if (!variant) continue;

      const key = variant.id;
      if (!catalogo[key]) {
        const cantidadBase = variant.presentacion?.cantidad_base
          ? parseFloat(variant.presentacion.cantidad_base)
          : 1;

        catalogo[key] = {
          product_variant_id: variant.id,
          product_id: variant.product_id,
          product_name: variant.codigo || '',
          presentation_name: variant.presentacion?.nombre || 'Sin presentación',
          cantidad_base: cantidadBase,
          unidad_base: variant.presentacion?.unidadBase?.nombre || '',
          stock_base: 0,
          ranking: variant.ranking || 0,
        };
      }
      catalogo[key].stock_base += parseFloat(s.quantity);
    }

    let resultado = Object.values(catalogo).sort((a, b) => {
      if (b.ranking !== a.ranking) return b.ranking - a.ranking;
      return a.product_name.localeCompare(b.product_name);
    });

    for (const item of resultado) {
      item.stock_en_presentacion = item.stock_base / item.cantidad_base;
    }

    resultado = resultado.map((item) => ({
      ...item,
      stock_base: parseFloat(item.stock_base.toFixed(4)),
      stock_en_presentacion: parseFloat(item.stock_en_presentacion.toFixed(2)),
    }));

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRemitoById = async (req, res) => {
  try {
    const remito = await Remitos.findByPk(req.params.id, {
      include: [
        { model: Warehouses, as: 'depositoOrigen' },
        { model: Clientes, as: 'cliente' },
        { model: Users, as: 'creadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Users, as: 'confirmadoPor', attributes: ['id', 'nombre', 'email'] },
        { model: Users, as: 'canceladoPor', attributes: ['id', 'nombre', 'email'] },
        {
          model: RemitoItems,
          as: 'items',
          include: [
            {
              model: ProductVariants,
              as: 'variante',
              include: [
                { model: Products, as: 'producto' },
                { model: ProductPresentations, as: 'presentacion' },
              ],
            },
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