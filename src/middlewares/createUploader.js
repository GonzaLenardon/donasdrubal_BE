import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Crea un uploader dinámico para una subcarpeta dentro de /uploads
 * @param {string} subFolder - Nombre de la carpeta (ej: 'calibraciones', 'pozos')
 */
const createUploader = (subFolder) => {
  const uploadRoot = path.join(process.cwd(), 'uploads');
  const uploadDir = path.join(uploadRoot, subFolder);

  // Crear carpeta si no existe
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const nombreArchivo = req.body?.nombreArchivo;

      if (nombreArchivo) {
        // Si viene nombre personalizado
        cb(null, nombreArchivo);
      } else {
        // Generar nombre único automático
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const baseName = path
          .basename(file.originalname, ext)
          .replace(/\s+/g, '_');

        cb(null, `${baseName}_${timestamp}${ext}`);
      }
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });
};

export default createUploader;
