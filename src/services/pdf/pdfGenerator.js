// services/pdf/pdfGenerator.js

import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import { LayoutManager } from './layout.js';
import { drawHeader, drawCard } from './components.js';

export async function generateCalibracionPDF(calibracion) {
  const pdfDoc = await PDFDocument.create();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const layout = new LayoutManager(pdfDoc, font);

  drawHeader(layout, calibracion, fontBold);

  const componentes = [
    ['Estado Máquina', calibracion.estado_maquina],
    ['Estado Bomba', calibracion.estado_bomba],
    ['Estado Agitador', calibracion.estado_agitador],
    ['Filtro Primario', calibracion.estado_filtroPrimario],
    ['Filtro Secundario', calibracion.estado_filtroSecundario],
    ['Filtro Línea', calibracion.estado_filtroLinea],
    ['Mangueras y Conexiones', calibracion.estado_manguerayconexiones],
    ['Antigoteo', calibracion.estado_antigoteo],
    ['Limpieza Tanque', calibracion.estado_limpiezaTanque],
    ['Pastillas', calibracion.estado_pastillas],
    ['Estabilidad Botalón', calibracion.estabilidadVerticalBotalon],
    ['Mixer', calibracion.mixer],
  ];

  for (const [title, data] of componentes) {
    if (data) {
      drawCard(layout, title, data, font, fontBold);
    }
  }

  const pdfBytes = await pdfDoc.save();

  const outputPath = `./temp/calibracion_${calibracion.id}.pdf`;
  await fs.writeFile(outputPath, pdfBytes);

  return outputPath;
}
