import { Subrubros, Rubros } from '../models/index.js';

export const allSubrubros = async (req, res) => {
  try {
    const where = {};
    if (req.query.rubro_id) where.rubro_id = req.query.rubro_id;
    const subrubros = await Subrubros.findAll({
      where,
      include: [{ model: Rubros, as: 'rubro' }],
      order: [['nombre', 'ASC']],
    });
    res.json(subrubros);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addSubrubro = async (req, res) => {
  try {
    const subrubro = await Subrubros.create(req.body);
    res.status(201).json(subrubro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSubrubro = async (req, res) => {
  try {
    const subrubro = await Subrubros.findByPk(req.params.id);
    if (!subrubro) return res.status(404).json({ message: 'Subrubro no encontrado' });
    await subrubro.update(req.body);
    res.json(subrubro);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSubrubro = async (req, res) => {
  try {
    const subrubro = await Subrubros.findByPk(req.params.id);
    if (!subrubro) return res.status(404).json({ message: 'Subrubro no encontrado' });
    await subrubro.update({ activo: false });
    res.json({ message: 'Subrubro desactivado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};