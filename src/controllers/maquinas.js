import Maquinas from '../models/maquinas.js';

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
  const { tipo_maquina, marca, modelo, responsable, user_id } = req.body;

  try {
    const resp = await Maquinas.create({
      tipo_maquina,
      marca,
      modelo,
      responsable,
      user_id,
    });

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
  const { id, tipo_maquina, marca, modelo, responsable, user_id } = req.body;

  try {
    const maquina = await Maquinas.findByPk(id);

    if (!maquina) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    const resp = await maquina.update({
      tipo_maquina,
      marca,
      modelo,
      responsable,
      user_id,
    });

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
  const user = req.params.user;

  try {
    const resp = await Maquinas.findAll({ where: { user_id: user } });

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
