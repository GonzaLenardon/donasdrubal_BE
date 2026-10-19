import { ProductRanking, Products, ProductPresentations, ProductLots } from '../models/index.js';

export const allRankings = async (req, res) => {
  try {
    const rankings = await ProductRanking.findAll({
      include: [
        { model: Products, as: 'producto' },
        { model: ProductPresentations, as: 'presentacion' },
      ],
      order: [['ranking', 'DESC'], ['product_id', 'ASC']],
    });
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFullRankings = async (req, res) => {
  try {
    const { Op } = await import('sequelize');

    const products = await Products.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']],
    });

    const rankings = await ProductRanking.findAll();
    const rankingsMap = {};
    for (const r of rankings) {
      const key = `${r.product_id}_${r.product_presentation_id}`;
      rankingsMap[key] = r;
    }

    const lots = await ProductLots.findAll({
      include: [
        { model: Products, as: 'producto' },
        { model: ProductPresentations, as: 'presentacion' },
      ],
    });

    const productPresentationMap = {};
    for (const lot of lots) {
      const key = `${lot.product_id}_${lot.product_presentation_id}`;
      if (!productPresentationMap[key]) {
        productPresentationMap[key] = {
          product_id: lot.product_id,
          product_nombre: lot.producto?.nombre || '',
          product_codigo: lot.producto?.codigo || '',
          product_imagen: lot.producto?.imagen || null,
          presentation_id: lot.product_presentation_id,
          presentation_nombre: lot.presentacion?.nombre || 'Sin presentación',
          cantidad_base: lot.presentacion?.cantidad_base ? parseFloat(lot.presentacion.cantidad_base) : 1,
        };
      }
    }

    const resultado = Object.values(productPresentationMap).map((item) => {
      const key = `${item.product_id}_${item.presentation_id}`;
      const rankingRecord = rankingsMap[key];
      return {
        ...item,
        ranking: rankingRecord ? rankingRecord.ranking : 0,
        ranking_id: rankingRecord ? rankingRecord.id : null,
      };
    });

    for (const product of products) {
      const hasAny = resultado.some((r) => r.product_id === product.id);
      if (!hasAny) {
        resultado.push({
          product_id: product.id,
          product_nombre: product.nombre,
          product_codigo: product.codigo,
          product_imagen: product.imagen || null,
          presentation_id: null,
          presentation_nombre: 'Sin presentación',
          cantidad_base: 1,
          ranking: 0,
          ranking_id: null,
        });
      }
    }

    resultado.sort((a, b) => {
      if (a.product_nombre !== b.product_nombre) {
        return a.product_nombre.localeCompare(b.product_nombre);
      }
      if (a.presentation_id === null) return 1;
      if (b.presentation_id === null) return -1;
      return a.presentation_nombre.localeCompare(b.presentation_nombre);
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addRanking = async (req, res) => {
  try {
    const { product_id, product_presentation_id, ranking } = req.body;

    if (ranking < 0 || ranking > 5) {
      return res.status(400).json({ message: 'El ranking debe ser entre 0 y 5' });
    }

    const existing = await ProductRanking.findOne({
      where: { product_id, product_presentation_id },
    });

    if (existing) {
      existing.ranking = ranking;
      await existing.save();
      return res.json(existing);
    }

    const newRanking = await ProductRanking.create({
      product_id,
      product_presentation_id,
      ranking,
    });
    res.status(201).json(newRanking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateRanking = async (req, res) => {
  try {
    const { ranking } = req.body;

    if (ranking < 0 || ranking > 5) {
      return res.status(400).json({ message: 'El ranking debe ser entre 0 y 5' });
    }

    const rankingRecord = await ProductRanking.findByPk(req.params.id);
    if (!rankingRecord) {
      return res.status(404).json({ message: 'Ranking no encontrado' });
    }

    rankingRecord.ranking = ranking;
    await rankingRecord.save();
    res.json(rankingRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteRanking = async (req, res) => {
  try {
    const ranking = await ProductRanking.findByPk(req.params.id);
    if (!ranking) {
      return res.status(404).json({ message: 'Ranking no encontrado' });
    }

    await ranking.destroy();
    res.json({ message: 'Ranking eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRankingByProduct = async (req, res) => {
  try {
    const rankings = await ProductRanking.findAll({
      where: { product_id: req.params.productId },
      include: [
        { model: Products, as: 'producto' },
        { model: ProductPresentations, as: 'presentacion' },
      ],
    });
    res.json(rankings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
