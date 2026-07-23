import Maquinas from '../models/maquinas.js';
import Calibraciones from '../models/calibraciones.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import Cliente from '../models/clientes.js';
import { where } from 'sequelize';

export const allMaquinas = async (req, res) => {
  console.log('all Maquinas');

  try {
    const resp = await Maquinas.findAll();
    return res.status(200).json({
      message: 'Máquinas obtenidas correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const addMaquina = async (req, res) => {
  const { cliente_id } = req.params;
  const data = { ...req.body, cliente_id };

  try {
    const resp = await Maquinas.create(data);

    return res.status(201).json({
      message: 'Máquina creada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const updateMaquina = async (req, res) => {
  const { maquina_id } = req.params;

  try {
    const maquina = await Maquinas.findByPk(maquina_id);

    if (!maquina) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    const resp = await maquina.update(req.body);

    return res.status(200).json({
      message: 'Máquina actualizada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const maquinasUser = async (req, res) => {
  const cliente = req.params.cliente_id;
  console.log('paso x maquinas user', cliente);

  try {
    const resp = await Maquinas.findAll({
      where: { cliente_id: cliente },
      include: [{ model: MaquinaTipo, as: 'tipo' }],
    });

    return res.status(200).json({
      message: 'Máquinas encontradas',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const maquinasCliente = async (req, res) => {
  const { cliente_id } = req.params;

  console.log('paso x maquinas clientes hdp', cliente_id);

  try {
    const resp = await Maquinas.findAll({
      where: { cliente_id },
      include: [
        { model: MaquinaTipo, as: 'tipo' },
        {
          model: Calibraciones,
          as: 'calibracionesmaquina',
          attributes: ['estado', 'createdAt'],
          separate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    return res.status(200).json({
      message: 'Máquinas encontradas',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const delMaquina = async (req, res) => {
  const { id } = req.params;

  try {
    // 🔎 Contar calibraciones asociadas
    const cantidadCalibraciones = await Calibraciones.count({
      where: { maquina_id: id },
    });

    // ❌ Si existen calibraciones → no permitir eliminar
    if (cantidadCalibraciones > 0) {
      return res.status(409).json({
        error: `No se puede eliminar la máquina porque tiene ${cantidadCalibraciones} calibración${cantidadCalibraciones > 1 ? 'es' : ''} asociada${cantidadCalibraciones > 1 ? 's' : ''}.`,
        calibraciones: cantidadCalibraciones,
      });
    }

    // ✅ Si no tiene calibraciones → eliminar
    const maquinaEliminada = await Maquinas.destroy({
      where: { id },
    });

    if (!maquinaEliminada) {
      return res.status(404).json({
        error: 'La máquina no existe.',
      });
    }

    return res.status(200).json({
      message: 'Máquina eliminada correctamente.',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};
