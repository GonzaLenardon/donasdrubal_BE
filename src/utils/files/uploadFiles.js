export const uploadArchivo = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    if (!req.file) {
      return res.status(400).json({
        message: 'No se recibió ningún archivo',
      });
    }

    res.status(200).json({
      message: 'Archivo subido correctamente',
      file: {
        originalName: req.file.originalname,
        storedName: req.file.filename,
        size: req.file.size,
        campo: req.body.campo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al subir el archivo',
    });
  }
};