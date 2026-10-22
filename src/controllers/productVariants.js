import { ProductVariants, Products, ProductPresentations, Rubros, Subrubros, ProductLots, StockMovements } from '../models/index.js';

export const allVariants = async (req, res) => {
  try {
    const variants = await ProductVariants.findAll({
      include: [
        { model: Products, as: 'producto', include: [
          { model: Rubros, as: 'rubro' },
          { model: Subrubros, as: 'subrubro' },
        ]},
        { model: ProductPresentations, as: 'presentacion' },
      ],
      order: [[{ model: Products, as: 'producto' }, 'nombre', 'ASC']],
    });
    res.json(variants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFullVariants = async (req, res) => {
  try {
    const variants = await ProductVariants.findAll({
      include: [
        { model: Products, as: 'producto', include: [
          { model: Rubros, as: 'rubro' },
          { model: Subrubros, as: 'subrubro' },
        ]},
        { model: ProductPresentations, as: 'presentacion' },
      ],
      order: [
        ['ranking', 'DESC'],
        [{ model: Products, as: 'producto' }, 'nombre', 'ASC'],
      ],
    });
    res.json(variants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addVariant = async (req, res) => {
  try {
    const { product_id, presentation_id, codigo } = req.body;

    // Validar que el producto exista y esté activo
    const product = await Products.findByPk(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    if (!product.activo) {
      return res.status(400).json({ message: 'No se puede agregar una variante a un producto inactivo' });
    }

    // Validar unicidad de (product_id, presentation_id)
    const existingCombo = await ProductVariants.findOne({
      where: { product_id, presentation_id },
      paranoid: false,
    });
    if (existingCombo) {
      return res.status(409).json({ message: 'Este producto ya tiene esa presentación' });
    }

    // Validar unicidad de código
    const existingCodigo = await ProductVariants.findOne({
      where: { codigo },
      paranoid: false,
    });
    if (existingCodigo) {
      return res.status(409).json({ message: 'Ya existe una variante con ese código' });
    }

    const variant = await ProductVariants.create(req.body);
    res.status(201).json(variant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateVariant = async (req, res) => {
  try {
    const variant = await ProductVariants.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variante no encontrada' });

    // Si cambia la presentación, validar que no tenga lotes ni movimientos
    if (req.body.presentation_id && req.body.presentation_id !== variant.presentation_id) {
      const hasLots = await ProductLots.findOne({
        where: { product_variant_id: variant.id },
      });
      if (hasLots) {
        return res.status(400).json({ message: 'No se puede cambiar la presentación de una variante con lotes asociados' });
      }

      // Validar unicidad de (product_id, presentation_id)
      const existingCombo = await ProductVariants.findOne({
        where: {
          product_id: variant.product_id,
          presentation_id: req.body.presentation_id,
        },
        paranoid: false,
      });
      if (existingCombo) {
        return res.status(409).json({ message: 'Este producto ya tiene esa presentación' });
      }
    }

    // Validar unicidad de código si cambió
    if (req.body.codigo && req.body.codigo !== variant.codigo) {
      const existingCodigo = await ProductVariants.findOne({
        where: { codigo: req.body.codigo },
        paranoid: false,
      });
      if (existingCodigo) {
        return res.status(409).json({ message: 'Ya existe una variante con ese código' });
      }
    }

    await variant.update(req.body);
    res.json(variant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteVariant = async (req, res) => {
  try {
    const variant = await ProductVariants.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variante no encontrada' });

    // Verificar si tiene lotes
    const hasLots = await ProductLots.findOne({
      where: { product_variant_id: variant.id },
    });
    if (hasLots) {
      return res.status(400).json({ message: 'No se puede eliminar una variante con lotes asociados' });
    }

    // Soft delete
    await variant.destroy();
    res.json({ message: 'Variante eliminada' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const setRanking = async (req, res) => {
  try {
    const { ranking } = req.body;
    if (ranking < 0 || ranking > 5) {
      return res.status(400).json({ message: 'El ranking debe ser entre 0 y 5' });
    }
    const variant = await ProductVariants.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variante no encontrada' });
    variant.ranking = ranking;
    await variant.save();
    res.json(variant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const toggleActivo = async (req, res) => {
  try {
    const variant = await ProductVariants.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variante no encontrada' });
    variant.activo = !variant.activo;
    await variant.save();
    res.json(variant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};