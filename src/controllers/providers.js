import { Providers } from '../models/index.js';

export const allProviders = async (req, res) => {
  try {
    const providers = await Providers.findAll({ where: { activo: true } });
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProvider = async (req, res) => {
  try {
    const provider = await Providers.create(req.body);
    res.status(201).json(provider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProvider = async (req, res) => {
  try {
    await Providers.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Proveedor actualizado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProvider = async (req, res) => {
  try {
    await Providers.update({ activo: false }, { where: { id: req.params.id } });
    res.json({ message: 'Proveedor desactivado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
