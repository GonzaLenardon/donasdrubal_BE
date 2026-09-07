import { WarehouseStock } from '../models/index.js';

export const getStockByWarehouse = async (req, res) => {
  try {
    const stock = await WarehouseStock.findAll({
      where: { warehouse_id: req.params.warehouse_id },
    });
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllStock = async (req, res) => {
  try {
    const stock = await WarehouseStock.findAll();
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
