import Calibraciones from '../models/calibraciones.js';
import Clientes from '../models/clientes.js';
import Maquinas from '../models/maquinas.js';
import MaquinaTipo from '../models/maquina_tipo.js';  
import { extractModelFields } from '../utils/payload.js';

export const addCalibraciones = async (req, res) => {
  try {
    const payload = extractModelFields(Calibraciones, req.body);
    const resp = await Calibraciones.create(payload);
    return res.status(201).json({
      message: 'Calibración creada correctamente',
      data: resp,
    });
  } catch (error) {
    console.error('Error al crear calibración:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const updateCalibraciones = async (req, res) => {
  try {
    const payload = extractModelFields(Calibraciones, req.body);

    const { calibracion_id } = req.params;
    if(!calibracion_id){
      return res.status(400).json({ error: 'Calibración ID no proporcionado' });
    }   
    const calibracion = await Calibraciones.findByPk(calibracion_id);

    if (!calibracion) {
      return res.status(404).json({ error: 'Calibración no encontrada' });
    }
    const resp = await calibracion.update(payload);

    return res.status(200).json({
      message: 'Calibración actualizada correctamente',
      data: resp,
    });
  } catch (error) {
    console.error('Error al actualizar calibración:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const calibracionesMaquinas = async (req, res) => {
  try {
    const { maquina_id } = req.params;

    const resp = await Maquinas.findOne({
      where: { id: maquina_id },
      attributes: ['id', 'tipo_maquina'],
      include: [
        {
          model: Clientes,
          as: 'cliente',
          attributes: [
            'id',
            'razon_social',
            'telefono',
            // 'email',
            // 'cuil_cuit',
            // 'ciudad',
            // 'provincia',
          ],
        },
        {
          model: Calibraciones,
          as: 'calibracionesmaquina',
        },
        {
          model: MaquinaTipo,
          as: 'tipo',
        },
      ],
    });

    if (!resp) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    return res.status(200).json({
      message: 'Calibraciones obtenidas correctamente',
      data: {
        id_maquina: resp.id,
        tipo: resp.tipo,
        /*     modelo: resp.modelo,
        marca: resp.marca, */
        cliente: resp.cliente,
        calibraciones: resp.calibracionesmaquina,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const uploadArchivoCalibracion = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);    
    if (!req.file) {
      return res.status(400).json({
        message: 'No se recibió ningún archivo',
      });
    }

    res.status(200).json({
      message: 'Archivo subido correctamente',
      file: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        campo: req.body.campo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al subir el archivo',
    });
  }
};

