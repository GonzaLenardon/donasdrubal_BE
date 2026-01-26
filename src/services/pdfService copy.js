// src/services/pdfService.js
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Calibraciones from '../models/calibraciones.js';
import Maquinas from '../models/maquinas.js';
import Clientes from '../models/clientes.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import { log } from 'console';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates/calibracion-report.hbs');
    this.outputDir = path.join(__dirname, '../../public/reports');
    this.registrarHelpers();
  }

  /**
   * Registra helpers personalizados de Handlebars
   */
  registrarHelpers() {
    // Helper para comparar valores (eq = equals)
    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    // Helper para comparar "no igual" (opcional)
    handlebars.registerHelper('ne', function(a, b) {
      return a !== b;
    });

    // Helper para mayor que (opcional)
    handlebars.registerHelper('gt', function(a, b) {
      return a > b;
    });

    // Helper para menor que (opcional)
    handlebars.registerHelper('lt', function(a, b) {
      return a < b;
    });
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

        // 2. Procesar datos para el template
        const datosTemplate = this.prepararDatosTemplate(calibracion);

        // 3. Generar HTML desde template
        const html = await this.generarHTML(datosTemplate);

        // 4. Generar PDF con Puppeteer
        const pdfPath = await this.generarPDF(html, calibracionId);

        return {
          success: true,
          path: pdfPath,
          filename: path.basename(pdfPath)
        };

      } catch (error) {
        ultimoError = error;
        console.error(`Error en intento ${intento}/${maxReintentos}:`, error.message);
        
        // Si es un error de navegador en uso, esperar y reintentar
        if (error.message.includes('browser is already running')) {
          if (intento < maxReintentos) {
            const tiempoEspera = intento * 1000; // 1s, 2s, 3s
            console.log(`Esperando ${tiempoEspera}ms antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, tiempoEspera));
            continue;
          }
        }
        
        // Si es otro tipo de error, lanzarlo inmediatamente
        throw error;
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw ultimoError;
  }// src/services/pdfService.js


  /**
   * Prepara los datos de calibración para el template
   */
  prepararDatosTemplate(calibracion) {

    console.log('Calibracion para preparar datos:', calibracion.toJSON());
    const fecha = new Date(calibracion.fecha);
    
    return {
      // Datos generales
      fecha: fecha.toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      empresa: calibracion.maquina?.cliente?.razon_social || 'Don Asdrúbal S.R.L',
      maquina: calibracion.maquina?.tipo?.marca || 'N/A',
      modelo: calibracion.maquina?.tipo?.modelo || 'N/A',
      tipo: calibracion.maquina?.tipo?.tipo || 'N/A',
      ancho_trabajo: calibracion.maquina?.ancho_trabajo || '0',
      distancia_picos: calibracion.maquina?.distancia_entrePicos || '0',
      numero_picos: calibracion.maquina?.numero_picos || '0',
      responsable: calibracion.responsable,

      // Estados de componentes
      estado_maquina: this.formatearEstado(calibracion.estado_maquina),
      estado_bomba: this.formatearEstado(calibracion.estado_bomba),
      estado_agitador: this.formatearEstado(calibracion.estado_agitador),
      estado_filtroPrimario: this.formatearEstado(calibracion.estado_filtroPrimario),
      estado_filtroSecundario: this.formatearEstado(calibracion.estado_filtroSecundario),
      estado_filtroLinea: this.formatearEstado(calibracion.estado_filtroLinea),
      estado_manguerayconexiones: this.formatearEstado(calibracion.estado_manguerayconexiones),
      estado_antigoteo: this.formatearEstado(calibracion.estado_antigoteo),
      estado_limpiezaTanque: this.formatearEstado(calibracion.estado_limpiezaTanque),
      estado_pastillas: this.formatearEstado(calibracion.estado_pastillas),
      estabilidadVerticalBotalon: this.formatearEstado(calibracion.estabilidadVerticalBotalon),

      // Mediciones de presión
      presion_unimap: calibracion.presion_unimap?.toFixed(2) || '0.00',
      presion_computadora: calibracion.presion_computadora?.toFixed(2) || '0.00',
      presion_manometro: calibracion.presion_manometro?.toFixed(2) || '0.00',

      // Observaciones
      observaciones_acronex: calibracion.observaciones_acronex || 'Sin observaciones',
      observaciones_generales: calibracion.Observaciones || 'Sin observaciones adicionales',

      // Calcular variación de presión
      variacion_presion: this.calcularVariacionPresion(calibracion),
      
      // Metadata
      generado: new Date().toLocaleString('es-AR'),
      responsable_informe: 'Ing. Agr. Montiel, Franco Mat: 82-2-1666'
    };
  }

  /**
   * Formatea el estado JSON de cada componente
   */
  formatearEstado(estadoJSON) {
    console.log('Formateando estado:', estadoJSON);
    if (!estadoJSON || typeof estadoJSON !== 'object') {
      return {
        estado: 'NO APLICA',
        clase: 'no-aplica',
        observacion: '',
        tiene_archivo: false,
        imagen_url: '',
        nombre_archivo: '',
        recomendaciones: []
      };
    }

    const claseMap = {
      'EXCELENTE': 'excelente',
      'Excelente': 'excelente',
      'MUY BUENO': 'muy-bueno',
      'Muy bueno': 'muy-bueno',
      'BUENO': 'bueno',
      'Bueno': 'bueno',
      'REGULAR': 'regular',
      'Regular': 'regular',
      'MALO': 'malo',
      'Malo': 'malo',
      'REVISAR': 'revisar',
      'Revisar': 'revisar',
      'NO APLICA': 'no-aplica',
      'No aplica': 'no-aplica'
    };

    // Procesar recomendaciones
    const recomendaciones = Array.isArray(estadoJSON.recomendaciones) 
      ? estadoJSON.recomendaciones.map((rec, index) => ({
          numero: index + 1,
          texto: rec.texto || rec.recomendacion || rec.descripcion || '',
          prioridad: rec.prioridad || 'media'
        }))
      : [];

    return {
      estado: estadoJSON.estado || 'NO APLICA',
      clase: claseMap[estadoJSON.estado] || 'no-aplica',
      observacion: estadoJSON.observacion || '',
      tiene_archivo: !!(estadoJSON.path || estadoJSON.nombreArchivo),
      imagen_url: estadoJSON.path || '',
      nombre_archivo: estadoJSON.nombreArchivo || estadoJSON.nombre_archivo || '',
      recomendaciones: recomendaciones,
      tiene_recomendaciones: recomendaciones.length > 0
    };
  }

  /**
   * Calcula la variación de presión entre mediciones
   */
  calcularVariacionPresion(calibracion) {
    const presiones = [
      calibracion.presion_unimap,
      calibracion.presion_computadora,
      calibracion.presion_manometro
    ].filter(p => p > 0);

    if (presiones.length === 0) return null;

    const max = Math.max(...presiones);
    const min = Math.min(...presiones);
    const variacion = ((max - min) / min * 100).toFixed(2);

    const estado = variacion < 5 ? 'MUY BUENA' : variacion < 10 ? 'BUENA' : 'REVISAR';
    const clase = variacion < 5 ? '' : variacion < 10 ? '' : 'revisar';

    return {
      valor: variacion,
      estado: estado,
      clase: clase
    };
  }

  /**
   * Genera HTML desde el template Handlebars
   */
  async generarHTML(datos) {
    try {
      const templateContent = await fs.readFile(this.templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);
      return template(datos);
    } catch (error) {
      console.error('Error generando HTML:', error);
      throw new Error('Error al procesar template HTML');
    }
  }

    /**
   * Genera el PDF usando Puppeteer
   */
  async generarPDF(html, calibracionId) {
    let browser;
    
    try {
      // Asegurar que existe el directorio de salida
      await fs.mkdir(this.outputDir, { recursive: true });

      // Nombre del archivo
      const filename = `calibracion_${calibracionId}_${Date.now()}.pdf`;
      const outputPath = path.join(this.outputDir, filename);

      // Iniciar navegador con configuración para evitar conflictos
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
        // NO usar userDataDir para evitar conflictos
      });

      const page = await browser.newPage();
      
      // Cargar HTML
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Generar PDF con configuración profesional
      await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #666;">
            <span>Don Asdrúbal S.R.L – 2026</span>
            <span style="margin-left: 20px;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
          </div>
        `
      });

      return outputPath;

    } catch (error) {
      console.error('Error en generación de PDF con Puppeteer:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Elimina PDFs antiguos (opcional - limpieza)
   */
  async limpiarPDFsAntiguos(diasRetencion = 30) {
    try {
      const archivos = await fs.readdir(this.outputDir);
      const ahora = Date.now();
      const milisegundiosRetencion = diasRetencion * 24 * 60 * 60 * 1000;

      for (const archivo of archivos) {
        const rutaArchivo = path.join(this.outputDir, archivo);
        const stats = await fs.stat(rutaArchivo);
        
        if (ahora - stats.mtimeMs > milisegundiosRetencion) {
          await fs.unlink(rutaArchivo);
          console.log(`PDF antiguo eliminado: ${archivo}`);
        }
      }
    } catch (error) {
      console.error('Error limpiando PDFs antiguos:', error);
    }
  }
}

export default new PDFService();