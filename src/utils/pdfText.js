// ===================================
  // DEVUELVE ARRAY CON LÍNEAS DE TEXTO 
  // AJUSTADAS AL ANCHO MÁXIMO 
  // ===================================
  
  export const wrapText = (text, font, fontSize, maxWidth) => {

    if (!text) return [];

    const words = String(text).split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {

      const testLine = currentLine
        ? currentLine + ' ' + word
        : word;

      const width = font.widthOfTextAtSize(testLine, fontSize);

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);

    return lines;
  }

  export const truncate = (text, max = 20) => {
    if (!text) return '';
    text = String(text);
    return text.length > max ? text.substring(0, max) + '...' : text;
  }

export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';
  return Number(value).toFixed(decimals);
};  