import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

// =====================================================
// PALETA Y CONSTANTES DE DISEÑO
// =====================================================
const COLOR = {
  primary: rgb(0.106, 0.349, 0.192), // verde Don Asdrúbal (~#1B5931)
  primaryLight: rgb(0.91, 0.96, 0.92),
  primarySoft: rgb(0.85, 0.95, 0.85),
  text: rgb(0.13, 0.13, 0.13),
  textMuted: rgb(0.45, 0.45, 0.45),
  border: rgb(0.85, 0.85, 0.85),
  cardBg: rgb(0.985, 0.99, 0.985),
  white: rgb(1, 1, 1),
  up: rgb(0.13, 0.55, 0.13),
  down: rgb(0.75, 0.15, 0.15),
  neutral: rgb(0.5, 0.5, 0.5),
  warnBar: rgb(0.85, 0.55, 0.15),
  donut: [
    rgb(0.106, 0.349, 0.192), // calibraciones
    rgb(0.55, 0.78, 0.45), // muestras
    rgb(0.95, 0.75, 0.2), // jornadas
    rgb(0.18, 0.27, 0.45), // notas
  ],
};

const LAYOUT = {
  pageWidth: 842,
  pageHeight: 595,
  margin: 36,
  colGap: 16,
};

class PdfResumenCrmService {
  constructor() {
    this.assetsPath = path.join(process.cwd(), 'src', 'assets', 'images');
  }

  // =====================================================
  // CARGA DE RECURSOS
  // =====================================================
  async loadImage(pdfDoc, filename) {
    const imageBytes = await fs.readFile(path.join(this.assetsPath, filename));
    return filename.endsWith('.png')
      ? await pdfDoc.embedPng(imageBytes)
      : await pdfDoc.embedJpg(imageBytes);
  }

  // =====================================================
  // PRIMITIVAS DE DIBUJO REUTILIZABLES
  // =====================================================

