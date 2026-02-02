// src/services/pdfService.js
// import puppeteer from 'puppeteer';
// import handlebars from 'handlebars';
// import os from 'os';

import axios from 'axios';
import Calibraciones from '../models/calibraciones.js';
import Maquinas from '../models/maquinas.js';
import Clientes from '../models/clientes.js';
import MaquinaTipo from '../models/maquina_tipo.js';

// const BASE_URL = 'https://donasdrubal.com.ar';
const BASE_URL = 'http://localhost:3000';
const pdfAxios = axios.create(); // sin interceptores

function normalizarImagen(nombreArchivo) {
  if (!nombreArchivo) return null;
  return `${BASE_URL}/uploads/calibraciones/${nombreArchivo}`;
}
class PDFService {
  constructor() {
    // this.templatePath = path.join(__dirname, '../templates/calibracion-report.hbs');
    // this.outputDir = path.join(__dirname, '../../public/reports');
  }

  /**
   * Genera el PDF de una calibración específica
   */
  async generarInformeCalibracion(calibracionId) {
    const maxReintentos = 3;
    let ultimoError;

    for (let intento = 1; intento <= maxReintentos; intento++) {
      try {
        // 1. Obtener datos de la calibración con relaciones
        const calibracion = await Calibraciones.findByPk(calibracionId, {
          minifyAliases: true,
          include: [
            {
              model: Maquinas,
              as: 'maquina',
              attributes: [
                'id',
                'ancho_trabajo',
                'distancia_entrePicos',
                'numero_picos',
                'tipo_maquina',
                'cliente_id'
              ],
              include: [
                {
                  model: MaquinaTipo,
                  as: 'tipo',
                  attributes: ['id', 'tipo', 'marca', 'modelo']
                },
                {
                  model: Clientes,
                  as: 'cliente',
                  attributes: ['id', 'razon_social', 'cuil_cuit']
                }
              ]
            }
          ]
        });

        if (!calibracion) {
          throw new Error(`Calibración con ID ${calibracionId} no encontrada`);
        }
        console.log('Calibración encontrada:', calibracion.toJSON());

        const datos = this.prepararDatos(calibracion);
        console.log('JSON ENVIADO A PHP:', JSON.stringify(datos, null, 2));

        return await this.generarPDFviaPHP(datos);


        // return {
        //   success: true,
        //   path: pdfPath,
        //   filename: path.basename(pdfPath)
        // };

      } catch (error) {
        console.error(`Error al generar el PDF`, error.message);
        throw error;
      }
    }  
  }

prepararDatos(calibracion) {
  const c = calibracion.toJSON();

const normalizarEstado = (e = {}) => ({
  estado: e.estado || 'NO APLICA',
  observacion: e.observacion || '',
  color: e.color || '',
  numero: e.numero || '',
  modelo: e.modelo || '',
  materiales: e.materiales || '',
  presenciaORing: e.presenciaORing || '',

  imagen: normalizarImagen(e.nombreArchivo),

  recomendaciones: Array.isArray(e.recomendaciones)
    ? e.recomendaciones.map(r => ({
        texto: r.texto || r.recomendacion || '',
        prioridad: r.prioridad || 'media'
      }))
    : []
});


  // Presiones por sección
  let secciones = [];
  try {
    const parsed = JSON.parse(c.secciones || '{}');
    secciones = Object.entries(parsed).map(([k, v]) => ({
      seccion: k,
      presion: v
    }));
  } catch {
    secciones = [];
  }

  return {
    id: c.id,
    fecha: c.fecha,
    responsable: c.responsable,

    cliente: {
      razon_social: c.maquina?.cliente?.razon_social || '',
      cuil_cuit: c.maquina?.cliente?.cuil_cuit || ''
    },

    maquina: {
      tipo: c.maquina?.tipo?.tipo || '',
      marca: c.maquina?.tipo?.marca || '',
      modelo: c.maquina?.tipo?.modelo || '',
      ancho_trabajo: c.maquina?.ancho_trabajo || 0,
      distancia_picos: c.maquina?.distancia_entrePicos || 0,
      numero_picos: c.maquina?.numero_picos || 0
    },

    estados: {
      maquina: normalizarEstado(c.estado_maquina),
      bomba: normalizarEstado(c.estado_bomba),
      agitador: normalizarEstado(c.estado_agitador),
      filtro_primario: normalizarEstado(c.estado_filtroPrimario),
      filtro_secundario: normalizarEstado(c.estado_filtroSecundario),
      filtro_linea: normalizarEstado(c.estado_filtroLinea),
      mangueras: normalizarEstado(c.estado_manguerayconexiones),
      antigoteo: normalizarEstado(c.estado_antigoteo),
      limpieza_tanque: normalizarEstado(c.estado_limpiezaTanque),
      pastillas: normalizarEstado(c.estado_pastillas),
      botalon: normalizarEstado(c.estabilidadVerticalBotalon),
      mixer: normalizarEstado(c.mixer)
    },

    presiones: {
      unimap: c.presion_unimap || 0,
      computadora: c.presion_computadora || 0,
      manometro: c.presion_manometro || 0,
      secciones
    },

    observaciones: {
      acronex: c.observaciones_acronex || '',
      generales: c.Observaciones || ''
    }
  };
}


  async generarPDFviaPHP(datos) {
    const PHP_PDF_URL =
  'http://donasdrubal_be.test/otra_cosa/generar_pdf_calibracion.php';
  console.log('➡️ Llamando a PHP:', PHP_PDF_URL);

    const response = await pdfAxios.post(
      PHP_PDF_URL,
      datos,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  }
}

export default new PDFService();