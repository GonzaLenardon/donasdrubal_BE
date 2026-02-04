import Calibraciones from '../models/calibraciones.js';
import Clientes from '../models/clientes.js';
import Maquinas from '../models/maquinas.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import { extractModelFields } from '../utils/payload.js';
import PDFService from '../services/pdfService.js';
import path from 'path';

// Lista de campos que son JSON
const CAMPOS_ESTADO_JSON = [
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
  'mixer',
];

// Estructura por defecto de un estado
const ESTADO_DEFAULT = {
  estado: '',
  modelo: '',
  materiales: '',
  observacion: '',
  nombreArchivo: '',
  color: '',
  numero: '',
  presenciaORing: '',
  path: '',
  recomendaciones: [],
};

/**
 * Parsea todos los campos JSON del body de la request
 * @param {Object} body - Body de la request
 * @returns {Object} Body con campos parseados
 */
export const parseJSONFields = (body) => {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const bodyParsed = { ...body };

  // Parsear cada campo de estado
  for (const campo of CAMPOS_ESTADO_JSON) {
    if (bodyParsed[campo]) {
      bodyParsed[campo] = parseEstadoField(bodyParsed[campo]);
    }
  }

  return bodyParsed;
};

/**
 * Parsea un campo individual que puede ser string JSON
 * @param {string|Object} field - Campo a parsear
 * @returns {Object} Campo parseado y normalizado
 */

const parseEstadoField = (field) => {
  // Si ya es objeto, normalizar directamente
  if (typeof field === 'object' && field !== null) {
    return normalizeEstadoObject(field);
  }

  // Si es string, intentar parsear
  if (typeof field === 'string') {
    try {
      let parsed = JSON.parse(field);

      // Parseo doble en caso de double-encoding
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      return normalizeEstadoObject(parsed);
    } catch (error) {
      console.warn(`⚠️ Error parseando campo:`, error.message);
      return getDefaultEstado();
    }
  }

  // Valor no válido
  return getDefaultEstado();
};

/**
 * Normaliza un objeto de recomendación
 * @param {Object|string} rec - Recomendación a normalizar
 * @returns {Object} Recomendación normalizada
 */
const normalizeRecomendacion = (rec) => {
  if (typeof rec === 'object' && rec !== null) {
    return {
      id: rec.id || Date.now() + Math.random(), // Evitar IDs duplicados
      texto: rec.texto || '',
      fecha: rec.fecha || new Date().toISOString(),
    };
  }

  return {
    id: Date.now() + Math.random(),
    texto: String(rec || ''),
    fecha: new Date().toISOString(),
  };
};

/**
 * Normaliza un objeto de estado componente
 * @param {Object} obj - Objeto a normalizar
 * @returns {Object} Objeto normalizado con todos los campos
 */
const normalizeEstadoObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return { ...ESTADO_DEFAULT };
  }

  return {
    estado: obj.estado || '',
    modelo: obj.modelo || '', // ✅ CRÍTICO: Incluir modelo
    materiales: obj.materiales || '', // ✅ CRÍTICO: Incluir materiales
    observacion: obj.observacion || '',
    nombreArchivo: obj.nombreArchivo || obj.nombre_archivo || '',
    color: obj.color || '',
    presenciaORing: obj.presenciaORing || '',
    numero: obj.numero || '',
    path: obj.path || '',
    recomendaciones: Array.isArray(obj.recomendaciones)
      ? obj.recomendaciones.map(normalizeRecomendacion)
      : [],
  };
};

/**
 * Retorna un objeto de estado por defecto
 * @returns {Object} Estado por defecto
 */
const getDefaultEstado = () => ({ ...ESTADO_DEFAULT });

/**
 * Valida y asegura la estructura de recomendaciones
 * @param {Object} bodyParsed - Body ya parseado
 * @returns {Object} Body validado
 */
const validateRecomendaciones = (bodyParsed) => {
  for (const campo of CAMPOS_ESTADO_JSON) {
    if (bodyParsed[campo]) {
      // Asegurar que recomendaciones sea array
      if (!Array.isArray(bodyParsed[campo].recomendaciones)) {
        bodyParsed[campo].recomendaciones = [];
      }

      // Validar cada recomendación
      bodyParsed[campo].recomendaciones = bodyParsed[campo].recomendaciones
        .filter((rec) => rec && rec.texto) // Eliminar vacías
        .map(normalizeRecomendacion); // Normalizar
    }
  }

  return bodyParsed;
};