  /**
   * Rectángulo simple (esquinas rectas). Se mantiene el nombre del método
   * por compatibilidad con todos los callers existentes, pero ya no simula
   * bordes redondeados con círculos en las esquinas: se descartó por pedido
   * explícito (quedaba visualmente cargado en cards chicas).
   */
  drawRoundedRect({
    page,
    x,
    y,
    width,
    height,
    color,
    borderColor,
    borderWidth,
  }) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color,
      borderColor,
      borderWidth,
    });
  }

  /**
   * Triángulo simple (usado como flecha ▲/▼) dibujado con drawSvgPath.
   * IMPORTANTE: drawSvgPath en pdf-lib aplica un flip vertical interno
   * (matriz [1 0 0 -1 0 0]) para interpretar el path como SVG estándar
   * (Y hacia abajo). Para que termine en la posición Y esperada del
   * sistema de coordenadas de PDF (Y hacia arriba), hay que negar
   * manualmente todas las coordenadas Y del path.
   */
  drawTriangle({ page, x, y, size, color, direction = 'up' }) {
    const path =
      direction === 'up'
        ? `M ${x},${-y} L ${x + size},${-y} L ${x + size / 2},${-(y + size)} Z`
        : `M ${x},${-(y + size)} L ${x + size},${-(y + size)} L ${x + size / 2},${-y} Z`;
    page.drawSvgPath(path, { color });
  }

  /** Badge de variación con flecha vectorial (▲/▼) o marcador neutro, y color semántico. */
  drawVariationBadge({ page, x, y, variacion, font, size = 8 }) {
    let color = COLOR.neutral;
    let direction = null;

    if (variacion.startsWith('+')) {
      color = COLOR.up;
      direction = 'up';
    } else if (variacion.startsWith('-')) {
      color = COLOR.down;
      direction = 'down';
    } else if (variacion === 'Nuevo') {
      color = COLOR.primary;
    }

    const markerSize = size * 0.7;
    let textX = x;

    if (direction) {
      this.drawTriangle({
        page,
        x,
        y: y + 1,
        size: markerSize,
        color,
        direction,
      });
      textX = x + markerSize + 4;
    } else if (variacion === 'Nuevo') {
      page.drawRectangle({
        x,
        y: y + 1,
        width: markerSize * 0.7,
        height: markerSize * 0.7,
        color,
      });
      textX = x + markerSize + 4;
    } else {
      page.drawRectangle({
        x,
        y: y + size * 0.35,
        width: markerSize,
        height: 1.5,
        color,
      });
      textX = x + markerSize + 4;
    }

    page.drawText(variacion, { x: textX, y, size, font, color });
  }

  /** Ícono simple dibujado con primitivas (sin SVG externo) para no depender de assets. */
  drawIcon({ page, type, x, y, size, color }) {
    const s = size;
    switch (type) {
      case 'clientes': {
        // dos cabezas (círculos) + cuerpos (rect)
        page.drawEllipse({
          x: x + s * 0.35,
          y: y + s * 0.65,
          xScale: s * 0.18,
          yScale: s * 0.18,
          color,
        });
        page.drawEllipse({
          x: x + s * 0.68,
          y: y + s * 0.6,
          xScale: s * 0.15,
          yScale: s * 0.15,
          color,
        });
        page.drawRectangle({
          x: x + s * 0.15,
          y: y + s * 0.1,
          width: s * 0.42,
          height: s * 0.32,
          color,
        });
        page.drawRectangle({
          x: x + s * 0.52,
          y: y + s * 0.08,
          width: s * 0.36,
          height: s * 0.28,
          color,
        });
        break;
      }
      case 'actividades': {
        for (let i = 0; i < 3; i++) {
          page.drawRectangle({
            x: x + s * 0.1,
            y: y + s * (0.15 + i * 0.3),
            width: s * 0.12,
            height: s * 0.12,
            color,
          });
          page.drawRectangle({
            x: x + s * 0.32,
            y: y + s * (0.18 + i * 0.3),
            width: s * 0.55,
            height: s * 0.06,
            color,
          });
        }
        break;
      }
      case 'ingenieros': {
        page.drawEllipse({
          x: x + s * 0.5,
          y: y + s * 0.65,
          xScale: s * 0.2,
          yScale: s * 0.2,
          color,
        });
        page.drawRectangle({
          x: x + s * 0.22,
          y: y + s * 0.08,
          width: s * 0.56,
          height: s * 0.35,
          color,
        });
        break;
      }
      case 'calibraciones': {
        // llave inglesa estilizada: dos rects cruzados
        page.drawRectangle({
          x: x + s * 0.15,
          y: y + s * 0.45,
          width: s * 0.7,
          height: s * 0.12,
          color,
          rotate: undefined,
        });
        page.drawEllipse({
          x: x + s * 0.2,
          y: y + s * 0.51,
          xScale: s * 0.12,
          yScale: s * 0.12,
          color: undefined,
          borderColor: color,
          borderWidth: s * 0.05,
        });
        page.drawEllipse({
          x: x + s * 0.8,
          y: y + s * 0.51,
          xScale: s * 0.12,
          yScale: s * 0.12,
          color: undefined,
          borderColor: color,
          borderWidth: s * 0.05,
        });
        break;
      }
      case 'muestras': {
        // frasco/erlenmeyer simple
        page.drawRectangle({
          x: x + s * 0.42,
          y: y + s * 0.55,
          width: s * 0.16,
          height: s * 0.3,
          color,
        });
        page.drawLine({
          start: { x: x + s * 0.3, y: y + s * 0.1 },
          end: { x: x + s * 0.42, y: y + s * 0.55 },
          thickness: s * 0.06,
          color,
        });
        page.drawLine({
          start: { x: x + s * 0.7, y: y + s * 0.1 },
          end: { x: x + s * 0.58, y: y + s * 0.55 },
          thickness: s * 0.06,
          color,
        });
        page.drawLine({
          start: { x: x + s * 0.3, y: y + s * 0.1 },
          end: { x: x + s * 0.7, y: y + s * 0.1 },
          thickness: s * 0.06,
          color,
        });
        break;
      }
      case 'notas': {
        page.drawRectangle({
          x: x + s * 0.18,
          y: y + s * 0.1,
          width: s * 0.64,
          height: s * 0.78,
          color: undefined,
          borderColor: color,
          borderWidth: s * 0.06,
        });
        for (let i = 0; i < 3; i++) {
          page.drawLine({
            start: { x: x + s * 0.3, y: y + s * (0.3 + i * 0.18) },
            end: { x: x + s * 0.7, y: y + s * (0.3 + i * 0.18) },
            thickness: s * 0.04,
            color,
          });
        }
        break;
      }
      case 'jornadas': {
        // calendario: marco + barra superior + grilla de días
        page.drawRectangle({
          x: x + s * 0.12,
          y: y + s * 0.08,
          width: s * 0.76,
          height: s * 0.68,
          color: undefined,
          borderColor: color,
          borderWidth: s * 0.05,
        });
        page.drawRectangle({
          x: x + s * 0.12,
          y: y + s * 0.6,
          width: s * 0.76,
          height: s * 0.16,
          color,
        });
        page.drawRectangle({
          x: x + s * 0.26,
          y: y + s * 0.78,
          width: s * 0.07,
          height: s * 0.16,
          color,
        });
        page.drawRectangle({
          x: x + s * 0.67,
          y: y + s * 0.78,
          width: s * 0.07,
          height: s * 0.16,
          color,
        });
        break;
      }
      case 'alertas': {
        // triángulo de advertencia con signo de exclamación
        page.drawSvgPath(
          `M ${x + s * 0.5},${-(y + s * 0.85)} L ${x + s * 0.06},${-(y + s * 0.08)} L ${x + s * 0.94},${-(y + s * 0.08)} Z`,
          { color },
        );
        page.drawRectangle({
          x: x + s * 0.46,
          y: y + s * 0.32,
          width: s * 0.08,
          height: s * 0.26,
          color: COLOR.white,
        });
        page.drawRectangle({
          x: x + s * 0.46,
          y: y + s * 0.2,
          width: s * 0.08,
          height: s * 0.07,
          color: COLOR.white,
        });
        break;
      }
      case 'total': {
        // mini gráfico de barras ascendentes
        const heights = [0.35, 0.55, 0.8];
        heights.forEach((h, i) => {
          page.drawRectangle({
            x: x + s * (0.12 + i * 0.3),
            y: y + s * 0.08,
            width: s * 0.2,
            height: s * h,
            color,
          });
        });
        break;
      }
      default:
        break;
    }
  }

  /** KPI card siguiendo el mockup: ícono + label arriba, valor grande, badge de variación abajo. */
  drawKpiCard({
    page,
    x,
    y,
    width,
    height,
    icon,
    titulo,
    valor,
    variacion,
    font,
    boldFont,
  }) {
    this.drawRoundedRect({
      page,
      x,
      y,
      width,
      height,
      color: COLOR.cardBg,
      borderColor: COLOR.border,
      borderWidth: 0.75,
    });

    const padding = 7;
    const iconSize = 13;
    const labelLineHeight = 7;

    this.drawIcon({
      page,
      type: icon,
      x: x + padding,
      y: y + height - iconSize - 7,
      size: iconSize,
      color: COLOR.primary,
    });

    // Reservamos siempre el espacio de 2 líneas de título (consistente entre
    // cards, independientemente de si el texto ocupa 1 o 2 líneas), para que
    // el valor numérico nunca quede a una altura variable ni se solape.
    this.drawWrappedLabel({
      page,
      text: titulo.toUpperCase(),
      x: x + padding,
      y: y + height - iconSize - 16,
      maxWidth: width - padding * 2,
      font: boldFont,
      size: 6,
      color: COLOR.textMuted,
      lineHeight: labelLineHeight,
      maxLines: 2,
    });

    const valorY = y + height - iconSize - 16 - labelLineHeight * 2 - 7;

    const valorStr = String(valor);
    const valorWidth = boldFont.widthOfTextAtSize(valorStr, 16);

    page.drawText(valorStr, {
      x: x + padding,
      y: valorY,
      size: 16,
      font: boldFont,
      color: COLOR.primary,
    });

    // Badge alineado al mismo baseline que el número, a su derecha con un gap de 5px.
    this.drawVariationBadge({
      page,
      x: x + padding + valorWidth + 5,
      y: valorY,
      variacion,
      font: boldFont,
      size: 7,
    });
  }

  /**
   * Texto envuelto manualmente a un ancho máximo (sin depender de maxWidth
   * nativo de drawText, para controlar interlineado y truncado a N líneas).
   * Devuelve la cantidad de líneas efectivamente dibujadas, para que el
   * caller pueda acomodar el contenido siguiente sin solaparse.
   */
  drawWrappedLabel({
    page,
    text,
    x,
    y,
    maxWidth,
    font,
    size,
    color,
    lineHeight,
    maxLines = 2,
  }) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach((word) => {
      const tentative = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(tentative, size) > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = tentative;
      }
    });
    if (currentLine) lines.push(currentLine);

    const visibleLines = lines.slice(0, maxLines);

    visibleLines.forEach((line, i) => {
      page.drawText(line, { x, y: y - i * lineHeight, size, font, color });
    });

    return visibleLines.length;
  }

  /** Título de sección con franja de fondo, igual criterio que el original pero con ancho variable. */
  drawSectionTitle({ page, x, y, width, title, boldFont }) {
    this.drawRoundedRect({
      page,
      x,
      y: y - 4,
      width,
      height: 18,
      color: COLOR.primarySoft,
    });
    page.drawText(title.toUpperCase(), {
      x: x + 8,
      y,
      size: 10,
      font: boldFont,
      color: COLOR.primary,
    });
  }

  /** Mini barra de progreso horizontal usada dentro de las tablas (estilo mockup). */
  drawMiniBar({ page, x, y, width, height = 6, value, max, color }) {
    const ratio = max > 0 ? Math.min(value / max, 1) : 0;
    page.drawRectangle({ x, y, width, height, color: COLOR.primaryLight });
    if (ratio > 0) {
      page.drawRectangle({ x, y, width: width * ratio, height, color });
    }
  }

  /**
   * Tabla genérica con anchos de columna configurables y soporte opcional
   * de mini-barra en la última columna (para "Clientes con mayor actividad").
   */
  drawTable({
    page,
    x,
    y,
    width,
    headers,
    rows,
    columnWidths,
    font,
    boldFont,
    rowHeight = 16,
    withBar = false,
    barMax = 1,
  }) {
    let currentY = y;

    headers.forEach((header, i) => {
      const colX = x + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      page.drawText(header.toUpperCase(), {
        x: colX,
        y: currentY,
        size: 8,
        font: boldFont,
        color: COLOR.white,
      });
    });

    // Fondo del header
    page.drawRectangle({
      x,
      y: currentY - 4,
      width,
      height: 16,
      color: COLOR.primary,
    });
    headers.forEach((header, i) => {
      const colX = x + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      page.drawText(header.toUpperCase(), {
        x: colX + 4,
        y: currentY,
        size: 8,
        font: boldFont,
        color: COLOR.white,
      });
    });

    currentY -= rowHeight;

    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        page.drawRectangle({
          x,
          y: currentY - 3,
          width,
          height: rowHeight,
          color: COLOR.primaryLight,
        });
      }

      const values = Object.values(row);
      values.forEach((value, colIndex) => {
        const colX =
          x + columnWidths.slice(0, colIndex).reduce((a, b) => a + b, 0);
        const isLastCol = colIndex === values.length - 1;

        if (withBar && isLastCol) {
          const barWidth = columnWidths[colIndex] - 10;
          this.drawMiniBar({
            page,
            x: colX + 4,
            y: currentY + 1,
            width: barWidth * 0.55,
            value: Number(value) || 0,
            max: barMax,
            color: COLOR.primary,
          });
          page.drawText(String(value), {
            x: colX + 4 + barWidth * 0.55 + 6,
            y: currentY,
            size: 8,
            font,
            color: COLOR.text,
          });
        } else {
          page.drawText(String(value), {
            x: colX + 4,
            y: currentY,
            size: 8,
            font,
            color: COLOR.text,
          });
        }
      });

      currentY -= rowHeight;
    });

    return currentY;
  }

  /**
   * Donut chart dibujado a mano con drawSvgPath (sin Canvas/Chart.js).
   * Devuelve también la posición sugerida para la leyenda.
   */
  drawDonutChart({ page, cx, cy, outerR, innerR, data, colors }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let startAngle = -Math.PI / 2; // empieza arriba, como en el mockup

    if (total === 0) {
      page.drawEllipse({
        x: cx,
        y: cy,
        xScale: outerR,
        yScale: outerR,
        color: COLOR.border,
      });
      page.drawEllipse({
        x: cx,
        y: cy,
        xScale: innerR,
        yScale: innerR,
        color: COLOR.white,
      });
      return;
    }

    data.forEach((d, i) => {
      const angle = (d.value / total) * Math.PI * 2;
      if (d.value > 0) {
        const path = this.buildDonutSlicePath(
          cx,
          cy,
          innerR,
          outerR,
          startAngle,
          startAngle + angle,
        );
        page.drawSvgPath(path, { color: colors[i % colors.length] });
      }
      startAngle += angle;
    });

    // Círculo blanco central para reforzar el efecto "donut" (cubre redondeos de los slices)
    page.drawEllipse({
      x: cx,
      y: cy,
      xScale: innerR,
      yScale: innerR,
      color: COLOR.white,
    });
  }

  /**
   * Construye el path de un sector de anillo (donut slice) aproximándolo
   * con segmentos rectos (sin usar el comando de arco "A" de SVG, que
   * drawSvgPath de pdf-lib no soporta de forma confiable).
   *
   * IMPORTANTE: las coordenadas Y se niegan porque drawSvgPath aplica un
   * flip vertical interno; ver nota en drawTriangle().
   */
  buildDonutSlicePath(
    cx,
    cy,
    innerR,
    outerR,
    startAngle,
    endAngle,
    steps = 32,
  ) {
    const polar = (r, angle) => ({
      x: cx + r * Math.cos(angle),
      y: -(cy + r * Math.sin(angle)),
    });

    const outerPts = [];
    for (let i = 0; i <= steps; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / steps);
      outerPts.push(polar(outerR, a));
    }
    const innerPts = [];
    for (let i = steps; i >= 0; i--) {
      const a = startAngle + (endAngle - startAngle) * (i / steps);
      innerPts.push(polar(innerR, a));
    }

    const points = [...outerPts, ...innerPts];
    const [first, ...rest] = points;
    return (
      `M ${first.x},${first.y} ` +
      rest.map((p) => `L ${p.x},${p.y}`).join(' ') +
      ' Z'
    );
  }

  /** Leyenda del donut: cuadrito de color + label + cantidad + porcentaje, con encabezados de columna. */
  drawDonutLegend({ page, x, y, data, colors, font, boldFont, total }) {
    const colLabel = x + 14;
    const colCantidad = x + 110;
    const colPct = x + 155;

    page.drawText('CANT.', {
      x: colCantidad,
      y: y + 12,
      size: 6.5,
      font: boldFont,
      color: COLOR.textMuted,
    });
    page.drawText('%', {
      x: colPct,
      y: y + 12,
      size: 6.5,
      font: boldFont,
      color: COLOR.textMuted,
    });

    let currentY = y;
    data.forEach((d, i) => {
      const pct = total > 0 ? Math.round((d.value * 100) / total) : 0;
      page.drawRectangle({
        x,
        y: currentY,
        width: 8,
        height: 8,
        color: colors[i % colors.length],
      });
      page.drawText(d.label, {
        x: colLabel,
        y: currentY + 1,
        size: 8,
        font,
        color: COLOR.text,
      });
      page.drawText(String(d.value), {
        x: colCantidad,
        y: currentY + 1,
        size: 8,
        font,
        color: COLOR.text,
      });
      page.drawText(`${pct}%`, {
        x: colPct,
        y: currentY + 1,
        size: 8,
        font: boldFont,
        color: COLOR.text,
      });
      currentY -= 14;
    });
  }

  // =====================================================
  // HEADER / FOOTER
  // =====================================================
  drawHeader({
    page,
    width,
    height,
    periodo,
    fechaInforme,
    logo,
    font,
    boldFont,
  }) {
    page.drawRectangle({
      x: 0,
      y: height - 4,
      width,
      height: 4,
      color: COLOR.primary,
    });

    if (logo) {
      const logoH = 42;
      const logoW = (logo.width / logo.height) * logoH;
      page.drawImage(logo, {
        x: LAYOUT.margin,
        y: height - logoH - 22,
        width: logoW,
        height: logoH,
      });
    }

    const title = 'RESUMEN SEMANAL CRM';
    const titleSize = 20;
    const textWidth = boldFont.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: (width - textWidth) / 2,
      y: height - 38,
      size: titleSize,
      font: boldFont,
      color: COLOR.primary,
    });

    const periodoText = `Período: ${periodo}`;
    const periodoWidth = font.widthOfTextAtSize(periodoText, 9);
    page.drawText(periodoText, {
      x: (width - periodoWidth) / 2,
      y: height - 54,
      size: 9,
      font,
      color: COLOR.textMuted,
    });

    const fechaText = `Fecha del informe: ${fechaInforme}`;
    const fechaWidth = font.widthOfTextAtSize(fechaText, 9);
    page.drawText(fechaText, {
      x: width - LAYOUT.margin - fechaWidth,
      y: height - 30,
      size: 9,
      font,
      color: COLOR.textMuted,
    });

    page.drawLine({
      start: { x: 0, y: height - 70 },
      end: { x: width, y: height - 70 },
      thickness: 0.75,
      color: COLOR.border,
    });
  }

  drawFooter({ page, width }) {
    page.drawLine({
      start: { x: LAYOUT.margin, y: 28 },
      end: { x: width - LAYOUT.margin, y: 28 },
      thickness: 1,
      color: COLOR.primary,
    });
    const text = 'Don Asdrúbal – Departamento I+D';
    page.drawText(text, {
      x: LAYOUT.margin,
      y: 14,
      size: 8,
      font: this._font,
      color: COLOR.textMuted,
    });

    const pageText = 'Informe generado automáticamente';
    const pw = this._font.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, {
      x: width - LAYOUT.margin - pw,
      y: 14,
      size: 8,
      font: this._font,
      color: COLOR.textMuted,
    });
  }

  // =====================================================
  // GENERACIÓN PRINCIPAL
  // =====================================================
  async generarReporteCrm(reporteData) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    this._font = font;

    let logo = null;
    try {
      logo = await this.loadImage(pdfDoc, 'logo_don_asdrubal_100x355.png');
    } catch {
      logo = null; // si falta el asset, seguimos sin romper el reporte
    }

    const page = pdfDoc.addPage([LAYOUT.pageWidth, LAYOUT.pageHeight]);
    const { width, height } = page.getSize();

    const periodoFilename = reporteData.periodo
      .replace(/\s+/g, '_')
      .replace(/[–—]/g, '-')
      .replace(/[<>:"/\\|?*]+/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    const fechaInforme = new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date());

    this.drawHeader({
      page,
      width,
      height,
      periodo: reporteData.periodo,
      fechaInforme,
      logo,
      font,
      boldFont,
    });

    // -----------------------------------------------
    // FILA DE KPIs (8 cards iguales, distribuidas en el ancho útil)
    // -----------------------------------------------
    const kpiTop = height - 95;
    const kpiHeight = 62;
    const usableWidth = width - LAYOUT.margin * 2;
    const kpiGap = 6;

    const totalActividades =
      reporteData.indicadores.calibraciones.actual +
      reporteData.indicadores.muestras.actual +
      reporteData.indicadores.jornadas.actual +
      reporteData.indicadores.notas.actual; /* +
      reporteData.indicadores.alertas.actual; */

    const kpis = [
      {
        icon: 'clientes',
        titulo: 'Clientes con actividad',
        data: reporteData.indicadores.clientes_activos,
      },
      {
        icon: 'ingenieros',
        titulo: 'Ingenieros con actividad',
        data: reporteData.indicadores.ingenieros_activos,
      },
      {
        icon: 'calibraciones',
        titulo: 'Calibraciones',
        data: reporteData.indicadores.calibraciones,
      },
      {
        icon: 'muestras',
        titulo: 'Muestras',
        data: reporteData.indicadores.muestras,
      },
      {
        icon: 'jornadas',
        titulo: 'Jornadas',
        data: reporteData.indicadores.jornadas,
      },
      { icon: 'notas', titulo: 'Notas', data: reporteData.indicadores.notas },
      /*  {
        icon: 'alertas',
        titulo: 'Alertas',
        data: reporteData.indicadores.alertas,
      }, */
      {
        icon: 'total',
        titulo: 'Total actividades',
        data: {
          actual: totalActividades,
          variacion: reporteData.indicadores.actividades.variacion,
        },
      },
    ];

    const kpiCount = kpis.length;
    const kpiWidth = (usableWidth - kpiGap * (kpiCount - 1)) / kpiCount;

    kpis.forEach((kpi, i) => {
      this.drawKpiCard({
        page,
        x: LAYOUT.margin + i * (kpiWidth + kpiGap),
        y: kpiTop - kpiHeight,
        width: kpiWidth,
        height: kpiHeight,
        icon: kpi.icon,
        titulo: kpi.titulo,
        valor: kpi.data.actual,
        variacion: kpi.data.variacion,
        font,
        boldFont,
      });
    });

    // -----------------------------------------------
    // GRID DE 2 COLUMNAS PARA EL CUERPO
    // -----------------------------------------------
    const bodyTop = kpiTop - kpiHeight - 24;
    const colWidth = (usableWidth - LAYOUT.colGap) / 2;
    const leftX = LAYOUT.margin;
    const rightX = LAYOUT.margin + colWidth + LAYOUT.colGap;

    let leftY = bodyTop;
    let rightY = bodyTop;

    // ---- IZQUIERDA: Clientes con mayor actividad ----
    this.drawSectionTitle({
      page,
      x: leftX,
      y: leftY,
      width: colWidth,
      title: 'Clientes con mayor actividad',
      boldFont,
    });
    leftY -= 22;

    const maxClienteTotal = Math.max(
      ...reporteData.clientes_mas_activos.map((c) => c.total),
      1,
    );
    const clientesRows = reporteData.clientes_mas_activos.map((c) => ({
      Cliente: c.cliente,
      Cal: c.calibraciones,
      Mue: c.muestras,
      Jor: c.jornadas,
      Notas: c.notas,
      Total: c.total,
    }));

    leftY = this.drawTable({
      page,
      x: leftX,
      y: leftY,
      width: colWidth,
      headers: ['Cliente', 'Cal.', 'Mue.', 'Jor.', 'Notas', 'Total'],
      rows: clientesRows,
      columnWidths: [colWidth - 220, 38, 38, 38, 38, 68],
      font,
      boldFont,
      withBar: true,
      barMax: maxClienteTotal,
    });

    // ---- DERECHA: Actividad por ingeniero ----
    this.drawSectionTitle({
      page,
      x: rightX,
      y: rightY,
      width: colWidth,
      title: 'Actividad por ingeniero',
      boldFont,
    });
    rightY -= 22;

    const maxIngenieroActual = Math.max(
      ...reporteData.ingenieros_mas_activos.map((i) => i.actual),
      1,
    );

    const ingenierosRows = reporteData.ingenieros_mas_activos.map((ing) => ({
      Ingeniero: ing.ingeniero,
      Cal: ing.calibraciones,
      Mue: ing.muestras,
      Jor: ing.jornadas,
      Notas: ing.notas,
      Total: ing.actual,
    }));

    rightY = this.drawTable({
      page,
      x: rightX,
      y: rightY,
      width: colWidth,
      headers: ['Ingeniero', 'Cal.', 'Mue.', 'Jor.', 'Notas', 'Total'],
      rows: ingenierosRows,
      columnWidths: [colWidth - 220, 38, 38, 38, 38, 68],
      font,
      boldFont,
      withBar: true,
      barMax: maxIngenieroActual,
    });

    // -----------------------------------------------
    // SEGUNDA FILA: Donut (izq) + Clientes inactivos (der)
    // -----------------------------------------------
    leftY -= 28;
    rightY -= 28;
    const rowStartY = Math.min(leftY, rightY);
    leftY = rowStartY;
    rightY = rowStartY;

    // ---- IZQUIERDA: Distribución de actividades por tipo (donut + leyenda) ----
    this.drawSectionTitle({
      page,
      x: leftX,
      y: leftY,
      width: colWidth,
      title: 'Distribución de actividades por tipo',
      boldFont,
    });
    leftY -= 22;

    const donutData = reporteData.actividad_por_tipo.map((item) => ({
      label: item.tipo,
      value: item.actual,
    }));
    const donutTotal = donutData.reduce((s, d) => s + d.value, 0);
    const donutR = 48;
    const donutCx = leftX + donutR + 10;
    const donutCy = leftY - donutR - 4;

    this.drawDonutChart({
      page,
      cx: donutCx,
      cy: donutCy,
      outerR: donutR,
      innerR: donutR * 0.6,
      data: donutData,
      colors: COLOR.donut,
    });

    this.drawDonutLegend({
      page,
      x: donutCx + donutR + 24,
      y: leftY - 14,
      data: donutData,
      colors: COLOR.donut,
      font,
      boldFont,
      total: donutTotal,
    });

    const donutBottom = donutCy - donutR - 12;

    // ---- DERECHA: Clientes sin actividad (siempre los 5 más inactivos) ----
    this.drawSectionTitle({
      page,
      x: rightX,
      y: rightY,
      width: colWidth,
      title: 'Clientes "A" sin actividad',
      boldFont,
    });
    rightY -= 22;

    const inactivosOrdenados = [...reporteData.clientes_inactivos]
      .sort((a, b) => b.dias_inactivo - a.dias_inactivo)
      .slice(0, 5);

    const maxDiasInactivo = Math.max(
      ...inactivosOrdenados.map((c) => c.dias_inactivo),
      1,
    );
    const inactivosRows = inactivosOrdenados.map((c) => ({
      Cliente: c.cliente,
      'Días sin actividad': c.dias_inactivo,
    }));

    rightY = this.drawTable({
      page,
      x: rightX,
      y: rightY,
      width: colWidth,
      headers: ['Cliente', 'Días sin actividad'],
      rows: inactivosRows,
      columnWidths: [colWidth - 130, 130],
      font,
      boldFont,
      withBar: true,
      barMax: maxDiasInactivo,
    });

    page.drawText(
      'Se muestran los 5 clientes con más días sin actividad registrada.',
      {
        x: rightX,
        y: rightY - 8,
        size: 7,
        font,
        color: COLOR.textMuted,
      },
    );

    // -----------------------------------------------
    // RESUMEN EJECUTIVO (footer del cuerpo)
    // -----------------------------------------------
    const resumenY = Math.min(donutBottom, rightY - 24) - 10;
    this.drawSectionTitle({
      page,
      x: leftX,
      y: resumenY,
      width: usableWidth,
      title: 'Resumen ejecutivo',
      boldFont,
    });

    const r = reporteData.resumen_ejecutivo;
    const bullets = [
      `Durante el período se registraron ${reporteData.indicadores.actividades.actual} actividades en ${reporteData.indicadores.clientes_activos.actual} clientes, con foco en ${r.actividad_predominante.toLowerCase()} (${r.cantidad_actividad_predominante} registros).`,
      `Cliente con mayor actividad: ${r.cliente_top} (${r.cliente_top_total} actividades). Ingeniero más activo: ${r.ingeniero_top} (${r.ingeniero_top_total} actividades).`,
      `Clientes sin actividad detectados: ${r.total_clientes_inactivos}.`,
    ];

    let bulletY = resumenY - 22;
    bullets.forEach((line) => {
      page.drawText(`•  ${line}`, {
        x: leftX + 6,
        y: bulletY,
        size: 8.5,
        font,
        color: COLOR.text,
        maxWidth: usableWidth - 12,
        lineHeight: 11,
      });
      bulletY -= 22;
    });

    this.drawFooter({ page, width });

    const pdfBytes = await pdfDoc.save();

    return {
      pdfBytes,
      filename: `resumen_crm_${periodoFilename}.pdf`,
    };
  }
}

export default PdfResumenCrmService;
