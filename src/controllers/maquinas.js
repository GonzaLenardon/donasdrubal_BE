import Maquinas from '../models/maquinas.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import Cliente from '../models/clientes.js';

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
