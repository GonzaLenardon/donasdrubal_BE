import { RemitoArchivos, Remitos, Users } from '../models/index.js';
import path from 'path';
import fs from 'fs';

export const getArchivosByRemito = async (req, res) => {
  try {
    const archivos = await RemitoArchivos.findAll({
      where: { remito_id: req.params.remitoId },
      include: [{ model: Users, as: 'subidoPor', attributes: ['id', 'nombre', 'email'] }],
      order: [['uploaded_at', 'DESC']],
    });
    res.json(archivos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addArchivo = async (req, res) => {
  try {
    const remito = await Remitos.findByPk(req.params.remitoId);
    if (!remito) {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(404).json({ message: 'Remito no encontrado' });
    }

    if (remito.status === 'COMPLETADO' || remito.status === 'ANULADO') {
      if (req.files) req.files.forEach((f) => fs.unlinkSync(f.path));
      return res.status(400).json({ message: 'No se pueden agregar archivos a un remito en estado ' + remito.status });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const archivosCreados = [];
    for (const file of req.files) {
      const archivo = await RemitoArchivos.create({
        remito_id: remito.id,
        path: `/uploads/remitos/${file.filename}`,
        mime_type: file.mimetype,
        original_name: file.originalname,
        size: file.size,
        uploaded_by: req.body.uploaded_by || null,
        uploaded_at: new Date(),
      });
      archivosCreados.push(archivo);
    }

    // Cambiar a REVISION solo si es PENDIENTE
    if (remito.status === 'PENDIENTE') {
      remito.status = 'REVISION';
      remito.photo_path = `/uploads/remitos/${req.files[0].filename}`;
      remito.photo_uploaded_at = new Date();
      await remito.save();
    }

    res.status(201).json(archivosCreados);
  } catch (error) {
    if (req.files) req.files.forEach((f) => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
    res.status(400).json({ message: error.message });
  }
};

export const deleteArchivo = async (req, res) => {
  try {
    const archivo = await RemitoArchivos.findByPk(req.params.archivoId);
    if (!archivo) {
      return res.status(404).json({ message: 'Archivo no encontrado' });
    }

    const remito = await Remitos.findByPk(archivo.remito_id);
    if (!remito) {
      return res.status(404).json({ message: 'Remito no encontrado' });
    }

    if (remito.status === 'COMPLETADO' || remito.status === 'ANULADO') {
      return res.status(400).json({ message: 'No se pueden eliminar archivos de un remito en estado ' + remito.status });
    }

    // Soft delete
    await archivo.destroy();

    // Si era el último archivo, volver a PENDIENTE
    const remainingFiles = await RemitoArchivos.count({
      where: { remito_id: remito.id },
    });

    if (remainingFiles === 0 && remito.status === 'REVISION') {
      remito.status = 'PENDIENTE';
      remito.photo_path = null;
      remito.photo_uploaded_at = null;
      await remito.save();
    }

    res.json({ message: 'Archivo eliminado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};