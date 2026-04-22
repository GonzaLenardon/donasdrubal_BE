import fs from 'fs/promises';
import path from 'path';

export const embedImage = async (pdfDoc, imagesUrl, nombreArchivo) => {

  if (!nombreArchivo) return null;

  try {
    const ruta = path.join(imagesUrl, nombreArchivo);

    const imageBytes = await fs.readFile(ruta);
    const extension = path.extname(nombreArchivo).toLowerCase();

    if (extension === '.png') {
      return await pdfDoc.embedPng(imageBytes);
    }

    return await pdfDoc.embedJpg(imageBytes);

  } catch (err) {
    console.log('No se pudo cargar imagen:', nombreArchivo);
    return null;
  }
}


export const getImageDimensions = async (pdfDoc, url, nombreArchivo, maxWidth = 200, maxHeight = 150) => {

  if (!nombreArchivo) return null;

  const image = await embedImage(pdfDoc, url, nombreArchivo);
  if (!image) return null;

  const originalWidth = image.width;
  const originalHeight = image.height;

  let scale = 1;

  // limitar por ancho
  if (originalWidth > maxWidth) {
    scale = maxWidth / originalWidth;
  }

  // limitar por alto
  if (originalHeight * scale > maxHeight) {
    scale = maxHeight / originalHeight;
  }

  return {
    image,
    width: originalWidth * scale,
    height: originalHeight * scale
  };
}


