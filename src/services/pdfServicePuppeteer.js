// src/services/pdfService.js
// import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Calibraciones from '../models/calibraciones.js';
import Maquinas from '../models/maquinas.js';
import Clientes from '../models/clientes.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import { getBrowser } from './puppeteer.service.js';
import { acquireLock, releaseLock } from './pdfMutex.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';


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
    handlebars.registerHelper('eq', function (a, b) {
      return a === b;
    });

    // Helper para comparar "no igual" (opcional)
    handlebars.registerHelper('ne', function (a, b) {
      return a !== b;
    });

    // Helper para mayor que (opcional)
    handlebars.registerHelper('gt', function (a, b) {
      return a > b;
    });

    // Helper para menor que (opcional)
    handlebars.registerHelper('lt', function (a, b) {
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

        // 3. Cargar imágenes en base64
        // await this.cargarImagenesEstados(datosTemplate);

        // 4. Generar HTML desde template
        const html = await this.generarHTML(datosTemplate);

        // 5. Generar PDF con Puppeteer
        const pdfPath = await this.generarPDF(html, calibracionId);

        return {
          success: true,
          path: pdfPath,
          filename: path.basename(pdfPath)
        };

      } catch (error) {
        ultimoError = error;
        console.error(`Error en intento ${intento}/${maxReintentos}:`, error.message);

        // // Si es un error de navegador en uso, esperar y reintentar
        // if (error.message.includes('browser is already running')) {
        //   if (intento < maxReintentos) {
        //     const tiempoEspera = intento * 1000; // 1s, 2s, 3s
        //     console.log(`Esperando ${tiempoEspera}ms antes de reintentar...`);
        //     await new Promise(resolve => setTimeout(resolve, tiempoEspera));
        //     continue;
        //   }
        // }

        // Si es otro tipo de error, lanzarlo inmediatamente
        throw error;
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw ultimoError;
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
      empresa: calibracion.maquina?.cliente?.razon_social || 'Don Asdrúbal S.R.L',
      cliente_cuit: calibracion.maquina?.cliente?.cuil_cuit || '',
      maquina: calibracion.maquina?.tipo?.marca || 'N/A',
      modelo: calibracion.maquina?.tipo?.modelo || 'N/A',
      tipo_maquina: calibracion.maquina?.tipo?.tipo || 'N/A',
      ancho_trabajo: calibracion.maquina?.ancho_trabajo || 'N/A',
      distancia_picos: calibracion.maquina?.distancia_entrePicos || 'N/A',
      numero_picos: calibracion.maquina?.numero_picos || 'N/A',
      responsable: calibracion.responsable,

      // Estados de componentes (con recomendaciones e imágenes)
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
        recomendaciones: [],
        tiene_recomendaciones: false
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

    // Determinar si tiene archivo
    const nombreArchivo = estadoJSON.nombreArchivo || estadoJSON.nombre_archivo || '';
    const tieneArchivo = !!nombreArchivo;
    const imagePath = path.join(
      process.cwd(),
      'uploads',
      'calibraciones',
      nombreArchivo
    );

const imagen_src = `file:///${imagePath.replace(/\\/g, '/')}`;

    return {
      estado: estadoJSON.estado || 'NO APLICA',
      clase: claseMap[estadoJSON.estado] || 'no-aplica',
      observacion: estadoJSON.observacion || '',
      tiene_archivo: tieneArchivo,
      imagen_url: nombreArchivo
        ? imagen_src
        : '',
      nombre_archivo: imagen_src,
      recomendaciones: recomendaciones,
      tiene_recomendaciones: recomendaciones.length > 0
    };
  }

  /**
   * Convierte una imagen a base64
   */
  async convertirImagenABase64(nombreArchivo) {
    if (!nombreArchivo) return '';

    try {
      const uploadPath = path.join(process.cwd(), 'uploads', 'calibraciones');
      const rutaCompleta = path.join(uploadPath, nombreArchivo);

      // Verificar si el archivo existe
      try {
        await fs.access(rutaCompleta);
      } catch {
        console.warn(`Imagen no encontrada: ${rutaCompleta}`);
        return '';
      }

      // Leer el archivo
      const imageBuffer = await fs.readFile(rutaCompleta);

      // Detectar el tipo MIME basado en la extensión
      const extension = path.extname(nombreArchivo).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp'
      };

      const mimeType = mimeTypes[extension] || 'image/jpeg';

      // Convertir a base64
      const base64 = imageBuffer.toString('base64');
      return `data:${mimeType};base64,${base64}`;

    } catch (error) {
      console.error(`Error convirtiendo imagen ${nombreArchivo}:`, error);
      return '';
    }
  }

  /**
   * Carga las imágenes en base64 para los estados
   */
  async cargarImagenesEstados(datosTemplate) {
    const estadosConImagenes = [
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
      'estabilidadVerticalBotalon'
    ];

    for (const estadoKey of estadosConImagenes) {
      const estado = datosTemplate[estadoKey];
      if (estado && estado.tiene_archivo && estado.nombre_archivo) {
        const imagenBase64 = await this.convertirImagenABase64(estado.nombre_archivo);
        estado.imagen_src = imagenBase64;
      }
    }

    return datosTemplate;
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

      console.log('Generando HTML con datos:', datos);
      const elhtml = template(datos);
      console.log('HTML generado:', elhtml);
      return elhtml;
    } catch (error) {
      console.error('Error generando HTML:', error);
      throw new Error('Error al procesar template HTML');
    }
  }

  /**
   * Genera el PDF usando Puppeteer
   */
  async generarPDF(html, calibracionId) {
    // let browser;
    let page;

    await acquireLock(); //Nunca hay dos newPage() simultáneos
    try {
      await fs.mkdir(this.outputDir, { recursive: true });

      const filename = `calibracion_${calibracionId}_${Date.now()}.pdf`;
      const outputPath = path.join(
        process.cwd(),
        'public',
        'reports',
        filename
      );
      console.log('Generando PDF en:', outputPath);
      const browser = await getBrowser();
      page = await browser.newPage();

      // A VER SI CON ESTO ANDA
   const tempDir = path.join(process.cwd(), 'tmp');
await fs.mkdir(tempDir, { recursive: true });

const htmlPath = path.join(tempDir, `reporte_${Date.now()}.html`);
await fs.writeFile(htmlPath, html, 'utf8');

console.log('HTML generado en:', htmlPath);

      await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
        waitUntil: 'networkidle0',
        timeout: 0,
      });
      await page.pdf({ path: outputPath, format: 'A4' });


      // await page.setContent(html, {
      //   waitUntil: 'networkidle0',
      //   timeout: 120000
      // });

      // await page.pdf({
      //   path: outputPath,
      //   format: 'A4',
      //   printBackground: true,
      //   margin: {
      //     top: '20mm',
      //     bottom: '20mm',
      //     left: '15mm',
      //     right: '15mm'
      //   },
      //   displayHeaderFooter: true,
      //   headerTemplate: '<div></div>',
      //   footerTemplate: `
      //   <div style="font-size:10px;width:100%;text-align:center;color:#666;">
      //     Don Asdrúbal S.R.L – Departamento I+D —
      //     Página <span class="pageNumber"></span> de <span class="totalPages"></span>
      //   </div>
      // `
      // });
      await page.close();

      return outputPath;

    } finally {
      if (page) await page.close().catch(() => { });
      // if (browser) await browser.close().catch(() => { });
      releaseLock();
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

  /**
   * Limpia directorios temporales de Puppeteer
   */
  async limpiarDirectoriosTemporales() {
    try {
      const tmpDir = path.join(__dirname, '../../tmp');

      // Verificar si existe el directorio
      try {
        await fs.access(tmpDir);
      } catch {
        return; // No existe, no hay nada que limpiar
      }

      const archivos = await fs.readdir(tmpDir);
      const ahora = Date.now();
      const unMinuto = 60 * 1000;

      for (const archivo of archivos) {
        if (archivo.startsWith('puppeteer_')) {
          const rutaArchivo = path.join(tmpDir, archivo);
          try {
            const stats = await fs.stat(rutaArchivo);

            // Eliminar directorios temporales de más de 1 minuto
            if (ahora - stats.mtimeMs > unMinuto) {
              await fs.rm(rutaArchivo, { recursive: true, force: true });
              console.log(`Directorio temporal eliminado: ${archivo}`);
            }
          } catch (err) {
            console.error(`Error procesando ${archivo}:`, err.message);
          }
        }
      }
    } catch (error) {
      console.error('Error limpiando directorios temporales:', error);
    }
  }
}

export default new PDFServicePuppeteer();