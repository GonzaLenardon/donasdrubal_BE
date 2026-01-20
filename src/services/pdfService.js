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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFService {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates/calibracion-report.hbs');
    this.outputDir = path.join(__dirname, '../../uploads/reports');
  }

  /**
   * Genera el PDF de una calibración específica
   */
  async generarInformeCalibracion(calibracionId) {
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
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  /**
   * Prepara los datos de calibración para el template
   */
  prepararDatosTemplate(calibracion) {
    const fecha = new Date(calibracion.fecha);
    
    return {
      // Datos generales
      fecha: fecha.toLocaleDateString('es-AR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      empresa: calibracion.cliente?.razon_social || 'Don Asdrúbal S.R.L',
      maquina: calibracion.maquina?.tipo?.nombre || 'N/A',
      modelo: calibracion.maquina?.tipo?.modelo || 'N/A',
      ancho_trabajo: calibracion.maquina?.ancho_trabajo || 'N/A',
      distancia_picos: calibracion.maquina?.distancia_picos || 'N/A',
      numero_picos: calibracion.maquina?.numero_picos || 'N/A',
      responsable: calibracion.responsable || 'N/A',

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
    if (!estadoJSON || typeof estadoJSON !== 'object') {
      return {
        estado: 'NO APLICA',
        clase: 'no-aplica',
        observacion: '',
        tiene_archivo: false
      };
    }

    const claseMap = {
      'EXCELENTE': 'excelente',
      'MUY BUENO': 'muy-bueno',
      'BUENO': 'bueno',
      'REGULAR': 'regular',
      'MALO': 'malo',
      'REVISAR': 'revisar',
      'NO APLICA': 'no-aplica'
    };

    return {
      estado: estadoJSON.estado || 'NO APLICA',
      clase: claseMap[estadoJSON.estado] || 'no-aplica',
      observacion: estadoJSON.observacion || '',
      tiene_archivo: !!estadoJSON.path,
      nombre_archivo: estadoJSON.nombre_archivo || ''
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

    if (presiones.length === 0) return 'N/A';

    const max = Math.max(...presiones);
    const min = Math.min(...presiones);
    const variacion = ((max - min) / min * 100).toFixed(2);

    return {
      valor: variacion,
      estado: variacion < 5 ? 'MUY BUENA' : variacion < 10 ? 'BUENA' : 'REVISAR'
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

      // Iniciar navegador
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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
            <span>Don Asdrúbal S.R.L – Departamento I+D</span>
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