import path from 'path';

/**
 * Genera un nombre de archivo seguro y consistente
 * @param {Object} file - archivo de multer
 * @param {string} campo - nombre del campo (ej: 'temperatura')
 * @returns {string}
 */
export const buildFileName = (file, campo) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // timestamp para evitar colisiones
  const timestamp = Date.now();

  // limpiar nombre del campo
  const safeCampo = sanitize(campo);

  return `${safeCampo}_${timestamp}${ext}`;
};

/**
 * Limpia strings para uso en nombres de archivo
 */
const sanitize = (text) => {
  return text
    .toString()
    .normalize('NFD')                 // separa acentos
    .replace(/[\u0300-\u036f]/g, '')  // elimina acentos
    .replace(/[^a-zA-Z0-9]/g, '_')    // reemplaza caracteres raros
    .replace(/_+/g, '_')              // evita múltiples _
    .toLowerCase()
    .trim();
};