// services/pdf/helpers.js

export function drawTextBlock({
  page,
  text,
  x,
  y,
  size,
  font,
  color,
  maxWidth,
  lineHeight
}) {
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + word + ' ';
    const width = font.widthOfTextAtSize(testLine, size);

    if (width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  }

  lines.push(currentLine);

  lines.forEach((line, index) => {
    page.drawText(line.trim(), {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color
    });
  });

  return lines.length * lineHeight;
}
