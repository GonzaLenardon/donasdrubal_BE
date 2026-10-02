import { StockMovements, Warehouses, Products, ProductLots } from '../models/index.js';

export const allMovements = async (req, res) => {
  try {
    const movements = await StockMovements.findAll({
      include: [
        { model: Warehouses, as: 'deposito' },
        { model: Products, as: 'producto' },
        { model: ProductLots, as: 'lote' },
      ],
      order: [['movement_date', 'DESC']],
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const movementsByWarehouse = async (req, res) => {
  try {
    const movements = await StockMovements.findAll({
      where: { warehouse_id: req.params.warehouse_id },
      include: [
        { model: Products, as: 'producto' },
        { model: ProductLots, as: 'lote' },
      ],
      order: [['movement_date', 'DESC']],
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
