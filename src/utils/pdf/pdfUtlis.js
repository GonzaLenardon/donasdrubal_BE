import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fsPromises from 'fs/promises';
// ===================================
  // DEVUELVE ARRAY CON LÍNEAS DE TEXTO 
  // AJUSTADAS AL ANCHO MÁXIMO 
  // ===================================
  
  export const wrapText = (text, font, fontSize, maxWidth) => {

    if (!text) return [];

    // text = String(text)
    // .replace(/\r/g, ' ')
    // .replace(/\n/g, ' ')
    // .replace(/\t/g, ' ')
    // .trim();

    text = sanitizeText(text);
    // const words = String(text).split(' ');
    const words = text.split(/\s+/);
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

export const sanitizeText = (text) => {

  if (!text) return '';

  return String(text)
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(//g, '-')     // bullet Word
    .replace(/•/g, '-')     // bullet unicode
    .replace(/[^\x00-\xFF]/g, '') // elimina unicode fuera WinAnsi
    .trim();
};

export const unirPDFs = async (pdfPrincipalBytes, rutaPdfsPromisesecundario) => {

  // Cargar PDF principal (el que generás)
  const pdfPrincipal = await PDFDocument.load(pdfPrincipalBytes);

  // Leer PDF secundario desde disco
  const pdfsPromisesecundarioBytes = await fsPromises.readFile(rutaPdfsPromisesecundario);
  const pdfsPromisesecundario = await PDFDocument.load(pdfsPromisesecundarioBytes);

  // Copiar páginas del secundario
  const paginas = await pdfPrincipal.copyPages(
    pdfsPromisesecundario,
    pdfsPromisesecundario.getPageIndices()
  );

  // Agregarlas al final del principal
  paginas.forEach(p => pdfPrincipal.addPage(p));

  // Devolver PDF final
  return await pdfPrincipal.save();
}  

// -------------- UNE VARIOS PDfsPromises --------------
//-----CASO DE USO
// pdfBytes = await this.unirMultiplesPDfsPromises(pdfBytes, [
//   'public/pdfsPromises/manual.pdf',
//   'public/pdfsPromises/anexo.pdf'
// ]);

export const unirMultiplesPDFs = async (pdfBaseBytes, rutas = []) => {

  const pdfFinal = await PDFDocument.load(pdfBaseBytes);

  for (const ruta of rutas) {

    try {
      const bytes = await fsPromises.readFile(ruta);
      const doc = await PDFDocument.load(bytes);

      const paginas = await pdfFinal.copyPages(doc, doc.getPageIndices());
      paginas.forEach(p => pdfFinal.addPage(p));

    } catch (err) {
      console.error('Error uniendo:', ruta, err.message);
    }
  }

  return await pdfFinal.save();
}