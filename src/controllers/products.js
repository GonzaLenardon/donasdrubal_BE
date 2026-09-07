import { Products, ProductPresentations } from '../models/index.js';

export const allProducts = async (req, res) => {
  try {
    const products = await Products.findAll({
      where: { activo: true },
      include: [
        {
          model: ProductPresentations,
          as: 'presentacion',
          include: [{ model: ProductPresentations, as: 'unidadBase' }],
        },
      ],
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
