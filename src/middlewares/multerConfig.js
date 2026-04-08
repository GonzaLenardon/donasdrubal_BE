import multer from 'multer';
import path from 'path';
import { buildUploadPath } from '../utils/files/storageBuilder.js';
import { buildFileName } from '../utils/files/fileNaming.js';

const createUploader = (configBuilder) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const config = configBuilder(req);

        const {
          clienteId,
          tipo,
          entidadId,
          subTipo,
          recursoId,
        } = config;

        if (!clienteId || !tipo || !entidadId || !subTipo || !recursoId) {
          throw new Error('Faltan parámetros para construir el path');
        }

        const uploadPath = buildUploadPath({
          clienteId,
          tipo,
          entidadId,
          subTipo,
          recursoId,
        });

        cb(null, uploadPath);
      } catch (err) {
        cb(err);
      }
    },

    filename: (req, file, cb) => {
      try {
        // const fileName = buildFileName(file, file.fieldname);
        // const ext = path.extname(file.originalname);
        const fileName = req.body?.nombreArchivo;
        cb(null, fileName);

      } catch (err) {
        cb(err);
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
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter,
  });
}

export default createUploader;