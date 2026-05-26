// services/pdf/pdfResumenService.js

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

class PdfResumenService {
  constructor() {
    this.margin = 40;

    this.assetsPath = path.join(process.cwd(), 'src', 'assets', 'images');
  }

  // =========================================================
  // LOAD IMAGE
  // =========================================================

  async loadImage(pdfDoc, filename) {
    const imageBytes = await fs.readFile(path.join(this.assetsPath, filename));

    if (filename.endsWith('.png')) {
      return await pdfDoc.embedPng(imageBytes);
    }

    return await pdfDoc.embedJpg(imageBytes);
  }

  // =========================================================
  // ICON + TEXT
  // =========================================================

  drawIconText({ page, icon, text, x, y, font, boldFont, label }) {
    page.drawImage(icon, {
      x,
      y: y - 2,
      width: 14,
      height: 14,
    });

    page.drawText(label, {
      x: x + 22,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    page.drawText(text || '-', {
      x: x + 90,
      y,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  // =========================================================
  // HEADER
  // =========================================================

  drawHeader({ page, width, height, periodo, logo, font, boldFont }) {
    // línea superior
    page.drawRectangle({
      x: 0,
      y: height - 130,
      width,
      height: 5,
      color: rgb(0, 0.35, 0.1),
    });

    // logo
    page.drawImage(logo, {
      x: 40,
      y: height - 120,
      width: 160,
      height: 55,
    });

    // titulo
    page.drawText('RESUMEN SEMANAL', {
      x: width / 2 - 150,
      y: height - 70,
      size: 24,
      font: boldFont,
      color: rgb(0, 0.35, 0.1),
    });

    page.drawText(`Período: ${periodo}`, {
      x: width / 2 - 120,
      y: height - 100,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Fecha: ${new Date().toLocaleDateString('es-AR')}`, {
      x: width - 170,
      y: height - 100,
      size: 10,
      font,
    });
  }

  // =========================================================
  // CLIENTE CARD
  // =========================================================

  drawClienteCard({ page, cliente, y, width, font, boldFont, icons }) {
    const cardX = 40;
    const cardWidth = width - 80;
    const cardHeight = 155;

    // ─────────────────────────────────────
    // CARD
    // ─────────────────────────────────────
    page.drawRectangle({
      x: cardX,
      y: y - cardHeight,
      width: cardWidth,
      height: cardHeight,
      borderWidth: 1,
      borderColor: rgb(0.7, 0.7, 0.7),
      color: rgb(1, 1, 1),
    });

    // ─────────────────────────────────────
    // HEADER VERDE
    // ─────────────────────────────────────
    page.drawRectangle({
      x: cardX,
      y: y - 30,
      width: cardWidth,
      height: 30,
      color: rgb(0, 0.35, 0.1),
    });

    // ─────────────────────────────────────
    // NOMBRE CLIENTE
    // ─────────────────────────────────────
    page.drawText(cliente.razon_social.toUpperCase(), {
      x: cardX + 15,
      y: y - 20,
      size: 15,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    // ─────────────────────────────────────
    // EMAIL
    // ─────────────────────────────────────
    this.drawIconText({
      page,
      icon: icons.email,
      text: cliente.email || '-',
      x: cardX + 20,
      y: y - 55,
      font,
      boldFont,
      label: 'Email:',
    });

    // ─────────────────────────────────────
    // TELEFONO
    // ─────────────────────────────────────
    this.drawIconText({
      page,
      icon: icons.phone,
      text: cliente.telefono || '-',
      x: cardX + 20,
      y: y - 78,
      font,
      boldFont,
      label: 'Teléfono:',
    });

    // ─────────────────────────────────────
    // LINEA VERTICAL
    // ─────────────────────────────────────
    page.drawLine({
      start: { x: cardX + 240, y: y - 92 },
      end: { x: cardX + 240, y: y - 45 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // ─────────────────────────────────────
    // ICONO INGENIERO
    // ─────────────────────────────────────
    page.drawImage(icons.ingeniero, {
      x: cardX + 270,
      y: y - 60,
      width: 15,
      height: 15,
    });

    // ─────────────────────────────────────
    // TITULO INGENIEROS
    // ─────────────────────────────────────
    page.drawText('Ingenieros asignados:', {
      x: cardX + 295,
      y: y - 55,
      size: 10,
      font: boldFont,
    });

    // ─────────────────────────────────────
    // LISTA INGENIEROS
    // ─────────────────────────────────────
    let ingY = y - 78;

    cliente.ingenieros.forEach((ing) => {
      page.drawText(
        `• ${ing.nombre}${ing.es_principal ? ' (Principal)' : ''}`,
        {
          x: cardX + 300,
          y: ingY,
          size: 10,
          font,
        },
      );

      ingY -= 16;
    });

    // ─────────────────────────────────────
    // LINEA SEPARADORA
    // ─────────────────────────────────────
    const separatorY = y - 98;

    page.drawLine({
      start: { x: cardX + 20, y: separatorY },
      end: { x: cardX + cardWidth - 20, y: separatorY },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });

    // ─────────────────────────────────────
    // METRICAS
    // ─────────────────────────────────────
    const metrics = [
      {
        icon: icons.maquinas,
        label: 'Calibraciones',
        value: cliente.resumen.calibraciones,
      },
      {
        icon: icons.agua,
        label: 'Muestras',
        value: cliente.resumen.muestras_agua,
      },
      {
        icon: icons.calendario,
        label: 'Jornadas',
        value: cliente.resumen.jornadas,
      },
      {
        icon: icons.alertas,
        label: 'Alertas',
        value: cliente.resumen.alertas.total,
      },
      {
        icon: icons.notas,
        label: 'Notas',
        value: cliente.resumen.comentarios_observaciones,
      },
    ];

    const metricWidth = cardWidth / metrics.length;

    metrics.forEach((metric, index) => {
      const startX = cardX + index * metricWidth;

      // ─────────────────────────────
      // LINEAS VERTICALES
      // ─────────────────────────────
      if (index !== 0) {
        page.drawLine({
          start: { x: startX, y: y - 142 },
          end: { x: startX, y: y - 108 },
          thickness: 1,
          color: rgb(0.85, 0.85, 0.85),
        });
      }

      // ─────────────────────────────
      // CENTRO COLUMNA
      // ─────────────────────────────
      const centerX = startX + metricWidth / 2;

      // ─────────────────────────────
      // ICONO
      // ─────────────────────────────
      page.drawImage(metric.icon, {
        x: centerX - 42,
        y: y - 126,
        width: 16,
        height: 16,
      });

      // ─────────────────────────────
      // LABEL
      // ─────────────────────────────
      const labelWidth = font.widthOfTextAtSize(metric.label, 9);

      page.drawText(metric.label, {
        x: centerX - labelWidth / 2 + 10,
        y: y - 118,
        size: 9,
        font,
      });

      // ─────────────────────────────
      // VALOR
      // ─────────────────────────────
      const value = String(metric.value);

      const valueWidth = boldFont.widthOfTextAtSize(value, 12);

      page.drawText(value, {
        x: centerX - valueWidth / 2,
        y: y - 136,
        size: 12,
        font: boldFont,
        color: rgb(0, 0.35, 0.1),
      });
    });

    // ─────────────────────────────────────
    // RETORNO FINAL
    // ─────────────────────────────────────
    return y - 185;
  }

  // =========================================================
  // MAIN
  // =========================================================

  async generarReporteSemanal(reporteData) {
    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // IMAGENES
    const logo = await this.loadImage(pdfDoc, 'logo_don_asdrubal_100x355.png');

    const icons = {
      email: await this.loadImage(pdfDoc, 'email.png'),
      phone: await this.loadImage(pdfDoc, 'phone.png'),
      ingeniero: await this.loadImage(pdfDoc, 'ingeniero.png'),
      maquinas: await this.loadImage(pdfDoc, 'maquinas.png'),
      agua: await this.loadImage(pdfDoc, 'agua.png'),
      calendario: await this.loadImage(pdfDoc, 'calendario.png'),
      notas: await this.loadImage(pdfDoc, 'notas.png'),
      alertas: await this.loadImage(pdfDoc, 'alerta.png'),
    };

    let page = pdfDoc.addPage([842, 595]);

    const { width, height } = page.getSize();

    // HEADER
    this.drawHeader({
      page,
      width,
      height,
      periodo: reporteData.periodo,
      logo,
      font,
      boldFont,
    });

    let currentY = height - 170;

    // CLIENTES
    for (const cliente of reporteData.data) {
      if (currentY < 180) {
        page = pdfDoc.addPage([842, 595]);

        currentY = height - 60;
      }

      currentY = this.drawClienteCard({
        page,
        cliente,
        y: currentY,
        width,
        font,
        boldFont,
        icons,
      });
    }

    // FOOTER
    page.drawLine({
      start: { x: 40, y: 30 },
      end: { x: width - 40, y: 30 },
      thickness: 2,
      color: rgb(0, 0.35, 0.1),
    });

    page.drawText('Don Asdrúbal – Departamento I+D', {
      x: width / 2 - 90,
      y: 15,
      size: 11,
      font,
    });

    const pdfBytes = await pdfDoc.save();

    return {
      pdfBytes,
      filename: `resumen_semanal_${Date.now()}.pdf`,
    };
  }
}

export default PdfResumenService;
