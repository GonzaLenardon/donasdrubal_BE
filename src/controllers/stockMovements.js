import { StockMovements, Warehouses, ProductLots, ProductVariants, ProductPresentations } from '../models/index.js';

export const allMovements = async (req, res) => {
  try {
    const movements = await StockMovements.findAll({
      include: [
        { model: Warehouses, as: 'deposito' },
        {
          model: ProductLots,
          as: 'lote',
          include: [{
            model: ProductVariants,
            as: 'variante',
            include: [{ model: ProductPresentations, as: 'presentacion' }],
          }],
        },
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
        {
          model: ProductLots,
          as: 'lote',
          include: [{
            model: ProductVariants,
            as: 'variante',
            include: [{ model: ProductPresentations, as: 'presentacion' }],
          }],
        },
      ],
      order: [['movement_date', 'DESC']],
    });
    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};