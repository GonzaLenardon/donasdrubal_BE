import { extractModelFields } from '../utils/payload.js';
import Pozo from '../models/pozo.js';
import MuestraAgua from '../models/muestra_agua.js';

export const allMuestrasAgua = async (req, res) => {
  console.log('allMuestrasAgua controller');

  try {
    const resp = await MuestraAgua.findAll();
    return res.status(200).json({
      message: 'Muestras de Agua obtenidas correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const addMuestraAgua = async (req, res) => {
  // const { tipo_maquina, marca, modelo, responsable } = req.body;
  // const { cliente_id } = req.params;
  console.log('Add Muestra Agua', req.body);

  try {
    const payload = extractModelFields(MuestraAgua, req.body);
    payload.dosis = calcularDosis(payload.dureza);
    payload.pozo_id = req.params.pozo_id || req.body.pozo_id;
    console.log('addPozos controller: payload->', payload);
    const resp = await MuestraAgua.create(payload);

    return res.status(201).json({
      message: 'Muestra de Agua creada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const updateMuestraAgua = async (req, res) => {
  const { muestra_agua_id } = req.params;

  console.log('Que llega al back ?', req.body);

  try {
    const payload = extractModelFields(MuestraAgua, req.body);

    const muetras_agua = await MuestraAgua.findByPk(muestra_agua_id);

    if (!muetras_agua) {
      return res.status(404).json({ error: 'Muestra Agua no encontrada' });
    }
    payload.dosis = calcularDosis(payload.dureza);
    const resp = await muetras_agua.update(payload);

    return res.status(200).json({
      message: 'Muestra Agua actualizada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const getMuestrasAgua = async (req, res) => {
  const { muestra_agua_id } = req.params;

  try {
    const muestra_agua = await MuestraAgua.findByPk(muestra_agua_id);

    if (!muestra_agua) {
      return res.status(404).json({ error: 'Muestra de Agua no encontrada' });
    }
    return res.status(200).json({
      message: 'Muestra de Agua obtenida exitosamente',
      data: muestra_agua,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const getMuestrasAguaPozo = async (req, res) => {
  const { pozo_id } = req.params;
  try {
    const resp = await MuestraAgua.findAll({ where: { pozo_id } });

    return res.status(200).json({
      message: 'Muestras de Agua del Pozo obtenidas correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const getMuestraAguaPozo = async (req, res) => {
  const { pozo_id, muestra_agua_id } = req.params;
  try {
    const resp = await MuestraAgua.findOne({
      where: { pozo_id, id: muestra_agua_id },
    });
    return res.status(200).json({
      message: 'Muestra de Agua del Pozo obtenida correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const getMuestrasAguaPozoCliente = async (req, res) => {
  const { cliente_id, pozo_id } = req.params;
  try {
    const pozo = await Pozo.findOne({ where: { id: pozo_id, cliente_id } });
    if (!pozo) {
      return res
        .status(404)
        .json({ error: 'Pozo no encontrado para el cliente especificado' });
    }
    const resp = await MuestraAgua.findAll({
      where: { pozo_id },
      include: [
        { model: Pozo, as: 'pozo', attributes: ['nombre', 'establecimiento'] },
      ],
    });

    return res.status(200).json({
      message:
        'Muestras de Agua del Pozo para el Cliente obtenidas correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const getMuestraAguaPozoCliente = async (req, res) => {
  const { cliente_id, pozo_id, muestra_agua_id } = req.params;
  try {
    const pozo = await Pozo.findOne({ where: { id: pozo_id, cliente_id } });
    if (!pozo) {
      return res
        .status(404)
        .json({ error: 'Pozo no encontrado para el cliente especificado' });
    }
    const resp = await MuestraAgua.findOne({
      where: { pozo_id, id: muestra_agua_id },
    });

    return res.status(200).json({
      message:
        'Muestra de Agua del Pozo para el Cliente obtenida correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

const calcularDosis = (dureza) => {
  const cantAguaLitros = parseFloat(process.env.CANT_AGUA_MUESTRA_LITROS);
  const capacidadSecuestro = parseFloat(process.env.CAPACIDAD_SECUESTRO);
  return (dureza * cantAguaLitros) / capacidadSecuestro;
};
