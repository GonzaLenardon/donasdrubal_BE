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
  const { tipo_maquina, marca, modelo, responsable } = req.body;

  const { cliente_id } = req.params;

  try {
    const resp = await Maquinas.create({
      tipo_maquina,
      marca,
      modelo,
      responsable,
      cliente_id,
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
  const { id } = req.params;

  try {
    const maquina = await Maquinas.findByPk(id);

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
    const resp = await Maquinas.findAll({ where: { cliente_id: cliente } });

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
  const cliente_id = req.params.cliente_id;

  console.log('paso x maquinas clientes');
  try {
    const resp = await Maquinas.findAll({ where: { cliente_id: cliente_id } });

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
