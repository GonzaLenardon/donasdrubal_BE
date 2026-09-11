import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fsPromises from 'fs/promises';
import fs from 'fs';
import path from 'path';

import Pozo from '../../models/pozo.js';
import MuestraAgua from '../../models/muestra_agua.js';
import Clientes from '../../models/clientes.js';
import { FACTORES_CALIDAD_AGUA } from '../../config/constants/muestrasAgua.informeTextos.js';
import * as pdfUtils from '../../utils/pdf/pdfUtlis.js';
import * as imagesUtils from '../../utils/images/imagesUtils.js';

class PdfMuestraAguaService {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'reports', 'muestras_agua');
    this.imagesUrl = path.join(process.cwd(), 'uploads', 'clientes');
    this.informesPath = path.join(process.cwd(), 'uploads', 'clientes');
    this.assetsUrl = path.join(process.cwd(), 'src', 'assets');
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
      y: height - 130,
      width,
      height: 5,
      color: rgb(0.1, 0.4, 0.2),
    });

    page.drawText(titulo, {
      x: margin,
      y: height - 95,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Cliente: ${clienteNombre}`, {
      x: margin,
      y: height - 110,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, {
      x: width - 150,
      y: height - 110,
      size: 10,
      font,
      color: rgb(0.1, 0.1, 0.1),
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
    clienteNombre,
  }) {
    const { margin } = this;
    const text = conclusion?.trim() ? conclusion : '-';

    const boxWidth = width - margin * 2;
    const headerHeight = 22;
    const titleHeight = 20;
    const lineHeight = 14;
    const bodyPadding = 10;
    const lines = pdfUtils.wrapText(text, font, 10, boxWidth - bodyPadding * 2);
    const boxHeight = headerHeight + titleHeight + bodyPadding * 2 + lines.length * lineHeight;

    if (cursorY - boxHeight < 60) {
      page = pdfDoc.addPage();
      cursorY = page.getHeight() - 60;
    }

    const boxY = cursorY - boxHeight;
    const bodyY = boxY;

    page.drawRectangle({
      x: margin,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      borderWidth: 0.8,
      borderColor: rgb(0.2, 0.5, 0.2),
    });

    page.drawRectangle({
      x: margin,
      y: cursorY - headerHeight,
      width: boxWidth,
      height: headerHeight,
      color: rgb(0.2, 0.5, 0.2),
    });

    page.drawText(`Cliente: ${clienteNombre ?? '-'}`, {
      x: margin + bodyPadding,
      y: cursorY - 15,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('Conclusión del informe', {
      x: margin + bodyPadding,
      y: bodyY + boxHeight - headerHeight - 16,
      size: 11,
      font: fontBold,
    });

    let textY = bodyY + boxHeight - headerHeight - titleHeight - bodyPadding;
    for (const line of lines) {
      page.drawText(line, {
        x: margin + bodyPadding,
        y: textY,
        size: 10,
        font,
      });
      textY -= lineHeight;
    }

    cursorY = boxY - 20;

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

    page.drawText('Tablas de referencia', {
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
      headers: ['Parámetro', 'Unidad', 'Bajo', 'Medio', 'Alto'],
      rows: [
        ['Conductividad eléctrica', '(uS/cm)', '<500', '500 - 2000', '>2000'],
        ['Salinidad', '(mg/l)', '<300', '300 - 1200', '>1200'],
        ['Fuerza iónica', 'mmol/L (mM)', 'Baja <20', 'Transición 20-<25', 'Alta >25'],
        ['Dureza total', 'ppm de CaCO3', 'Blanda <75', 'Semidura 75-150', 'Dura 150-300 / Muy dura >300'],
      ],
      columnRatios: [0.18, 0.20, 0.15, 0.20, 0.27],
      font,
      fontBold,
    });

    return { page: result.page, cursorY: result.cursorY };
  }

  /**
   * Tabla de clasificación de dureza del agua
   */
  _drawTablaDureza({ page, pdfDoc, cursorY, font, fontBold }) {
    const { margin } = this;

    // ── Título ─────────────────────────────────────────────
    page.drawText('Clasificación de dureza del agua', {
      x: margin,
      y: cursorY,
      size: 12, 
      font: fontBold,
    });

    cursorY -= 20;

    // ── Tabla ──────────────────────────────────────────────
    const result = this.drawTable({
      page,
      pdfDoc,
      startY: cursorY,

      headers: ['Análisis', 'Referencia', 'Rango', 'Unidad'],

      rows: [
        ['DUREZA', 'BLANDA', '< 75', 'ppm'],
        ['DUREZA', 'SEMIDURA', '75 - 150', 'ppm'],
        ['DUREZA', 'DURA', '150 - 300', 'ppm'],
      ],

      // Ajustado para que no se corte
      columnRatios: [0.2, 0.3, 0.25, 0.25],

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
  async _drawFactoresCalidad({ page, pdfDoc, cursorY, font, fontBold, width }) {
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

      const lines_titulo = pdfUtils.wrapText(
        factor.titulo,
        font,
        10,
        width - margin * 2 - 40,
      );      
      for (const line of lines_titulo) {
        cursorY = _checkPage(cursorY, 60);
        page.drawText(line, { x: margin + 10, y: cursorY, size: 10, font: fontBold });
        cursorY -= 12;
      }


      // page.drawText(factor.titulo, {
      //   x: margin,
      //   y: cursorY,
      //   size: 10,
      //   font: fontBold,
      // });

      cursorY -= 10;

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

      if (factor.titulo === 'Evaluación demostrativa utilizando agua dura y salada de referencia') {
        const imageNames = [
          'calidad_agua_utilizada.png',
          'ma_cletodim_hard_cletodim.png',
        ];

        for (const imageName of imageNames) {
          const imageData = await imagesUtils.getImageDimensions(
            pdfDoc,
            path.join(this.assetsUrl, 'images'),
            imageName,
            width - margin * 2,
            600,
          );

          if (!imageData) continue;

          cursorY = _checkPage(cursorY, imageData.height + 20);

          const imageY = cursorY - imageData.height;
          page.drawImage(imageData.image, {
            x: margin + (width - margin * 2 - imageData.width) / 2,
            y: imageY,
            width: imageData.width,
            height: imageData.height,
          });
          cursorY = imageY - 12;
        }
      }

      cursorY -= 8;

      if (factor.subsecciones) {
        for (const sub of factor.subsecciones) {
          cursorY = _checkPage(cursorY, 100);


        const lines_subtitulo = pdfUtils.wrapText(
          sub.subtitulo,
          font,
          9,
          width - margin * 2 - 40,
        );      
        for (const line of lines_subtitulo) {
          cursorY = _checkPage(cursorY, 60);
          page.drawText(line, { x: margin + 10, y: cursorY, size: 9, font: fontBold });
          cursorY -= 12;
        }          

          // page.drawText(sub.subtitulo, {
          //   x: margin + 10,
          //   y: cursorY,
          //   size: 9,
          //   font: fontBold,
          // });

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
    const normalizedHeaders = headers.map((header) => (
      typeof header === 'string'
        ? { title: header }
        : { title: header.title, unit: header.unit }
    ));
    const headerHeight = normalizedHeaders.some((header) => header.unit)
      ? 30
      : rowHeight;

    let cursorY = startY;

    // ── Header de la tabla ──────────────────────────────────────────────
    const headerY = cursorY - headerHeight;
    let x = margin;

    normalizedHeaders.forEach((header, i) => {
      page.drawRectangle({
        x,
        y: headerY,
        width: colWidths[i],
        height: headerHeight,
        color: rgb(0.2, 0.5, 0.2),
      });

      const titleSize = 8;
      const titleWidth = fontBold.widthOfTextAtSize(header.title, titleSize);

      page.drawText(header.title, {
        x: x + (colWidths[i] - titleWidth) / 2,
        y: headerY + (header.unit ? 17 : 5),
        size: titleSize,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      if (header.unit) {
        const unitSize = 7;
        const unitWidth = font.widthOfTextAtSize(header.unit, unitSize);

        page.drawText(header.unit, {
          x: x + (colWidths[i] - unitWidth) / 2,
          y: headerY + 6,
          size: unitSize,
          font,
          color: rgb(1, 1, 1),
        });
      }

      x += colWidths[i];
    });

    cursorY -= headerHeight;

    // ── Filas ───────────────────────────────────────────────────────────
    for (const row of rows) {
      // Salto de página automático
      if (cursorY - rowHeight < 80) {
        page = pdfDoc.addPage();
        cursorY = pageHeight - 60;
      }

      const rowY = cursorY - rowHeight;
      x = margin;

      row.forEach((cell, i) => {
        page.drawRectangle({
          x,
          y: rowY,
          width: colWidths[i],
          height: rowHeight,
          borderWidth: 0.5,
          borderColor: rgb(0.7, 0.7, 0.7),
        });

        page.drawText(pdfUtils.truncate(String(cell), 30), {
          x: x + 4,
          y: rowY + 5,
          size: 8,
          font,
        });

        x += colWidths[i];
      });

      cursorY -= rowHeight;
    }

    return { page, cursorY };
  }

  prepararDatosInforme = (pozos) => {

    const datosTabla = [];


    pozos.forEach((p, i) => {
      const muestra = p.muestrasAgua?.[0];

      // TABLA
      datosTabla.push([
        String(i + 1),
        p.nombre ?? '-',
        String(muestra?.ph ?? 'N/D'),
        String(muestra?.dureza ?? 'N/D'),
        String(muestra?.alcalinidad ?? 'N/D'),
        String(muestra?.salinidad ?? 'N/D'),
        String(muestra?.conductividad ?? 'N/D'),
        String(muestra?.fuerza_ionica ?? 'N/D'),
        String(muestra?.dosis ?? 'N/D'),
      ]);


    });

    return datosTabla;
  }

  listarArchivosInformes = (pozos) => {
    const archivos = [];
    pozos.forEach((p) => {
      const muestra = p.muestrasAgua?.[0];
      if (muestra?.informe) {
        const pathInforme = path.join(this.informesPath, `${p.cliente_id}`, 'pozos', `${p.id}`, 'muestras', `${muestra.id}`);
        console.log('Buscando informe en:', pathInforme);
        archivos.push({
          pozo_id: p.id,
          pozo_nombre: p.nombre,
          archivo: this.getPathInforme(pathInforme, muestra.informe)
        });
      }
    });
    console.log('Archivos encontrados para anexar:', archivos);
    return archivos;
  }

  getPathInforme(pathInforme, nombreArchivo) {
    if (!nombreArchivo) return null;

    const fullPath = path.join(
      pathInforme,
      nombreArchivo);

    if (!fs.existsSync(fullPath)) {
      console.warn('Archivo no encontrado:', fullPath);
      return null;
    }

    return fullPath;
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
    const datosTabla = this.prepararDatosInforme(pozos);
    const archivos = this.listarArchivosInformes(pozos);
    // const datosTabla = pozos.map((p, i) => {
    //   const muestra = p.muestrasAgua?.[0];
    //   return [
    //     String(i + 1),
    //     p.nombre ?? '-',
    //     String(muestra?.ph ?? '-'),
    //     String(muestra?.dureza ?? '-'),
    //     String(muestra?.alcalinidad ?? '-'),
    //     String(muestra?.salinidad ?? '-'),
    //     String(muestra?.conductividad ?? '-'),
    //     String(muestra?.fuerza_ionica ?? '-'),
    //     String(muestra?.dosis ?? '-'),    
    //   ];
    // });
    // vecto de archivos a adjuntar al final del PDF (informes individuales de cada pozo)


    // ── Setup PDF ───────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const { margin } = this;
    let cursorY = height - 70;

    // ------------- LOGOS -----------------
    // LOGO DA
    let logoDA = await imagesUtils.getImageDimensions(pdfDoc, path.join(this.assetsUrl, 'images'), 'logo_don_asdrubal_100x355.png', 200, 100);
    console.log('LOGO DA:', logoDA);
    if (logoDA) {
      page.drawImage(logoDA.image, {
        x: margin - 10,
        y: cursorY,
        width: logoDA.width,
        height: logoDA.height
      });
    }

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

    cursorY -= 90;


    // ── Tabla principal ─────────────────────────────────────────────────
    const headers = [
      { title: 'N°', unit: ' ' },
      { title: 'Pozo', unit: ' ' },
      { title: 'pH', unit: '(s/u)' },
      { title: 'Dureza', unit: '(ppm CaCO3)' },
      { title: 'Alcalinidad', unit: '(mg/L)' },
      { title: 'Salinidad', unit: '(mg/L)' },
      { title: 'CE a 25°C', unit: '(µS/cm)' },
      { title: 'F. Iónica', unit: '(mmol/L)' },
      { title: 'Hard', unit: '(cc/1.000 L)' },
    ];
    const columnRatios = [0.05, 0.25, 0.08, 0.1, 0.12, 0.1, 0.08, 0.12, 0.1];

    // ── Título ─────────────────────────────────────────────
    page.drawText('Resultados comparativos', {
      x: margin,
      y: cursorY,
      size: 12,
      font: fontBold,
    });

    cursorY -= 20;    

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
    cursorY = result.cursorY;

    const notaDosis = '*Nota: la dosis de Hard se calcula a partir de la dureza total. Cuando la dureza es menor de 120 ppm, no se recomienda corregir el agua *';
    const notaLineHeight = 12;
    const notaLines = pdfUtils.wrapText(
      notaDosis,
      font,
      9,
      width - margin * 2,
    );
    const notaHeight = 14 + notaLines.length * notaLineHeight + 8;

    if (cursorY - notaHeight < 60) {
      page = pdfDoc.addPage();
      cursorY = page.getHeight() - 60;
    } else {
      cursorY -= 14;
    }

    for (const line of notaLines) {
      page.drawText(line, {
        x: margin,
        y: cursorY,
        size: 9,
        font,
      });
      cursorY -= notaLineHeight;
    }

    cursorY -= 16;

    // ── Tabla de referencia ─────────────────────────────────────────────
    const refResult = this._drawTablaReferencia({
      page,
      pdfDoc,
      cursorY,
      font,
      fontBold,
    });
    page = refResult.page;
    cursorY = refResult.cursorY - 30;

    // // ── Tabla dureza agua ─────────────────────────────────────────────
    // const durezaResult = this._drawTablaDureza({
    //   page,
    //   pdfDoc,
    //   cursorY,
    //   font,
    //   fontBold,
    // });

    // page = durezaResult.page;
    // cursorY = durezaResult.cursorY - 40;

    // ── Conclusión ──────────────────────────────────────────────────────
    const conclusionResult = this._drawConclusion({
      page,
      pdfDoc,
      cursorY,
      font,
      fontBold,
      width,
      conclusion,
      clienteNombre: cliente?.razon_social,
    });

    // page = conclusionResult.page;
    // cursorY = conclusionResult.cursorY;

      page = pdfDoc.addPage();
      cursorY = page.getHeight() - 60;

    // ── Factores de calidad ─────────────────────────────────────────────
    const factoresResult = await this._drawFactoresCalidad({
      page,
      pdfDoc,
      cursorY,
      font,
      fontBold,
      width,
    });

    page = factoresResult.page;
    cursorY = factoresResult.cursorY - 30; // 🔥 CLAVE

    // ── Footer ──────────────────────────────────────────────────────────
    this._drawFooter({ page, font });

    // ── Footer ──────────────────────────────────────────────────────────
    this._drawFooter({ page, font });

    let pdfBytes = await pdfDoc.save();

    //------------ ANEXAR PDF INFORMA POZO AGUA -----------------
    // Ruta del PDF que querés anexar

    if (archivos && archivos.length > 0) {

      // const rutaExtra = path.join(this.imagesUrl, muestra.informe);
      // Unir
      try {
        // pdfBytes = await pdfUtils.unirPDFs(pdfBytes, rutaExtra);
        const rutas = [
          ...archivos.map(a => a.archivo)
        ]
        console.log('Rutas a anexar:', rutas);
        pdfBytes = await pdfUtils.unirMultiplesPDFs(pdfBytes, rutas);

      } catch (e) {
        console.log('No se pudo anexar PDF extra:', e.message);

      }
    }
    //-----------------------------------         

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
    let cursorY = height - 70;

    // ------------- LOGOS -----------------
    // LOGO DA
    const logoDA = await imagesUtils.getImageDimensions(pdfDoc, path.join(this.assetsUrl, 'images'), 'logo_don_asdrubal_100x355.png', 200, 100);
    if (logoDA) {
      page.drawImage(logoDA.image, {
        x: margin - 10,
        y: cursorY,
        width: logoDA.width,
        height: logoDA.height
      });
    }

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

    cursorY -= 100;

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
      ['pH', String(muestra.ph ?? 'N/D')],
      ['Dureza', String(muestra.dureza ?? 'N/D')],
      ['Alcalinidad', String(muestra.alcalinidad ?? '')],
      ['Salinidad (mg/l)', String(muestra.salinidad ?? 'N/D')],
      ['Conductividad (dS/cm)', String(muestra.conductividad ?? 'N/D')],
      ['Fuerza Iónica', String(muestra.fuerza_ionica ?? 'N/D')],
      ['Dosis Hard', String(muestra.dosis ?? 'N/D')],
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
    cursorY = refResult.cursorY - 30;

    // // ── Tabla dureza agua ─────────────────────────────────────────────
    // const durezaResult = this._drawTablaDureza({
    //   page,
    //   pdfDoc,
    //   cursorY,
    //   font,
    //   fontBold,
    // });
    // page = durezaResult.page;
    // cursorY = durezaResult.cursorY - 40;

    // ── Factores de calidad ─────────────────────────────────────────────
    const factoresResult = await this._drawFactoresCalidad({
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

    // ===============================
    // GUARDAR PDF
    // ===============================    

    let pdfBytes = await pdfDoc.save();
    //------------ ANEXAR PDF INFORMA POZO AGUA -----------------
    // Ruta del PDF que querés anexar

    if (muestra.informe) {
      this.informesPath = path.join(this.informesPath, `${cliente.id}`, 'pozos', `${pozo.id}`, 'muestras', `${muestra.id}`);
      console.log('Ruta base para informes:', this.informesPath);
      const rutaExtra = path.join(this.informesPath, muestra.informe);
      console.log('Ruta del informe a anexar:', rutaExtra);
      // Unir
      try {
        pdfBytes = await pdfUtils.unirPDFs(pdfBytes, rutaExtra);
      } catch (e) {
        console.log('No se pudo anexar PDF extra:', e.message);
        console.log('ruta', rutaExtra);
      }
    }
    //-----------------------------------    

    return {
      pdfBytes,
      filename: `muestra_agua_${muestra_id}_${Date.now()}.pdf`,
    };
  }
}

export default PdfMuestraAguaService;

// ── Opcional: guardar el reporte en disco ────────────────────────────────────
// await fsPromises.writeFile(outputPath, pdfBytes);
// return { success: true, path: outputPath, filename };
