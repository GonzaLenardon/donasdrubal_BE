import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

import Pozo from '../models/pozo.js';
import MuestraAgua from '../models/muestra_agua.js';
import Clientes from '../models/clientes.js';
import { FACTORES_CALIDAD_AGUA } from '../config/constants/muestrasAgua.informeTextos.js';
import * as pdfUtils from '../utils/pdfText.js';

class PdfMuestraAguaService {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'reports');
    this.margin = 40;
  }

  // ══════════════════════════════════════════════════════════════════════
  // MÉTODOS PRIVADOS REUTILIZABLES
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Dibuja el header verde con título, cliente y fecha.
   */
  _drawHeader({ page, font, fontBold, width, height, titulo, clienteNombre }) {
    const { margin } = this;

    page.drawRectangle({
      x: 0,
      y: height - 60,
      width,
      height: 60,
      color: rgb(0.1, 0.4, 0.2),
    });

    page.drawText(titulo, {
      x: margin,
      y: height - 30,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Cliente: ${clienteNombre}`, {
      x: margin,
      y: height - 45,
      size: 10,
      font,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, {
      x: width - 150,
      y: height - 45,
      size: 10,
      font,
      color: rgb(1, 1, 1),
    });
  }

  /**
   * Conclusiones
   */
  _drawConclusion({
    page,
    pdfDoc,
    cursorY,
    font,
    fontBold,
    width,
    conclusion,
  }) {
    const { margin } = this;

    const _checkPage = (cursor, minSpace = 100) => {
      if (cursor < minSpace) {
        page = pdfDoc.addPage();
        cursor = page.getHeight() - 60;
      }
      return cursor;
    };

    // 🔹 espacio antes de la sección
    cursorY -= 20;

    cursorY = _checkPage(cursorY, 120);

    // ── Título ─────────────────────────────────────────────
    page.drawText('Conclusión final del informe', {
      x: margin,
      y: cursorY,
      size: 12,
      font: fontBold,
    });

    cursorY -= 20;

    // ── Texto ──────────────────────────────────────────────
    const text = conclusion?.trim() ? conclusion : '-';

    const lines = pdfUtils.wrapText(text, font, 10, width - margin * 2);

    for (const line of lines) {
      cursorY = _checkPage(cursorY, 60);

      page.drawText(line, {
        x: margin,
        y: cursorY,
        size: 10,
        font,
      });

      cursorY -= 14;
    }

    cursorY -= 20;

    return { page, cursorY };
  }

  /**
   * Dibuja el footer con el nombre de la empresa.
   */
  _drawFooter({ page, font }) {
    page.drawText('Don Asdrúbal – Departamento I+D', {
      x: this.margin,
      y: 40,
      size: 9,
      font,
    });
  }

  /**
   * Dibuja la tabla de referencia de parámetros de calidad.
   * Retorna { page, cursorY } actualizado.
   */
  _drawTablaReferencia({ page, pdfDoc, cursorY, font, fontBold }) {
    const { margin } = this;

    page.drawText('Tablas de calidad de agua', {
      x: margin,
      y: cursorY,
      size: 12,
      font: fontBold,
    });

    cursorY -= 20;

    const result = this.drawTable({
      page,
      pdfDoc,
      startY: cursorY,
      headers: ['Parámetro', 'Bajo', 'Medio', 'Alto'],
      rows: [
        ['Conductividad eléctrica (dS/cm)', '<500', '500 - 2000', '>2000'],
        ['Salinidad (mg/l)', '<300', '300 - 1200', '>1200'],
        ['Fuerza iónica', '<25', '25', '>25'],
      ],
      columnRatios: [0.5, 0.17, 0.17, 0.16],
      font,
      fontBold,
    });

    return { page: result.page, cursorY: result.cursorY };
  }

  /**
   * Dibuja los factores de calidad de agua con sus subsecciones.
   * Gestiona saltos de página automáticos correctamente.
   * Retorna { page, cursorY } actualizado.
   */
  _drawFactoresCalidad({ page, pdfDoc, cursorY, font, fontBold, width }) {
    const { margin } = this;

    const _checkPage = (cursor, minSpace = 80) => {
      if (cursor < minSpace) {
        page = pdfDoc.addPage();
        cursor = page.getHeight() - 60;
      }
      return cursor;
    };

    cursorY = _checkPage(cursorY, 200);

    page.drawText(
      'Factores a considerar e interpretar en una muestra de agua:',
      { x: margin, y: cursorY, size: 10, font: fontBold },
    );

    cursorY -= 15;

    for (const factor of FACTORES_CALIDAD_AGUA) {
      cursorY = _checkPage(cursorY, 100);

      page.drawText(factor.titulo, {
        x: margin,
        y: cursorY,
        size: 10,
        font: fontBold,
      });

      cursorY -= 15;

      const lines = pdfUtils.wrapText(
        factor.texto,
        font,
        9,
        width - margin * 2 - 40,
      );

      for (const line of lines) {
        cursorY = _checkPage(cursorY, 60);
        page.drawText(line, { x: margin + 10, y: cursorY, size: 9, font });
        cursorY -= 12;
      }

      cursorY -= 8;

      if (factor.subsecciones) {
        for (const sub of factor.subsecciones) {
          cursorY = _checkPage(cursorY, 100);

          page.drawText(sub.subtitulo, {
            x: margin + 10,
            y: cursorY,
            size: 9,
            font: fontBold,
          });

          cursorY -= 14;

          for (const [index, item] of sub.items.entries()) {
            const itemLines = pdfUtils.wrapText(
              item,
              font,
              9,
              width - margin * 2 - 40,
            );

            for (const [lineIndex, line] of itemLines.entries()) {
              cursorY = _checkPage(cursorY, 60);
              const prefix = lineIndex === 0 ? `${index + 1}) ` : '   ';
              page.drawText(prefix + line, {
                x: margin + 20,
                y: cursorY,
                size: 9,
                font,
              });
              cursorY -= 12;
            }

            cursorY -= 4;
          }
        }
      }

      cursorY -= 12;
    }

    return { page, cursorY };
  }

  // ══════════════════════════════════════════════════════════════════════
  // MÉTODO GENÉRICO: DIBUJAR TABLA
  // ══════════════════════════════════════════════════════════════════════

  drawTable({
    page,
    pdfDoc,
    startY,
    headers,
    rows,
    columnRatios,
    font,
    fontBold,
  }) {
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const { margin } = this;

    const tableWidth = pageWidth - margin * 2;
    const rowHeight = 18;
    const colWidths = columnRatios.map((r) => r * tableWidth);

    let cursorY = startY;

    // ── Header de la tabla ──────────────────────────────────────────────
    let x = margin;

    headers.forEach((header, i) => {
      page.drawRectangle({
        x,
        y: cursorY,
        width: colWidths[i],
        height: rowHeight,
        color: rgb(0.2, 0.5, 0.2),
      });

      page.drawText(header, {
        x: x + 4,
        y: cursorY + 5,
        size: 8,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      x += colWidths[i];
    });

    cursorY -= rowHeight;

    // ── Filas ───────────────────────────────────────────────────────────
    for (const row of rows) {
      // Salto de página automático
      if (cursorY < 80) {
        page = pdfDoc.addPage();
        cursorY = pageHeight - 60;
      }

      x = margin;

      row.forEach((cell, i) => {
        page.drawRectangle({
          x,
          y: cursorY,
          width: colWidths[i],
          height: rowHeight,
          borderWidth: 0.5,
          borderColor: rgb(0.7, 0.7, 0.7),
        });

        page.drawText(pdfUtils.truncate(String(cell), 22), {
          x: x + 4,
          y: cursorY + 5,
          size: 8,
          font,
        });

        x += colWidths[i];
      });

      cursorY -= rowHeight;
    }

    return { page, cursorY };
  }

  // ══════════════════════════════════════════════════════════════════════
  // GENERAR INFORME CALIDAD DE AGUA (múltiples pozos)
  // ══════════════════════════════════════════════════════════════════════

  async generarInformeCalidadAgua(cliente_id, pozos_ids = [], conclusion) {
    const pozos = await Pozo.findAll({
      where: { id: pozos_ids, cliente_id },
      include: [
        {
          model: MuestraAgua,
          as: 'muestrasAgua',
          limit: 1,
          order: [['fecha_muestra', 'DESC']],
        },
        { model: Clientes, as: 'cliente' },
      ],
    });

    if (!pozos.length) {
      throw new Error('No se encontraron pozos para el cliente indicado');
    }

    const cliente = pozos[0].cliente;

    const datosTabla = pozos.map((p, i) => {
      const muestra = p.muestrasAgua?.[0];
      return [
        String(i + 1),
        p.nombre ?? '-',
        String(muestra?.ph ?? '-'),
        String(muestra?.dureza ?? '-'),
        String(muestra?.alcalinidad ?? '-'),
        String(muestra?.salinidad ?? '-'),
        String(muestra?.conductividad ?? '-'),
        String(muestra?.fuerza_ionica ?? '-'),
        String(muestra?.dosis ?? '-'),
      ];
    });

    // ── Setup PDF ───────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const { margin } = this;
    let cursorY = height - 50;

    // ── Header ──────────────────────────────────────────────────────────
    this._drawHeader({
      page,
      font,
      fontBold,
      width,
      height,
      titulo: 'CALIDAD DE AGUA PARA APLICACIÓN DE FITOSANITARIOS',
      clienteNombre: cliente?.razon_social ?? '-',
    });

    cursorY -= 60;

    // ── Tabla principal ─────────────────────────────────────────────────
    const headers = [
      'N°',
      'Pozo',
      'pH',
      'Dureza',
      'Alcal.',
      'Sal.',
      'CE',
      'F. Iónica',
      'Dosis',
    ];
    const columnRatios = [0.05, 0.25, 0.08, 0.1, 0.12, 0.1, 0.08, 0.12, 0.1];

    let result = this.drawTable({
      page,
      pdfDoc,
      startY: cursorY,
      headers,
      rows: datosTabla,
      columnRatios,
      font,
      fontBold,
    });

    page = result.page;
    cursorY = result.cursorY - 30;

    // ── Tabla de referencia ─────────────────────────────────────────────
    const refResult = this._drawTablaReferencia({
      page,
      pdfDoc,
      cursorY,
      font,
      fontBold,
    });
    page = refResult.page;
    cursorY = refResult.cursorY - 80;

    // ── Factores de calidad ─────────────────────────────────────────────
    const factoresResult = this._drawFactoresCalidad({
      page,
      pdfDoc,
      cursorY,
      font,
      fontBold,
      width,
    });

    page = factoresResult.page;
    cursorY = factoresResult.cursorY - 30; // 🔥 CLAVE

    // ── Conclusión ──────────────────────────────────────────────────────
    const conclusionResult = this._drawConclusion({
      page,
      pdfDoc,
      cursorY,
      font,
      fontBold,
      width,
      conclusion,
    });

    page = conclusionResult.page;
    cursorY = conclusionResult.cursorY;

    // ── Footer ──────────────────────────────────────────────────────────
    this._drawFooter({ page, font });

    // ── Footer ──────────────────────────────────────────────────────────
    this._drawFooter({ page, font });

    const pdfBytes = await pdfDoc.save();

    return {
      pdfBytes,
      filename: `calidad_agua_${Date.now()}.pdf`,
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // GENERAR INFORME MUESTRA DE AGUA (una muestra específica)
  // ══════════════════════════════════════════════════════════════════════

  async generarInformeMuestraAgua(muestra_id) {
    // ── Obtener muestra con pozo y cliente ──────────────────────────────
    const muestra = await MuestraAgua.findByPk(muestra_id, {
      include: [
        {
          model: Pozo,
          as: 'pozo',
          include: [{ model: Clientes, as: 'cliente' }],
        },
      ],
    });

    if (!muestra) {
      throw new Error(`No se encontró la muestra con id ${muestra_id}`);
    }

    const pozo = muestra.pozo;
    const cliente = pozo?.cliente;

    // ── Setup PDF ───────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const { margin } = this;
    let cursorY = height - 50;

    // ── Header ──────────────────────────────────────────────────────────
    this._drawHeader({
      page,
      font,
      fontBold,
      width,
      height,
      titulo: 'INFORME DE MUESTRA DE AGUA',
      clienteNombre: cliente?.razon_social ?? '-',
    });

    cursorY -= 60;

    // ── Info del pozo y muestra ─────────────────────────────────────────
    page.drawText(`Pozo: ${pozo?.nombre ?? '-'}`, {
      x: margin,
      y: cursorY,
      size: 10,
      font: fontBold,
    });

    cursorY -= 15;

    const fechaMuestra = muestra.fecha_muestra
      ? new Date(muestra.fecha_muestra).toLocaleDateString('es-AR')
      : '-';

    page.drawText(`Fecha de muestra: ${fechaMuestra}`, {
      x: margin,
      y: cursorY,
      size: 10,
      font,
    });

    cursorY -= 25;

    // ── Tabla de parámetros ─────────────────────────────────────────────
    const rows = [
      ['pH', String(muestra.ph ?? '-')],
      ['Dureza', String(muestra.dureza ?? '-')],
      ['Alcalinidad', String(muestra.alcalinidad ?? '-')],
      ['Salinidad (mg/l)', String(muestra.salinidad ?? '-')],
      ['Conductividad (dS/cm)', String(muestra.conductividad ?? '-')],
      ['Fuerza Iónica', String(muestra.fuerza_ionica ?? '-')],
      ['Dosis', String(muestra.dosis ?? '-')],
    ];

    let result = this.drawTable({
      page,
      pdfDoc,
      startY: cursorY,
      headers: ['Parámetro', 'Valor'],
      rows,
      columnRatios: [0.6, 0.4],
      font,
      fontBold,
    });

    page = result.page;
    cursorY = result.cursorY - 30;

    // ── Tabla de referencia ─────────────────────────────────────────────
    const refResult = this._drawTablaReferencia({
      page,
      pdfDoc,
      cursorY,
      font,
      fontBold,
    });
    page = refResult.page;
    cursorY = refResult.cursorY - 80;

    // ── Factores de calidad ─────────────────────────────────────────────
    const factoresResult = this._drawFactoresCalidad({
      page,
      pdfDoc,
      cursorY,
      font,
      fontBold,
      width,
    });

    page = factoresResult.page;

    // ── Footer ──────────────────────────────────────────────────────────
    this._drawFooter({ page, font });

    const pdfBytes = await pdfDoc.save();

    return {
      pdfBytes,
      filename: `muestra_agua_${muestra_id}_${Date.now()}.pdf`,
    };
  }
}

export default new PdfMuestraAguaService();

// ── Opcional: guardar el reporte en disco ────────────────────────────────────
// await fs.writeFile(outputPath, pdfBytes);
// return { success: true, path: outputPath, filename };
