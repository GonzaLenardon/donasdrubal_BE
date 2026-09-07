import { ProductPresentations } from '../models/index.js';

export const allPresentations = async (req, res) => {
  try {
    const items = await ProductPresentations.findAll({
      where: { activo: true },
      include: [{ model: ProductPresentations, as: 'unidadBase' }],
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addPresentation = async (req, res) => {
  try {
    const item = await ProductPresentations.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePresentation = async (req, res) => {
  try {
    await ProductPresentations.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Presentación actualizada' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePresentation = async (req, res) => {
  try {
    await ProductPresentations.update({ activo: false }, { where: { id: req.params.id } });
    res.json({ message: 'Presentación desactivada' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
