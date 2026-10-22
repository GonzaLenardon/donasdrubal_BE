import { WarehouseStock, ProductLots, ProductVariants, ProductPresentations, Warehouses } from '../models/index.js';
import { Op } from 'sequelize';

export const getStockByWarehouse = async (req, res) => {
  try {
    const stock = await WarehouseStock.findAll({
      where: {
        warehouse_id: req.params.warehouse_id,
        quantity: { [Op.gt]: 0 },
      },
      include: [
        {
          model: ProductLots,
          as: 'lote',
          include: [{
            model: ProductVariants,
            as: 'variante',
            include: [{
              model: ProductPresentations,
              as: 'presentacion',
              include: [{ model: ProductPresentations, as: 'unidadBase' }],
            }],
          }],
        },
        { model: Warehouses, as: 'deposito' },
      ],
    });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllStock = async (req, res) => {
  try {
    const stock = await WarehouseStock.findAll({
      where: { quantity: { [Op.gt]: 0 } },
      include: [
        {
          model: ProductLots,
          as: 'lote',
          include: [{
            model: ProductVariants,
            as: 'variante',
            include: [{
              model: ProductPresentations,
              as: 'presentacion',
              include: [{ model: ProductPresentations, as: 'unidadBase' }],
            }],
          }],
        },
        { model: Warehouses, as: 'deposito' },
      ],
    });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};