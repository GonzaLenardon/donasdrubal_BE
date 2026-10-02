import path from 'path';
import fs from 'fs';
import { Products } from '../models/index.js';

export const allProducts = async (req, res) => {
  try {
    const products = await Products.findAll({
      where: { activo: true },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProduct = async (req, res) => {
  try {
    const product = await Products.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    await Products.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await Products.update({ activo: false }, { where: { id: req.params.id } });
    res.json({ message: 'Producto desactivado' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const product = await Products.findByPk(req.params.id);
    if (!product) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.imagen) {
      const oldPath = path.join(process.cwd(), product.imagen);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    product.imagen = `/uploads/productos/${req.file.filename}`;
    await product.save();

    res.json(product);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    if (product.imagen) {
      const oldPath = path.join(process.cwd(), product.imagen);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      product.imagen = null;
      await product.save();
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
