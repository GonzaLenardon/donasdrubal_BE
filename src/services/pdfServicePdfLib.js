// src/services/pdfServicePdfLib.js

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import Calibraciones from '../models/calibraciones.js';
import Maquinas from '../models/maquinas.js';
import Clientes from '../models/clientes.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import * as pdfUtils from '../utils/pdfText.js';

class PDFServicePdfLib {

  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'reports');
  }

  // ===============================
  // MÉTODO PRINCIPAL
  // ===============================
  async generarInformeCalibracion(calibracionId) {

    const calibracion = await Calibraciones.findByPk(calibracionId, {
      include: [
        {
          model: Maquinas,
          as: 'maquina',
          include: [
            { model: MaquinaTipo, as: 'tipo' },
            { model: Clientes, as: 'cliente' }
          ]
        }
      ]
    });

    if (!calibracion) {
      throw new Error('Calibración no encontrada');
    }
    console.log('Calibración encontrada:', calibracion.toJSON());
    const datos = this.prepararDatosTemplate(calibracion);
    console.log('Datos preparados para PDF:', datos);

    await fs.mkdir(this.outputDir, { recursive: true });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);


    let page = this.dibujarDashboardResumen(pdfDoc, datos, font, fontBold);
    page = pdfDoc.addPage(); // segunda página comienza informe detallado
    const { width, height } = page.getSize();

    let cursorY = height - 60;
    const margin = 40;

    // ===============================
    // HEADER
    // ===============================

    page.drawRectangle({
      x: 0,
      y: height - 60,
      width,
      height: 60,
      color: rgb(0.1, 0.4, 0.2)
    });

    page.drawText('INFORME DE CALIBRACIÓN', {
      x: margin,
      y: height - 35,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText(`Fecha: ${datos.fecha}`, {
      x: margin,
      y: height - 50,
      size: 10,
      font,
      color: rgb(1, 1, 1)
    });

    cursorY -= 30;

    // ===============================
    // COMPONENTES
    // ===============================

    const componentes = [
      { titulo: 'Máquina', data: datos.estado_maquina, tipo: 'normal' },
      { titulo: 'Bomba', data: datos.estado_bomba, tipo: 'normal' },
      { titulo: 'Agitador', data: datos.estado_agitador, tipo: 'normal' },

      { titulo: 'Filtro Primario', data: datos.estado_filtroPrimario, tipo: 'filtro' },
      { titulo: 'Filtro Secundario', data: datos.estado_filtroSecundario, tipo: 'filtro' },
      { titulo: 'Filtro Línea', data: datos.estado_filtroLinea, tipo: 'filtro' },

      { titulo: 'Mangueras y Conexiones', data: datos.estado_manguerayconexiones, tipo: 'normal' },
      { titulo: 'Antigoteo', data: datos.estado_antigoteo, tipo: 'normal' },
      { titulo: 'Limpieza Tanque', data: datos.estado_limpiezaTanque, tipo: 'normal' },
      { titulo: 'Pastillas', data: datos.estado_pastillas, tipo: 'normal' },
      { titulo: 'Estabilidad Vertical Botalón', data: datos.estabilidadVerticalBotalon, tipo: 'normal' },
      { titulo: 'Mixer', data: datos.mixer, tipo: 'normal' }
    ];


    for (const comp of componentes) {

      const alturaCard = await this.calcularAlturaCard(comp, font, width, margin, pdfDoc);

      if (cursorY - alturaCard < 60) {
        page = pdfDoc.addPage();
        cursorY = height - 60;
      }

      // ===== Fondo Card =====
      page.drawRectangle({
        x: margin,
        y: cursorY - alturaCard,
        width: width - margin * 2,
        height: alturaCard,
        color: rgb(0.97, 0.97, 0.97),
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1
      });

      // ===== Título =====
      page.drawText(pdfUtils.sanitizeText(comp.titulo), {
        x: margin + 10,
        y: cursorY - 20,
        size: 12,
        font: fontBold
      });

      // ===== Badge color estado =====
      const colorEstado = this.getColorEstado(comp.data.estado);

      page.drawRectangle({
        x: width - margin - 110,
        y: cursorY - 25,
        width: 90,
        height: 18,
        color: colorEstado
      });

      page.drawText(comp.data.estado, {
        x: width - margin - 105,
        y: cursorY - 20,
        size: 9,
        font,
        color: rgb(1, 1, 1)
      });

      let lineaY = cursorY - 45;

      const estado = comp.data;

      // ================= FILTROS (solo si aplica) =================

      if (comp.tipo === 'filtro') {

        if (estado.color) {
          page.drawText(`Color: ${estado.color}`, {
            x: margin + 15,
            y: lineaY,
            size: 9,
            font
          });
          lineaY -= 14;
        }

        if (estado.numero !== '' && estado.numero !== null) {
          page.drawText(`Número: ${estado.numero}`, {
            x: margin + 15,
            y: lineaY,
            size: 9,
            font
          });
          lineaY -= 14;
        }

        if (estado.presenciaORing) {
          page.drawText(`O-Ring: ${estado.presenciaORing}`, {
            x: margin + 15,
            y: lineaY,
            size: 9,
            font
          });
          lineaY -= 14;
        }

        lineaY -= 5;
      }

      // ================= OBSERVACIÓN =================

      if (estado.observacion) {

        page.drawText('Observación:', {
          x: margin + 15,
          y: lineaY,
          size: 9,
          font: fontBold
        });

        lineaY -= 14;

        const obsLines = pdfUtils.wrapText(
          estado.observacion,
          font,
          9,
          width - margin * 2 - 40
        );

        obsLines.forEach(line => {
          page.drawText(pdfUtils.sanitizeText(line), {
            x: margin + 25,
            y: lineaY,
            size: 9,
            font
          });
          lineaY -= 12;
        });

      }

      // ================= RECOMENDACIONES =================

      if (Array.isArray(estado.recomendaciones) && estado.recomendaciones.length > 0) {

        page.drawText('Recomendaciones:', {
          x: margin + 15,
          y: lineaY,
          size: 9,
          font: fontBold
        });

        lineaY -= 14;

        estado.recomendaciones.forEach((rec, index) => {
          const textoNumerado = `${index + 1}. ${rec.texto}`;
          const recLines = pdfUtils.wrapText(
            textoNumerado,
            font,
            9,
            width - margin * 2 - 40
          );

          recLines.forEach(line => {
            page.drawText(pdfUtils.sanitizeText(line), {
              x: margin + 25,
              y: lineaY,
              size: 9,
              font
            });
            lineaY -= 12;
          });

          lineaY -= 4;
        });
      }

      // ================= IMAGEN =================

      if (estado.nombre_archivo) {
        const imgData = await this.getImageDimensions(pdfDoc, estado.nombre_archivo);

        if (imgData) {
          page.drawImage(imgData.image, {
            x: margin + 15,
            y: lineaY - imgData.height,
            width: imgData.width,
            height: imgData.height
          });

          lineaY -= imgData.height + 10;
        }
      }

      // ================= SUGERENCIAS PREVENTIVAS =================

      const sugerenciasFijas = this.getSugerenciasPredeterminadas(comp.titulo);
      if (sugerenciasFijas.length > 0) {
        lineaY -= 5;
        page.drawText('Sugerencias preventivas:', {
          x: margin + 15,
          y: lineaY,
          size: 9,
          font: fontBold
        });
        lineaY -= 14;
        sugerenciasFijas.forEach((texto, index) => {
          const textoNumerado = `${index + 1}. ${texto}`;
          const recLines = pdfUtils.wrapText(
            textoNumerado,
            font,
            9,
            width - margin * 2 - 40
          );

          recLines.forEach(line => {
            page.drawText(pdfUtils.sanitizeText(line), {
              x: margin + 25,
              y: lineaY,
              size: 9,
              font
            });
            lineaY -= 12;
          });

          lineaY -= 4;
        });
      }
      cursorY -= alturaCard + 20;
    }

    // ================= TABLA PRESIONES =================

    const tablaAltura = 100;

    if (cursorY - tablaAltura < 60) {
      page = pdfDoc.addPage();
      cursorY = height - 60;
    }

    page.drawText('TABLA TÉCNICA DE PRESIONES', {
      x: margin,
      y: cursorY,
      size: 14,
      font: fontBold
    });

    cursorY -= 25;

    const columnas = [
      ['Unimap', datos.presion_unimap.valor],
      ['Computadora', datos.presion_computadora.valor],
      ['Manómetro', datos.presion_manometro.valor]
    ];

    for (const [label, valor] of columnas) {
      page.drawRectangle({
        x: margin,
        y: cursorY - 20,
        width: width - margin * 2,
        height: 20,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1
      });

      page.drawText(label, {
        x: margin + 10,
        y: cursorY - 15,
        size: 10,
        font
      });

      page.drawText(`${valor} bar`, {
        x: width - margin - 80,
        y: cursorY - 15,
        size: 10,
        font
      });

      cursorY -= 20;
    }

    // =========== IMAGENES PRESIONES =====================
      // ================= IMAGEN =================
      let margen_x_img = margin;
      let presure_img_height = 0;
      if (datos.presion_manometro.nombreArchivo) {
        const image = await this.embedImage(pdfDoc, datos.presion_manometro.nombreArchivo);
        if (image) {
          const img = image.scale(0.25);
          presure_img_height = img.height;
          page.drawImage(image, {
            x: margen_x_img,
            y: cursorY - 120,
            width: 160,
            height: 120
          });
          // lineaY -= img.height + 10;
          margen_x_img += 160 + 20;
        }
      }    

      if (datos.presion_computadora.nombreArchivo) {
        const image = await this.embedImage(pdfDoc, datos.presion_computadora.nombreArchivo);
        if (image) {
          const img = image.scale(0.25);
          presure_img_height = img.height;
          page.drawImage(image, {
            x: margen_x_img,
            y: cursorY - 120,
            width: 160,
            height: 120
          });
          // lineaY -= img.height + 10;
          margen_x_img += 160 + 20;
        }
      }  
      if (datos.presion_unimap.nombreArchivo) {
        const image = await this.embedImage(pdfDoc, datos.presion_unimap.nombreArchivo);
        if (image) {
          const img = image.scale(0.25);
          presure_img_height = img.height;
          page.drawImage(image, {
            x: margen_x_img,
            y: cursorY - 120,
            width: 160,
            height: 120
          });
          

          // margen_x_img += img.width + 20;
        }
      }    
      cursorY -= 120 + 10;    


    // ================= GRAFICA SECCIONES =================
    const seccionesArray = Object.entries(datos.secciones || {})
      .sort((a, b) => Number(a[0]) - Number(b[0]));

    if (cursorY - 240 < 50) {
      page = pdfDoc.addPage();
      cursorY = page.getHeight() - 50;
    }

    if (seccionesArray.length > 0) {
      const graficaBuffer = await this.generarGraficaSecciones(seccionesArray.map(([numero, valor]) => ({
        numero: Number(numero),
        valor: Number(valor)
      })));

      if (graficaBuffer) {
        const image = await pdfDoc.embedPng(graficaBuffer);
        const imgWidth = 450;
        const imgHeight = 220;

        page.drawImage(image, {
          x: margin,
          y: cursorY - imgHeight,
          width: imgWidth,
          height: imgHeight
        });

        cursorY -= imgHeight + 20;
      }

    }
    // ========FIN GRAFICA SECCIONES

    // ================= FOOTER =================

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    pages.forEach((p, index) => {
      p.drawLine({
        start: { x: 40, y: 50 },
        end: { x: p.getWidth() - 40, y: 50 },
        thickness: 0.5,
        color: rgb(0.8, 0.8, 0.8)
      });

      p.drawText(
        `Don Asdrúbal S.R.L – Departamento I+D — Página ${index + 1} de ${totalPages}`,
        {
          x: 60,
          y: 35,
          size: 9,
          font
        }
      );
    });

    // ===============================
    // GUARDAR PDF
    // ===============================

    const pdfBytes = await pdfDoc.save();
    const filename = `calibracion_${calibracionId}_${Date.now()}.pdf`;
    const outputPath = path.join(this.outputDir, filename);
    // // CODIGO PARA OBLIGAR A DESCARGAR EL ARCHIVO
    // return {
    //   pdfBytes,
    //   filename: `calidad_agua_${Date.now()}.pdf`
    // };

    // CODIGO DE ABAJO SI SE QUIERE GUARDAR E ARCHIVO EN EL SERVIDOR EN LUGAR DE RETORNAR LOS BYTES PARA DESCARGA DIRECTA 
    await fs.writeFile(outputPath, pdfBytes);

    return {
      success: true,
      path: outputPath,
      filename
    };
  }

  // ===============================
  // RESUMEN GENERAL PAGIN INICIAL
  // ===============================
  dibujarDashboardResumen(pdfDoc, datos, font, fontBold) {

    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    const margin = 50;
    let cursorY = height - 60;

    // ================= HEADER DASHBOARD =================

    const headerHeight = 90;

    page.drawRectangle({
      x: 0,
      y: height - headerHeight,
      width,
      height: headerHeight,
      color: rgb(0.08, 0.35, 0.18)
    });

    page.drawText('RESUMEN GENERAL DE CALIBRACIÓN', {
      x: margin,
      y: height - 30,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    // Cliente
    page.drawText(`Cliente: ${datos.maquina.cliente?.razon_social || '-'}`, {
      x: margin,
      y: height - 50,
      size: 10,
      font,
      color: rgb(1, 1, 1)
    });

    page.drawText(`Dirección: ${datos.maquina.cliente?.direccion || '-'}`, {
      x: margin,
      y: height - 65,
      size: 10,
      font,
      color: rgb(1, 1, 1)
    });

    // Máquina (lado derecho)
    page.drawText(`Marca: ${datos.maquina?.tipo.marca || '-'}`, {
      x: width / 2,
      y: height - 50,
      size: 10,
      font,
      color: rgb(1, 1, 1)
    });

    page.drawText(`Modelo: ${datos.maquina?.tipo.modelo || '-'}`, {
      x: width / 2,
      y: height - 65,
      size: 10,
      font,
      color: rgb(1, 1, 1)
    });

    page.drawText(`Tipo: ${datos.maquina?.tipo.tipo || '-'}`, {
      x: width / 2,
      y: height - 80,
      size: 10,
      font,
      color: rgb(1, 1, 1)
    });

    cursorY = height - headerHeight - 30;

    // ================= SEPARADOR =================

    cursorY -= 5;

    page.drawRectangle({
      x: margin,
      y: cursorY,
      width: width - margin * 2,
      height: 1,
      color: rgb(0.85, 0.85, 0.85)
    });

    cursorY -= 15;
    //-----------------------------------------------

    // ================= COMPONENTES DETALLADOS =================
    // cursorY -= 10;

    page.drawText('Estado de Componentes', {
      x: margin,
      y: cursorY,
      size: 14,
      font: fontBold
    });

    cursorY -= 25;

    const componentes = [
      { nombre: 'Máquina', data: datos.estado_maquina },
      { nombre: 'Bomba', data: datos.estado_bomba },
      { nombre: 'Agitador', data: datos.estado_agitador },
      { nombre: 'Filtro Primario', data: datos.estado_filtroPrimario },
      { nombre: 'Filtro Secundario', data: datos.estado_filtroSecundario },
      { nombre: 'Filtro Línea', data: datos.estado_filtroLinea },
      { nombre: 'Mangueras y Conexiones', data: datos.estado_manguerayconexiones },
      { nombre: 'Sistema Antigoteo', data: datos.estado_antigoteo },
      { nombre: 'Limpieza Tanque', data: datos.estado_limpiezaTanque },
      { nombre: 'Pastillas', data: datos.estado_pastillas },
      { nombre: 'Estabilidad Botalón', data: datos.estabilidadVerticalBotalon },
      { nombre: 'Mixer', data: datos.mixer }
    ];

    const rowHeight = 24;
    //---------- Fondo gris ----------------
    const totalFilas = Math.ceil(componentes.length);
    const sectionHeight = totalFilas * rowHeight + 30;

    // Fondo gris claro
    page.drawRectangle({
      x: margin - 10,
      y: cursorY - sectionHeight + 10,
      width: width - (margin - 10) * 2,
      height: sectionHeight,
      color: rgb(0.96, 0.96, 0.96)
    });   
    //---------------------------------    

    componentes.forEach(comp => {

      const estado = comp.data?.estado || 'No Aplica';
      const colorEstado = this.getColorEstado(estado);

      if (cursorY < 100) {
        page = pdfDoc.addPage();
        cursorY = page.getHeight() - margin;
      }

      // Nombre del componente
      page.drawText(comp.nombre, {
        x: margin,
        y: cursorY,
        size: 11,
        font
      });

      // Badge de estado (rectángulo color)
      page.drawRectangle({
        x: width - margin - 140,
        y: cursorY - 6,
        width: 120,
        height: 18,
        color: colorEstado,
        borderRadius: 4
      });

      // Texto estado
      page.drawText(estado.toUpperCase(), {
        x: width - margin - 130,
        y: cursorY,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1)
      });

      cursorY -= rowHeight;
    });


    // ================= SEPARADOR =================

    cursorY -= 10;

    page.drawRectangle({
      x: margin,
      y: cursorY,
      width: width - margin * 2,
      height: 1,
      color: rgb(0.85, 0.85, 0.85)
    });

    cursorY -= 20;
    //-----------------------------------------------

  
    //  // ================= COMPONENTES DETALLADO DOS COLUMNAS =================

    // page.drawText('Estado de Componentes', {
    //   x: margin,
    //   y: cursorY,
    //   size: 14,
    //   font: fontBold
    // });

    // cursorY -= 25;

    // // const componentes = [
    // //   { nombre: 'Máquina', data: datos.estado_maquina },
    // //   { nombre: 'Bomba', data: datos.estado_bomba },
    // //   { nombre: 'Agitador', data: datos.estado_agitador },
    // //   { nombre: 'Filtro Primario', data: datos.estado_filtroPrimario },
    // //   { nombre: 'Filtro Secundario', data: datos.estado_filtroSecundario },
    // //   { nombre: 'Filtro Línea', data: datos.estado_filtroLinea },
    // //   { nombre: 'Mangueras y Conexiones', data: datos.estado_manguerayconexiones },
    // //   { nombre: 'Sistema Antigoteo', data: datos.estado_antigoteo },
    // //   { nombre: 'Limpieza Tanque', data: datos.estado_limpiezaTanque },
    // //   { nombre: 'Pastillas', data: datos.estado_pastillas },
    // //   { nombre: 'Estabilidad Botalón', data: datos.estabilidadVerticalBotalon },
    // //   { nombre: 'Mixer', data: datos.mixer }
    // // ];


    // const colWidth = (width - margin * 2) / 2;
    // const rowHeights = 28;

    // componentes.forEach((comp, index) => {

    //   const col = index % 2;
    //   const row = Math.floor(index / 2);

    //   const x = margin + col * colWidth;
    //   const y = cursorY - row * rowHeights;

    //   const estado = comp.data?.estado || 'No Aplica';
    //   const colorEstado = this.getColorEstado(estado);

    //   page.drawText(comp.nombre, {
    //     x,
    //     y,
    //     size: 10,
    //     font
    //   });

    //   page.drawRectangle({
    //     x: x + colWidth - 110,
    //     y: y - 6,
    //     width: 100,
    //     height: 18,
    //     color: colorEstado
    //   });

    //   page.drawText(estado.toUpperCase(), {
    //     x: x + colWidth - 100,
    //     y,
    //     size: 9,
    //     font: fontBold,
    //     color: rgb(1, 1, 1)
    //   });
    // });


    // ================= SEPARADOR =================

    cursorY -= 10;

    page.drawRectangle({
      x: margin,
      y: cursorY,
      width: width - margin * 2,
      height: 1,
      color: rgb(0.85, 0.85, 0.85)
    });

    cursorY -= 20;
    //-----------------------------------------------

    return page;
  }

  // ===============================
  // COLOR SEGÚN ESTADO
  // ===============================

  getColorEstado(estado) {

    const e = estado?.toLowerCase();

    if (e === 'muy bueno') return rgb(0, 0.6, 0);
    if (e === 'bueno') return rgb(0.2, 0.6, 1);
    if (e === 'regular') return rgb(1, 0.7, 0);
    if (e === 'malo') return rgb(0.8, 0, 0);
    if (e === 'no aplica') return rgb(0.5, 0.5, 0.5);

    return rgb(0.6, 0.6, 0.6);
  }

  // ===============================================
  // CALCULA EL ALTO DE CADA CUADRO EN FUNCION DE 
  // LINEAS DE TEXTO, IMAGEN, RECOMENDACIONES, ETC
  // ===============================================
 
  async calcularAlturaCard(comp, font, width, margin, pdfDoc) {

    let altura = 50;

    const estado = comp.data;
    const maxWidth = width - margin * 2 - 40;
    const fontSize = 9;
    const lineHeight = 12;

    // ===== FILTROS =====
    if (comp.tipo === 'filtro') {
      if (estado.color) altura += 14;
      if (estado.numero !== '' && estado.numero !== null) altura += 14;
      if (estado.presenciaORing) altura += 14;
    }

    // ===== OBSERVACIÓN =====
    if (estado.observacion) {
      const lines = pdfUtils.wrapText(
        estado.observacion,
        font,
        fontSize,
        maxWidth
      );
      altura += lines.length * lineHeight + 20;
    }

    // ===== RECOMENDACIONES =====
    if (Array.isArray(estado.recomendaciones) && estado.recomendaciones.length > 0) {

      estado.recomendaciones.forEach((r) => {

        const texto = r.texto || '';

        const lines = pdfUtils.wrapText(
          texto,
          font,
          fontSize,
          maxWidth
        );

        altura += lines.length * lineHeight + 5;
      });

      altura += 20; // espacio título sección
    }

    // ===== SUGERENCIAS PREVENTIVAS =====

    const sugerenciasFijas = this.getSugerenciasPredeterminadas(comp.titulo);

    if (sugerenciasFijas.length > 0) {

      altura += 20;

      sugerenciasFijas.forEach(texto => {

        const lines = pdfUtils.wrapText(
          texto,
          font,
          fontSize,
          maxWidth
        );

        altura += lines.length * lineHeight + 5;
      });
    }

    // ===== IMAGEN =====
    if (estado.nombre_archivo) {
      const imgData = await this.getImageDimensions(pdfDoc, estado.nombre_archivo);

      if (imgData) {
        altura += imgData.height + 10;
      }
    }



    return altura;
  }
  // ===============================
  // PREPARAR DATOS
  // ===============================

  prepararDatosTemplate(calibracion) {

    const fecha = new Date(calibracion.fecha);

    const formatear = (estado = {}) => ({
      estado: estado.estado || 'NO APLICA',
      observacion: estado.observacion || '',
      nombre_archivo: estado.nombreArchivo || '',

      // SOLO PARA FILTROS (si no existen quedan vacíos)
      color: estado.color || '',
      numero: estado.numero ?? '',
      presenciaORing: estado.presenciaORing || '',

      recomendaciones: Array.isArray(estado.recomendaciones)
        ? estado.recomendaciones.map(r => ({
          id: r.id,
          fecha: r.fecha,
          texto: r.texto || ''
        }))
        : []
    });


    return {

      // ================= GENERALES =================

      id: calibracion.id,
      fecha: fecha.toLocaleDateString('es-AR'),
      responsable: calibracion.responsable || '',
      estado_general: calibracion.estado || '',

      observaciones_acronex: calibracion.observaciones_acronex || '',
      observaciones_generales: calibracion.Observaciones || '',

      secciones: calibracion.secciones
        ? JSON.parse(calibracion.secciones)
        : {},

      // ================= PRESIONES =================
        presion_unimap: calibracion.presion_unimap
        ? JSON.parse(calibracion.presion_unimap)
        : {},
        presion_computadora: calibracion.presion_computadora
        ? JSON.parse(calibracion.presion_computadora)
        : {},
        presion_manometro: calibracion.presion_manometro
        ? JSON.parse(calibracion.presion_manometro)
        : {},

      // presion_unimap: calibracion.presion_unimap?.valor || '',
      // presion_computadora: calibracion.presion_computadora.valor || '',
      // presion_manometro: calibracion.presion_manometro.valor || '',
      // presion_unimap: calibracion.presion_unimap?.valor || '',
      // presion_computadora: calibracion.presion_computadora.valor || '',
      // presion_manometro: calibracion.presion_manometro.valor || '',

      // ================= COMPONENTES =================

      estado_maquina: formatear(calibracion.estado_maquina),
      estado_bomba: formatear(calibracion.estado_bomba),
      estado_agitador: formatear(calibracion.estado_agitador),
      estado_filtroPrimario: formatear(calibracion.estado_filtroPrimario),
      estado_filtroSecundario: formatear(calibracion.estado_filtroSecundario),
      estado_filtroLinea: formatear(calibracion.estado_filtroLinea),
      estado_manguerayconexiones: formatear(calibracion.estado_manguerayconexiones),
      estado_antigoteo: formatear(calibracion.estado_antigoteo),
      estado_limpiezaTanque: formatear(calibracion.estado_limpiezaTanque),
      estado_pastillas: formatear(calibracion.estado_pastillas),
      estabilidadVerticalBotalon: formatear(calibracion.estabilidadVerticalBotalon),
      mixer: formatear(calibracion.mixer),

      // ================= MAQUINA =================

      maquina: calibracion.maquina
        ? {
          id: calibracion.maquina.id,
          responsable: calibracion.maquina.responsable,
          ancho_trabajo: calibracion.maquina.ancho_trabajo,
          distancia_entrePicos: calibracion.maquina.distancia_entrePicos,
          numero_picos: calibracion.maquina.numero_picos,
          capacidad_tanque: calibracion.maquina.capacidad_tanque,
          sistema_corte: calibracion.maquina.sistema_corte,

          tipo: calibracion.maquina.tipo
            ? {
              tipo: calibracion.maquina.tipo.tipo,
              marca: calibracion.maquina.tipo.marca,
              modelo: calibracion.maquina.tipo.modelo,
              fecha_fabricacion:
                calibracion.maquina.tipo.fecha_fabricacion
                  ? new Date(
                    calibracion.maquina.tipo.fecha_fabricacion
                  ).toLocaleDateString('es-AR')
                  : ''
            }
            : {},

          cliente: calibracion.maquina.cliente
            ? {
              razon_social: calibracion.maquina.cliente.razon_social,
              direccion: calibracion.maquina.cliente.direccion,
              ciudad: calibracion.maquina.cliente.ciudad,
              provincia: calibracion.maquina.cliente.provincia,
              pais: calibracion.maquina.cliente.pais,
              telefono: calibracion.maquina.cliente.telefono,
              email: calibracion.maquina.cliente.email,
              cuil_cuit: calibracion.maquina.cliente.cuil_cuit
            }
            : {}
        }
        : {}
    };
  }


  async embedImage(pdfDoc, nombreArchivo) {

    if (!nombreArchivo) return null;

    try {
      const ruta = path.join(
        process.cwd(),
        'uploads',
        'calibraciones',
        nombreArchivo
      );

      const imageBytes = await fs.readFile(ruta);
      const extension = path.extname(nombreArchivo).toLowerCase();

      if (extension === '.png') {
        return await pdfDoc.embedPng(imageBytes);
      }

      return await pdfDoc.embedJpg(imageBytes);

    } catch (err) {
      console.log('No se pudo cargar imagen:', nombreArchivo);
      return null;
    }
  }

  getSugerenciasPredeterminadas(titulo) {

    const mapa = {

      'Filtro Primario': [
        'Mantener limpios los filtros y los vasos de los mismos de esta manera no generamos sobre esfuerzos en la bomba para mantener la presión y un desgaste prematuro en la misma y evitamos posibles fito en los cultivos.',
        'Mantener orden correcto de filtros, Mesh de menos a más.'
      ],

      'Filtro Secundario': [
        'Mantener limpios los filtros y los vasos de los mismos de esta manera no generamos sobre esfuerzos en la bomba para mantener la presión y un desgaste prematuro en la misma y evitamos posibles fito en los cultivos.',
        'Mantener orden correcto de filtros, Mesh de menos a más.'
      ],

      'Filtro Línea': [
        'Mantener limpios los filtros y los vasos de los mismos de esta manera no generamos sobre esfuerzos en la bomba para mantener la presión y un desgaste prematuro en la misma y evitamos posibles fito en los cultivos.',
        'Mantener orden correcto de filtros, Mesh de menos a más.'
      ],

      'Antigoteo': [
        'Mantener limpias las partes externas de la pulverizadora con MBM (Súper detergente industrial) para preservar las partes y la seguridad del operario.'
      ],

      'Limpieza Tanque': [
        'Realizar una limpieza profunda con desincrustante SPRAYOFF para evitar problemas de fitotoxicidad en cultivos. Especialmente cuando se hagan aplicaciones de pre-emergentes, pre-siembra y post-emergentes de manera simultánea.'
      ]

    };

    return mapa[titulo] || [];
  }

  async generarGraficaSecciones(secciones) {

    if (!Array.isArray(secciones) || secciones.length === 0) {
      return null;
    }

    const width = 800;
    const height = 400;

    const chartJSNodeCanvas = new ChartJSNodeCanvas({
      width,
      height,
      backgroundColour: 'white'
    });

    const labels = secciones.map(s => s.numero);
    const data = secciones.map(s => s.valor);

    const configuration = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Presión (bares)',
          data,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.2,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)'
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: 'Presión en las secciones',
            font: {
              size: 18
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'N° de sección'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Presión (bares)'
            },
            beginAtZero: false
          }
        }
      }
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
  }

  async getImageDimensions(pdfDoc, nombreArchivo, maxWidth = 200, maxHeight = 150) {

  if (!nombreArchivo) return null;

  const image = await this.embedImage(pdfDoc, nombreArchivo);
  if (!image) return null;

  const originalWidth = image.width;
  const originalHeight = image.height;

  let scale = 1;

  // limitar por ancho
  if (originalWidth > maxWidth) {
    scale = maxWidth / originalWidth;
  }

  // limitar por alto
  if (originalHeight * scale > maxHeight) {
    scale = maxHeight / originalHeight;
  }

  return {
    image,
    width: originalWidth * scale,
    height: originalHeight * scale
  };
}

}

export default new PDFServicePdfLib();
