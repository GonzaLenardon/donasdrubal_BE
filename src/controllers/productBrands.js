import { ProductBrands } from '../models/index.js';

export const allProductBrands = async (req, res) => {
  try {
    const brands = await ProductBrands.findAll({
      order: [['nombre', 'ASC']],
    });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProductBrand = async (req, res) => {
  try {
    const nombre = req.body.nombre?.trim();
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre de la marca es requerido' });
    }

    const brand = await ProductBrands.create({
      nombre,
      activo: req.body.activo ?? true,
    });
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProductBrand = async (req, res) => {
  try {
    const brand = await ProductBrands.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }

    const updates = { ...req.body };
    if (updates.nombre !== undefined) {
      updates.nombre = updates.nombre.trim();
      if (!updates.nombre) {
        return res.status(400).json({ message: 'El nombre de la marca es requerido' });
      }
    }

    await brand.update(updates);
    res.json(brand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProductBrand = async (req, res) => {
  try {
    const brand = await ProductBrands.findByPk(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Marca no encontrada' });
    }

    await brand.update({ activo: false });
    res.json({ message: 'Marca desactivada' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
