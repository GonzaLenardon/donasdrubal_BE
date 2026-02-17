// services/pdf/components.js

import { rgb } from 'pdf-lib';
import { COLORS, PAGE } from './constants.js';
import { drawTextBlock } from './helpers.js';

export function drawHeader(layout, data, fontBold) {
  const { page } = layout;
  const width = page.getWidth();

  page.drawRectangle({
    x: 0,
    y: page.getHeight() - PAGE.headerHeight,
    width,
    height: PAGE.headerHeight,
    color: rgb(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b)
  });

  page.drawText(`Informe de Calibración`, {
    x: PAGE.margin,
    y: page.getHeight() - 35,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  page.drawText(`Fecha: ${data.fecha || ''}`, {
    x: PAGE.margin,
    y: page.getHeight() - 50,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1)
  });
}

export function drawBadge(page, text, x, y, font) {
  const colorEstado = COLORS.estados[text] || COLORS.estados['NO_APLICA'];
  const width = font.widthOfTextAtSize(text, 9) + 12;

  page.drawRectangle({
    x,
    y: y - 10,
    width,
    height: 14,
    color: rgb(colorEstado.r, colorEstado.g, colorEstado.b),
    borderRadius: 4
  });

  page.drawText(text, {
    x: x + 6,
    y: y - 7,
    size: 9,
    font,
    color: rgb(1, 1, 1)
  });

  return width;
}

export function drawCard(layout, title, estadoObj, font, fontBold) {
  const { page } = layout;

  const cardHeightEstimate = 120;
  layout.ensureSpace(cardHeightEstimate);

  const startY = layout.cursorY;

  page.drawRectangle({
    x: PAGE.margin,
    y: startY - 110,
    width: page.getWidth() - PAGE.margin * 2,
    height: 110,
    borderColor: rgb(COLORS.border.r, COLORS.border.g, COLORS.border.b),
    borderWidth: 1
  });

  page.drawText(title, {
    x: PAGE.margin + 10,
    y: startY - 20,
    size: 12,
    font: fontBold
  });

  drawBadge(
    page,
    estadoObj.estado,
    page.getWidth() - PAGE.margin - 80,
    startY - 20,
    font
  );

  const textHeight = drawTextBlock({
    page,
    text: estadoObj.observacion || '',
    x: PAGE.margin + 10,
    y: startY - 40,
    size: 10,
    font,
    color: rgb(0, 0, 0),
    maxWidth: page.getWidth() - PAGE.margin * 2 - 20,
    lineHeight: PAGE.lineHeight
  });

  layout.moveDown(130);
}
