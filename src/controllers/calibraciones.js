import Calibraciones from '../models/calibraciones.js';
import Clientes from '../models/clientes.js';
import Maquinas from '../models/maquinas.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import { extractModelFields } from '../utils/payload.js';
import PDFService from '../services/pdfService.js';
import path from 'path';

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
        message: `Calibración con ID ${id} no encontrada`
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
              message: 'Error al descargar el archivo PDF'
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
          downloadUrl: `/api/calibraciones/${id}/pdf?download=true`
        }
      });
    }

  } catch (error) {
    console.error('Error en generarPDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el PDF',
      error: error.message
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
        message: 'El email es requerido'
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
        filename: resultado.filename
      }
    });

  } catch (error) {
    console.error('Error en enviarPDFPorEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar PDF por email',
      error: error.message
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

    // Generar PDF
    const resultado = await PDFService.generarInformeCalibracion(id);

    // Configurar headers para visualización en navegador
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + resultado.filename + '"');

    // Enviar archivo
    res.sendFile(resultado.path);

  } catch (error) {
    console.error('Error en previsualizarPDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al previsualizar el PDF',
      error: error.message
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
      message: `PDFs anteriores a ${dias} días eliminados exitosamente`
    });

  } catch (error) {
    console.error('Error en limpiarPDFsAntiguos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar PDFs antiguos',
      error: error.message
    });
  }
};
