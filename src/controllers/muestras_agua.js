import { extractModelFields } from "../utils/payload.js";
import Pozo from '../models/pozo.js';
import MuestraAgua from '../models/muestra_agua.js';

export const allMuetrasAgua = async (req, res) => {
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
  try {
    const payload = extractModelFields(MuestraAgua, req.body);
    payload.pozo_id = req.params.pozo_id;
    console.log('addPozos controller: payload->', payload );
    const resp = await MuestraAgua.create(payload);

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

export const updateMuestraAgua = async (req, res) => {
  const { muestra_agua_id } = req.params;

  try {
    const payload = extractModelFields(MuestraAgua, req.body);
    
    const muetras_agua = await MuestraAgua.findByPk(muestra_agua_id);

    if (!muetras_agua) {
      return res.status(404).json({ error: 'Muestra Agua no encontrada' });
    }

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

export const pozosCliente = async (req, res) => {
  const cliente_id = req.params.cliente_id;
  console.log('pozosCliente Controllerr: cliente_id->', cliente_id);

  try {
    const resp = await Pozo.findAll({ 
      where: { cliente_id: cliente_id }
    });

    return res.status(200).json({
      message: 'Pozos de cliente_id' + cliente_id +' encontrados',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};


