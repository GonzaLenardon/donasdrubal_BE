import { extractModelFields } from "../utils/payload.js";
import Jornada from '../models/jornada.js';

export const allJornadas = async (req, res) => {
  console.log('allJornadas controller');

  try {
    const resp = await Jornada.findAll();
    return res.status(200).json({
      message: 'Jornadas obtenidos correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const addJornada = async (req, res) => {
  // const { tipo_maquina, marca, modelo, responsable } = req.body;
  // const { cliente_id } = req.params;
  try {
    const payload = extractModelFields(Jornada, req.body);
    payload.cliente_id = req.params.cliente_id;
    console.log('addJornada controller: payload->', payload );
    const resp = await Jornada.create(payload);

    return res.status(201).json({
      message: 'Jornada creada exitosamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const getJornada = async (req, res) => {
  const { jornada_id } = req.params;
  console.log('getJornada controller: jornada_id->', jornada_id );     
  try {
    const jornada = await Jornada.findByPk(jornada_id);
    if (!jornada) {
      return res.status(404).json({ error: 'Jornada no encontrada' });
    }
    return res.status(200).json({
      message: 'Jornada obtenido exitosamente',
      data: jornada,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const updateJornada = async (req, res) => {
  const { jornada_id } = req.params; 
  try {
    const payload = extractModelFields(Jornada, req.body); 
    const jornada = await Jornada.findByPk(jornada_id);

    if (!jornada) {
      return res.status(404).json({ error: 'Jornada no encontrada' });
    } 
    console.log('updateJornada controller: payload->', payload );   
    const resp = await jornada.update(payload);

    return res.status(200).json({
      message: 'Jornada actualizada exitosamente', 
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',  
      details: error.message,
    });
  } 
};


export const jornadasCliente = async (req, res) => {
  const cliente_id = req.params.cliente_id;
  console.log('jornadasCliente Controllerr: cliente_id->', cliente_id);

  try {
    const resp = await Jornada.findAll({ 
      where: { cliente_id: cliente_id }
    });

    return res.status(200).json({
      message: 'Jornada de cliente_id' + cliente_id +' encontrados',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};


