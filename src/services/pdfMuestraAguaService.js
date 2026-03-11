import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

import Pozo from '../models/pozo.js';
import MuestraAgua from '../models/muestra_agua.js';
import Clientes from '../models/clientes.js';
import { FACTORES_CALIDAD_AGUA } from '../config/constants/muestrasAgua.informeTextos.js';
import * as pdfUtils from '../utils/pdfText.js';

class pdfMuestraAguaService {

  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'reports');
  }



  // ======================================
  // DIBUJAR TABLA GENERICA
  // ======================================

  drawTable({ page, pdfDoc, startY, headers, rows, columnRatios, font, fontBold }) {

    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    const margin = 40;
    const tableWidth = pageWidth - margin * 2;

    const rowHeight = 18;

    const colWidths = columnRatios.map(r => r * tableWidth);

    let cursorY = startY;

    // HEADER
    let x = margin;

    headers.forEach((header, i) => {

      page.drawRectangle({
        x,
        y: cursorY,
        width: colWidths[i],
        height: rowHeight,
        color: rgb(0.2, 0.5, 0.2)
      });

      page.drawText(header, {
        x: x + 4,
        y: cursorY + 5,
        size: 8,
        font: fontBold,
        color: rgb(1, 1, 1)
      });

      x += colWidths[i];
    });

    cursorY -= rowHeight;

    // FILAS
    rows.forEach(row => {

      // salto de pagina
      if (cursorY < 80) {

        page = pdfDoc.addPage();
        cursorY = pageHeight - 60;

      }

      let x = margin;

      row.forEach((cell, i) => {

        page.drawRectangle({
          x,
          y: cursorY,
          width: colWidths[i],
          height: rowHeight,
          borderWidth: 0.5,
          borderColor: rgb(0.7, 0.7, 0.7)
        });

        page.drawText(pdfUtils.truncate(cell, 22), {
          x: x + 4,
          y: cursorY + 5,
          size: 8,
          font
        });

        x += colWidths[i];

      });

      cursorY -= rowHeight;

    });

    return { page, cursorY };
  }

  // ======================================
  // GENERAR INFORME
  // ======================================

  async generarInformeCalidadAgua(cliente_id, pozos_ids = []) {

    const pozos = await Pozo.findAll({
      where: {
        id: pozos_ids,
        cliente_id
      },
      include: [
        { model: MuestraAgua, as: 'muestrasAgua', limit: 1, order: [['fecha_muestra', 'DESC']] },
        { model: Clientes, as: 'cliente' }
      ]
    });

    if (!pozos.length) {
      throw new Error('No se encontraron pozos');
    }

    const cliente = pozos[0].cliente;

    const datosTabla = pozos.map((p, i) => {

      const muestra = p.muestrasAgua?.[0];

      return [
        i + 1,
        p.nombre,
        muestra?.ph ?? '-',
        muestra?.dureza ?? '-',
        muestra?.alcalinidad ?? '-',
        muestra?.salinidad ?? '-',
        muestra?.salinidad ?? '-',
        muestra?.fuerza_ionica ?? '-',
        muestra?.dosis ?? '-'
      ];

    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage();

    const { width, height } = page.getSize();

    const margin = 40;
    let cursorY = height - 50;

    // ======================================
    // HEADER
    // ======================================

    page.drawRectangle({
      x: 0,
      y: height - 60,
      width,
      height: 60,
      color: rgb(0.1, 0.4, 0.2)
    });

    page.drawText(
      'CALIDAD DE AGUA PARA APLICACIÓN DE FITOSANITARIOS',
      {
        x: margin,
        y: height - 30,
        size: 14,
        font: fontBold,
        color: rgb(1, 1, 1)
      }
    );

    page.drawText(
      `Cliente: ${cliente?.razon_social ?? '-'}`,
      {
        x: margin,
        y: height - 45,
        size: 10,
        font,
        color: rgb(1, 1, 1)
      }
    );

    page.drawText(
      `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
      {
        x: width - 150,
        y: height - 45,
        size: 10,
        font,
        color: rgb(1, 1, 1)
      }
    );

    cursorY -= 60;

    // ======================================
    // TABLA PRINCIPAL
    // ======================================

    const headers = [
      'N°',
      'Pozo',
      'pH',
      'Dureza',
      'Alcal.',
      'Sal.',
      'CE',
      'F. Iónica',
      'Dosis'
    ];

    const columnRatios = [
      0.05,
      0.25,
      0.08,
      0.10,
      0.12,
      0.10,
      0.08,
      0.12,
      0.10
    ];

    const result = this.drawTable({
      page,
      pdfDoc,
      startY: cursorY,
      headers,
      rows: datosTabla,
      columnRatios,
      font,
      fontBold
    });

    page = result.page;
    cursorY = result.cursorY;

    cursorY -= 30;

    // ======================================
    // TABLA REFERENCIA
    // ======================================

    page.drawText(
      'Tablas de calidad de agua',
      {
        x: margin,
        y: cursorY,
        size: 12,
        font: fontBold
      }
    );

    cursorY -= 20;

    const referenciaHeaders = [
      'Parámetro',
      'Bajo',
      'Medio',
      'Alto'
    ];

    const referenciaRows = [
      ['Conductividad eléctrica (dS/cm)', '<500', '500 - 2000', '>2000'],
      ['Salinidad (mg/l)', '<300', '300 - 1200', '>1200'],
      ['Fuerza iónica', '<25', '25', '>25']
    ];

    this.drawTable({
      page,
      pdfDoc,
      startY: cursorY,
      headers: referenciaHeaders,
      rows: referenciaRows,
      columnRatios: [0.5, 0.17, 0.17, 0.16],
      font,
      fontBold
    });


    cursorY -= 80;
    // ======================================
    // TEXTOS INFORMATIVOS ESTATICOS
    // ======================================
    page.drawText(
      'Factores a considerar e interpretar en una muestra de agua:', {
      x: margin,
      y: cursorY,
      size: 10,
      font: fontBold
    });
    cursorY -= 15;

    FACTORES_CALIDAD_AGUA.forEach(factor => {

      page.drawText(factor.titulo, {
        x: margin,
        y: cursorY,
        size: 10,
        font: fontBold
      });

      cursorY -= 15;

      const lines = pdfUtils.wrapText(
        factor.texto,
        font,
        9,
        width - margin * 2 - 40
      );

      lines.forEach(line => {

        page.drawText(line, {
          x: margin + 10,
          y: cursorY,
          size: 9,
          font
        });

        cursorY -= 12;

      });

      cursorY -= 8;

      // SUBSECCIONES
      if (factor.subsecciones) {

        factor.subsecciones.forEach(sub => {

          page.drawText(sub.subtitulo, {
            x: margin + 10,
            y: cursorY,
            size: 9,
            font: fontBold
          });

          cursorY -= 14;

          sub.items.forEach((item, index) => {

            const itemLines = pdfUtils.wrapText(
              item,
              font,
              9,
              width - margin * 2 - 40
            );

            itemLines.forEach((line, lineIndex) => {

              const prefix = lineIndex === 0 ? `${index + 1}) ` : "   ";

              page.drawText(prefix + line, {
                x: margin + 20,
                y: cursorY,
                size: 9,
                font
              });

              cursorY -= 12;

            });

            cursorY -= 4;

          });

        });

      }

      cursorY -= 12;

    });

    // ======================================
    // FOOTER
    // ======================================

    page.drawText(
      'Don Asdrúbal – Departamento I+D',
      {
        x: margin,
        y: 40,
        size: 9,
        font
      }
    );

    const pdfBytes = await pdfDoc.save();

    return {
      pdfBytes,
      filename: `calidad_agua_${Date.now()}.pdf`
    };

  }

}

export default new pdfMuestraAguaService();


// ---- opcional si  se quiere guardar el reportte ----
// await fs.writeFile(outputPath, pdfBytes);

// return {
//   success: true,
//   path: outputPath,
//   filename
// };

//--------------------------------------------------------


