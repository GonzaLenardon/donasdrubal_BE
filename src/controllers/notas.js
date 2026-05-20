import { where } from 'sequelize';
import { Notas, Clientes, Users } from '../models/index.js';
import { extractModelFields } from '../utils/model/payload.js';

export const addNotas = async (req, res) => {
  const { cliente_id } = req.params;

  try {
    const { fecha, comentario, usuario_id } = req.body;
    if (!fecha || !comentario || !usuario_id || !cliente_id) {
      return res.status(400).json({
        error:
          'Todos los campos son requeridos: fecha, comentario, usuario_id, cliente_id',
      });
    }
    const nota = await Notas.create({
      fecha,
      comentario,
      usuario_id,
      cliente_id,
    });
    return res.status(201).json({
      message: 'Nota creada exitosamente',
      data: nota,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const getNota = async (req, res) => {
  const { nota_id } = req.params;

  try {
    const nota = await Notas.findByPk(nota_id);
    if (!nota) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    return res.status(200).json({
      message: 'Nota obtenida exitosamente',
      data: nota,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const updateNota = async (req, res) => {
  const { id, cliente_id } = req.params;
  try {
    const payload = extractModelFields(Notas, req.body);
    const nota = await Notas.findByPk(id);
    if (!nota) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    const resp = await nota.update(payload);

    return res.status(200).json({
      message: 'Nota actualizada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const deleteNota = async (req, res) => {
  const { id } = req.params;
  try {
    const nota = await Notas.findByPk(id);
    if (!nota) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    await nota.destroy();
    return res.status(200).json({
      message: 'Nota eliminada exitosamente',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const allNotas = async (req, res) => {
  const { cliente_id } = req.params;

  console.log('jejejeje ', cliente_id);

  try {
    const notas = await Notas.findAll({ where: { cliente_id } });
    return res.status(200).json({
      message: 'Notas obtenidas exitosamente',
      data: notas,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const allNotasUser = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const notas = await Notas.findAll({
      where: { usuario_id },
      include: [
        {
          model: Clientes,
          as: 'cliente',
          attributes: ['id', 'razon_social'],
        },
      ],
    });

    return res.status(200).json({
      message: 'Notas obtenidas exitosamente',
      data: notas,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};
