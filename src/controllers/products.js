import path from 'path';
import fs from 'fs';
import { Products, Rubros, Subrubros, ProductVariants, ProductPresentations } from '../models/index.js';
import db from '../config/database.js';

export const allProducts = async (req, res) => {
  try {
    const products = await Products.findAll({
      where: { activo: true },
      include: [
        { model: Rubros, as: 'rubro' },
        { model: Subrubros, as: 'subrubro' },
      ],
      order: [['nombre', 'ASC']],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProduct = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { codigo, subrubro_id, rubro_id, presentation_id, codigo_variante } = req.body;

    // Validar código único (incluyendo dados de baja)
    const existingCodigo = await Products.findOne({
      where: { codigo },
      paranoid: false,
    });
    if (existingCodigo) {
      await transaction.rollback();
      return res.status(409).json({ message: 'Ya existe un producto con ese código' });
    }

    // Validar que el subrubro pertenezca al rubro
    const subrubro = await Subrubros.findByPk(subrubro_id);
    if (!subrubro) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Subrubro no encontrado' });
    }
    if (subrubro.rubro_id !== parseInt(rubro_id)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El subrubro no pertenece al rubro seleccionado' });
    }

    // Validar presentation_id
    if (!presentation_id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Seleccione una presentación' });
    }

    // Validar codigo_variante
    if (!codigo_variante?.trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Ingrese el código de la variante' });
    }

    // Validar unicidad de código de variante
    const existingVarCodigo = await ProductVariants.findOne({
      where: { codigo: codigo_variante.trim() },
      paranoid: false,
    });
    if (existingVarCodigo) {
      await transaction.rollback();
      return res.status(409).json({ message: 'Ya existe una variante con ese código' });
    }

    // Crear producto
    const product = await Products.create({
      nombre: req.body.nombre,
      codigo,
      activo: req.body.activo ?? true,
      imagen: req.body.imagen,
      rubro_id: parseInt(rubro_id),
      subrubro_id: parseInt(subrubro_id),
    }, { transaction });

    // Crear variante
    const variant = await ProductVariants.create({
      product_id: product.id,
      presentation_id: parseInt(presentation_id),
      codigo: codigo_variante.trim(),
      activo: true,
      ranking: 0,
    }, { transaction });

    await transaction.commit();

    // Recargar con includes para devolver completo
    const productFull = await Products.findByPk(product.id, {
      include: [
        { model: Rubros, as: 'rubro' },
        { model: Subrubros, as: 'subrubro' },
        {
          model: ProductVariants,
          as: 'variantes',
          include: [{ model: ProductPresentations, as: 'presentacion' }],
        },
      ],
    });

    res.status(201).json(productFull);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const { codigo, subrubro_id, rubro_id } = req.body;

    // Validar código único si cambió
    if (codigo && codigo !== product.codigo) {
      const existingCodigo = await Products.findOne({
        where: { codigo },
        paranoid: false,
      });
      if (existingCodigo) {
        return res.status(409).json({ message: 'Ya existe un producto con ese código' });
      }
    }

    // Validar subrubro si cambió
    if (subrubro_id) {
      const subrubro = await Subrubros.findByPk(subrubro_id);
      if (!subrubro) {
        return res.status(400).json({ message: 'Subrubro no encontrado' });
      }
      const rubroId = rubro_id || product.rubro_id;
      if (subrubro.rubro_id !== parseInt(rubroId)) {
        return res.status(400).json({ message: 'El subrubro no pertenece al rubro seleccionado' });
      }
    }

    await product.update(req.body);
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Products.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Desactivar producto y todas sus variantes
    await ProductVariants.update(
      { activo: false },
      { where: { product_id: product.id } }
    );
    await product.update({ activo: false });

    res.json({ message: 'Producto y variantes desactivados' });
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