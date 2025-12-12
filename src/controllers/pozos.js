import { extractModelFields } from "../utils/payload.js";
import Pozo from '../models/pozo.js';
import MuestraAgua from '../models/muestra_agua.js';

export const allPozos = async (req, res) => {
  console.log('allPozos controller');

  try {
    const resp = await Pozo.findAll();
    return res.status(200).json({
      message: 'Pozos obtenidos correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const addPozo = async (req, res) => {
  // const { tipo_maquina, marca, modelo, responsable } = req.body;
  // const { cliente_id } = req.params;
  try {
    const payload = extractModelFields(Pozo, req.body);
    payload.cliente_id = req.params.cliente_id;
    console.log('addPozos controller: payload->', payload );
    const resp = await Pozo.create(payload);

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

export const updatePozo = async (req, res) => {
  const { pozo_id } = req.params;

  try {
    const payload = extractModelFields(Pozo, req.body);
    
    const pozo = await Pozo.findByPk(pozo_id);

    if (!pozo) {
      return res.status(404).json({ error: 'Pozo no encontrada' });
    }

    const resp = await pozo.update(payload);

    return res.status(200).json({
      message: 'Pozo actualizada exitosamente',
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


