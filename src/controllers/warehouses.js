import { Warehouses } from '../models/index.js';

export const allWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouses.findAll({ where: { activo: true } });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouses.create(req.body);
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    await Warehouses.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Depósito actualizado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    await Warehouses.update({ activo: false }, { where: { id: req.params.id } });
    res.json({ message: 'Depósito desactivado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