export const addCalibraciones = async (req, res) => {
  try {
    // 1. Parsear campos JSON
    let bodyParsed = parseJSONFields(req.body);

    // 2. Validar estructura
    bodyParsed = validateRecomendaciones(bodyParsed);

    // 3. Extraer solo campos del modelo
    const payload = extractModelFields(Calibraciones, bodyParsed);

    // 4. Log para debugging (remover en producción)
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Payload a guardar:', {
        ...payload,
        estado_bomba: payload.estado_bomba,
      });
    }

    // 5. Crear registro
    const nuevaCalibracion = await Calibraciones.create(payload);

    return res.status(201).json({
      message: 'Calibración creada correctamente',
      data: nuevaCalibracion,
    });
  } catch (error) {
    console.error('❌ Error al crear calibración:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Actualiza una calibración existente
 */
export const updateCalibraciones = async (req, res) => {
  try {
    const { calibracion_id } = req.params;

    // 1. Validar ID
    if (!calibracion_id) {
      return res.status(400).json({
        error: 'ID no proporcionado',
      });
    }

    // 2. Parsear y validar campos JSON
    let bodyParsed = parseJSONFields(req.body);
    bodyParsed = validateRecomendaciones(bodyParsed);

    // 3. Extraer campos del modelo
    const payload = extractModelFields(Calibraciones, bodyParsed);

    // 4. Log para debugging (remover en producción)
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Actualizando calibración:', calibracion_id);
      console.log('📦 Payload:', {
        ...payload,
        estado_bomba: payload.estado_bomba,
      });
    }

    // 5. Buscar registro
    const calibracion = await Calibraciones.findByPk(calibracion_id);

    if (!calibracion) {
      return res.status(404).json({
        error: 'Calibración no encontrada',
      });
    }

    // 6. Actualizar
    const calibracionActualizada = await calibracion.update(payload);

    return res.status(200).json({
      message: 'Calibración actualizada correctamente',
      data: calibracionActualizada,
    });
  } catch (error) {
    console.error('❌ Error al actualizar calibración:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
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

// METODOS PARA GENERAR PDF DE CALIBRACIONES//

/**
 * GET /api/calibraciones/:id/pdf
 * Genera y descarga el PDF de una calibración
 */
export const generarPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { download = true } = req.query; // ?download=true para forzar descarga

    // Validar que existe la calibración
    const calibracion = await Calibraciones.findByPk(id);
    if (!calibracion) {
      return res.status(404).json({
        success: false,
        message: `Calibración con ID ${id} no encontrada`,
      });
    }

    // Generar PDF
    const resultado = await PDFService.generarInformeCalibracion(id);

    if (download === 'true' || download === true) {
      // Descargar archivo
      res.download(resultado.path, resultado.filename, (err) => {
        if (err) {
          console.error('Error al enviar archivo:', err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: 'Error al descargar el archivo PDF',
            });
          }
        }
      });
    } else {
      // Retornar información del archivo
      res.json({
        success: true,
        message: 'PDF generado exitosamente',
        data: {
          filename: resultado.filename,
          path: `/reports/${resultado.filename}`,
          downloadUrl: `/api/calibraciones/${id}/pdf?download=true`,
        },
      });
    }
  } catch (error) {
    console.error('Error en generarPDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el PDF',
      error: error.message,
    });
  }
};

/**
 * POST /api/calibraciones/:id/email-pdf
 * Genera PDF y lo envía por email (funcionalidad futura)
 */
export const enviarPDFPorEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido',
      });
    }

    // Generar PDF
    const resultado = await PDFService.generarInformeCalibracion(id);

    // TODO: Implementar servicio de email
    // await EmailService.enviarPDF(email, resultado.path);

    res.json({
      success: true,
      message: `PDF enviado exitosamente a ${email}`,
      data: {
        filename: resultado.filename,
      },
    });
  } catch (error) {
    console.error('Error en enviarPDFPorEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar PDF por email',
      error: error.message,
    });
  }
};

/**
 * GET /api/calibraciones/:id/preview-pdf
 * Visualiza el PDF en el navegador
 */
export const previsualizarPDF = async (req, res) => {
  try {
      const { id } = req.params;

      const resultado = await PDFService.generarInformeCalibracion(id);

      if (!resultado.success || !resultado.path) {
        throw new Error('No se pudo generar el PDF');
      }

      // Redirige directamente al PDF generado por PHP
      // return res.redirect(resultado.path);
      return res.sendFile(
            path.resolve(resultado.path),
            {
              headers: {
                'Content-Type': 'application/pdf'
              }
            }
          );      

    } catch (error) {
      console.error('Error en previsualizarPDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error al previsualizar el PDF',
        error: error.message,
      });
    }
  };


/**
 * DELETE /api/calibraciones/pdfs/cleanup
 * Limpia PDFs antiguos (admin only)
 */
export const limpiarPDFsAntiguos = async (req, res) => {
  try {
    const { dias = 30 } = req.query;

    await PDFService.limpiarPDFsAntiguos(parseInt(dias));

    res.json({
      success: true,
      message: `PDFs anteriores a ${dias} días eliminados exitosamente`,
    });
  } catch (error) {
    console.error('Error en limpiarPDFsAntiguos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar PDFs antiguos',
      error: error.message,
    });
  }
};
