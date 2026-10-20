import { Rubros, Subrubros } from '../models/index.js';

export const allRubros = async (req, res) => {
  try {
    const rubros = await Rubros.findAll({
      include: [{ model: Subrubros, as: 'subrubros' }],
      order: [['nombre', 'ASC']],
    });
    res.json(rubros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addRubro = async (req, res) => {
  try {
    const rubro = await Rubros.create(req.body);
    res.status(201).json(rubro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRubro = async (req, res) => {
  try {
    const rubro = await Rubros.findByPk(req.params.id);
    if (!rubro) return res.status(404).json({ message: 'Rubro no encontrado' });
    await rubro.update(req.body);
    res.json(rubro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRubro = async (req, res) => {
  try {
    const rubro = await Rubros.findByPk(req.params.id);
    if (!rubro) return res.status(404).json({ message: 'Rubro no encontrado' });
    await rubro.update({ activo: false });
    res.json({ message: 'Rubro desactivado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};