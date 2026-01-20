import Calibraciones from '../models/calibraciones.js';
import Clientes from '../models/clientes.js';
import Maquinas from '../models/maquinas.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import { extractModelFields } from '../utils/payload.js';

// Lista de campos que son JSON
const camposEstadoJSON = [
  'estado_maquina',
  'estado_bomba',
  'estado_agitador',
  'estado_filtroPrimario',
  'estado_filtroSecundario',
  'estado_filtroLinea',
  'estado_manguerayconexiones',
  'estado_antigoteo',
  'estado_limpiezaTanque',
  'estado_pastillas',
  'estabilidadVerticalBotalon',
];

// ✅ Función que itera sobre TODO el body
export const parseJSONFields = (body) => {
  const bodyParsed = { ...body };

  // ⭐ Iterar sobre cada campo JSON
  for (const campo of camposEstadoJSON) {
    if (bodyParsed[campo]) {
      bodyParsed[campo] = parseEstadoField(bodyParsed[campo]);
    }
  }

  return bodyParsed;
};

// ✅ Función que parsea UN campo individual
const parseEstadoField = (field) => {
  if (typeof field === 'string') {
    try {
      let parsed = JSON.parse(field);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      return normalizeEstadoObject(parsed);
    } catch (error) {
      return getDefaultEstado();
    }
  }
  // ...
};

const normalizeEstadoObject = (obj) => {
  return {
    estado: obj.estado || '',
    observacion: obj.observacion || '',
    nombreArchivo: obj.nombreArchivo || obj.nombre_archivo || '',
    path: obj.path || '',
    // ✅ CRÍTICO: Asegurar array
    recomendaciones: Array.isArray(obj.recomendaciones)
      ? obj.recomendaciones.map(normalizeRecomendacion)
      : [],
  };
};

const normalizeRecomendacion = (rec) => {
  if (typeof rec === 'object' && rec !== null) {
    return {
      id: rec.id || Date.now(),
      texto: rec.texto || '',
      fecha: rec.fecha || new Date().toISOString(),
    };
  }
  return {
    id: Date.now(),
    texto: String(rec || ''),
    fecha: new Date().toISOString(),
  };
};

export const addCalibraciones = async (req, res) => {
  try {
    // Parsear campos JSON
    const bodyParsed = parseJSONFields(req.body);

    const payload = extractModelFields(Calibraciones, bodyParsed);

    const nuevaCalibracion = await Calibraciones.create(payload);

    return res.status(201).json({
      message: 'Calibración creada correctamente',
      data: nuevaCalibracion,
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
    const { calibracion_id } = req.params;

    console.log('esto llega del body', req.body);

    if (!calibracion_id) {
      return res.status(400).json({ error: 'ID no proporcionado' });
    }

    // ✅ Este helper ahora maneja recomendaciones correctamente
    const bodyParsed = parseJSONFields(req.body);

    // ✅ Validación adicional (opcional pero recomendada)
    const camposEstado = [
      'estado_maquina',
      'estado_bomba',
      'estado_agitador',
      // ... todos los campos
    ];

    for (const campo of camposEstado) {
      if (bodyParsed[campo]) {
        if (!Array.isArray(bodyParsed[campo].recomendaciones)) {
          bodyParsed[campo].recomendaciones = [];
        }
      }
    }

    const payload = extractModelFields(Calibraciones, bodyParsed);
    const calibracion = await Calibraciones.findByPk(calibracion_id);

    if (!calibracion) {
      return res.status(404).json({ error: 'No encontrada' });
    }

    const resp = await calibracion.update(payload);

    return res.status(200).json({
      message: 'Actualizada correctamente',
      data: resp,
    });
  } catch (error) {
    console.error('Error:', error);
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
          attributes: ['id', 'razon_social', 'telefono'],
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
