import { ProductLots } from '../models/index.js';

export const allLots = async (req, res) => {
  try {
    const lots = await ProductLots.findAll();
    res.json(lots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addLot = async (req, res) => {
  try {
    const lot = await ProductLots.create(req.body);
    res.status(201).json(lot);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
