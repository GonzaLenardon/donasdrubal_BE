// src/services/pdfServicePdfLib.js
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';


class PDFServicePdfLib {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'public/reports');
  }

  async generarInformeCalibracion(datos) {
    await fs.mkdir(this.outputDir, { recursive: true });

    const pdfDoc = await PDFDocument.create();


    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    this.font = font;
    this.fontBold = fontBold;

    let page = pdfDoc.addPage();
    let { height } = page.getSize();

    const margin = 50;
    let y = height - margin;

    const nuevaPaginaSiNecesario = (alto = 40) => {
      if (y - alto < margin) {
        page = pdfDoc.addPage();
        y = height - margin;
        this.drawHeader(page, fontBold);
        y -= 40;
      }
    };

    // HEADER
    this.drawHeader(page, fontBold);
    y -= 60;

    // TÍTULO
    page.drawText('Diagnóstico y Puesta a Punto de Pulverizadora', {
      x: margin,
      y,
      size: 16,
      font: fontBold
    });
    y -= 30;

    // DATOS GENERALES
    y = this.drawLabelValue(page, 'Cliente:', datos.empresa, y, font, fontBold);
    y = this.drawLabelValue(page, 'Fecha:', datos.fecha, y, font, fontBold);
    y = this.drawLabelValue(
      page,
      'Máquina:',
      `${datos.maquina} ${datos.modelo}`,
      y,
      font,
      fontBold
    );

    y -= 20;

    // COMPONENTES / ESTADOS
    for (const estado of datos.componentes) {
      nuevaPaginaSiNecesario(160);
      y = await this.drawEstado(page, estado, y, font, fontBold, pdfDoc);
      y -= 10;
    }

    // MEDICIONES
    nuevaPaginaSiNecesario(120);
    y = this.drawSection(page, 'MEDICIÓN DE PRESIONES', '', y, font, fontBold);
    y = this.drawTablaPresiones(page, datos, y, font);

    // OBSERVACIONES GENERALES
    nuevaPaginaSiNecesario(120);
    y = this.drawSection(
      page,
      'OBSERVACIONES GENERALES',
      datos.observaciones_generales,
      y,
      font,
      fontBold
    );

    // FOOTER
    const pages = pdfDoc.getPages();
    pages.forEach((p, idx) => {
      p.drawText(
        `Don Asdrúbal S.R.L – Departamento I+D — Página ${idx + 1} de ${pages.length}`,
        {
          x: margin,
          y: 20,
          size: 9,
          font,
          color: rgb(0.4, 0.4, 0.4)
        }
      );
    });

    const pdfBytes = await pdfDoc.save();
    const filename = `calibracion_${Date.now()}.pdf`;
    const outputPath = path.join(this.outputDir, filename);

    await fs.writeFile(outputPath, pdfBytes);

    return outputPath;
  }

  drawHeader(page, fontBold) {
    page.drawText('Don Asdrúbal S.R.L – Departamento I+D', {
      x: 50,
      y: page.getHeight() - 30,
      size: 10,
      font: fontBold
    });
  }

  drawLabelValue(page, label, value, y, font, fontBold) {
    page.drawText(label, { x: 50, y, size: 11, font: fontBold });
    page.drawText(value || '—', { x: 150, y, size: 11, font });
    return y - 18;
  }

  drawSection(page, title, text, y, font, fontBold) {
    page.drawText(title, { x: 50, y, size: 13, font: fontBold });
    y -= 18;

    const lines = this.wrapText(text, 95);
    for (const line of lines) {
      page.drawText(line, { x: 50, y, size: 11, font });
      y -= 14;
    }

    return y;
  }

  async drawEstado(page, estado, y, font, fontBold, pdfDoc) {
    page.drawText(`${estado.titulo} — ${estado.estado}`, {
      x: 50,
      y,
      size: 12,
      font: fontBold
    });
    y -= 16;

const detalles = [];

if (estado.modelo) detalles.push(`Modelo: ${estado.modelo}`);
if (estado.materiales) detalles.push(`Material: ${estado.materiales}`);
if (estado.color) detalles.push(`Color: ${estado.color}`);
if (estado.numero) detalles.push(`N°: ${estado.numero}`);
if (estado.presenciaORing)
  detalles.push(`O-Ring: ${estado.presenciaORing}`);

if (detalles.length) {
  page.drawText(detalles.join(' | '), {
    x: 50,
    y,
    size: 10,
    font
  });
  y -= 14;
}

if (estado.valor_medido) {
  page.drawText(`Valor medido: ${estado.valor_medido}`, {
    x: 50,
    y,
    size: 10,
    font
  });
  y -= 14;
}


    if (estado.observacion) {
      y = this.drawSection(page, 'Observaciones', estado.observacion, y, font, fontBold);
    }

    if (estado.recomendaciones?.length) {
      y = this.drawSection(
        page,
        'Recomendaciones',
        estado.recomendaciones.map(r => `• ${r.texto}`).join(' '),
        y,
        font,
        fontBold
      );
    }

    // 🔹 IMAGEN DEL ESTADO (ACÁ VA EL CÓDIGO QUE PREGUNTABAS)
    if (estado.imagen_buffer) {
      const image =
        estado.imagen_buffer[0] === 0x89
          ? await pdfDoc.embedPng(estado.imagen_buffer)
          : await pdfDoc.embedJpg(estado.imagen_buffer);

      const maxWidth = 200;
      const scale = maxWidth / image.width;

      const imgWidth = image.width * scale;
      const imgHeight = image.height * scale;

      page.drawImage(image, {
        x: 50,
        y: y - imgHeight,
        width: imgWidth,
        height: imgHeight
      });

      y -= imgHeight + 10;
    }

    return y;
  }

  drawTablaPresiones(page, datos, y, font, fontBold) {
    const rows = [
      ['Reloj UNIMAP', datos.presion_unimap],
      ['Computadora', datos.presion_computadora],
      ['Manómetro', datos.presion_manometro]
    ];

    for (const [label, value] of rows) {
      page.drawText(label, { x: 50, y, size: 11, font });
      page.drawText(`${value} bar`, { x: 250, y, size: 11, font });
      y -= 16;
    }

if (datos.secciones && Object.keys(datos.secciones).length) {
  y = this.drawSection(
    page,
    'PRESIÓN POR SECCIONES',
    '',
    y,
    font,
    fontBold
  );

  for (const [sec, val] of Object.entries(datos.secciones)) {
    page.drawText(`Sección ${sec}: ${val} bar`, {
      x: 60,
      y,
      size: 11,
      font
    });
    y -= 14;
  }
}
    

    return y;
  }

  wrapText(text, maxChars) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let line = '';

    for (const word of words) {
      if ((line + word).length > maxChars) {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    }

    if (line) lines.push(line.trim());
    return lines;
  }
}

export default new PDFServicePdfLib();
