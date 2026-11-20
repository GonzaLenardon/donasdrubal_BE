import { Op, fn, col } from 'sequelize';
import { Facturas, RemitoFacturas, RemitoItems } from '../models/index.js';

// ============================================================================
// FACTURACIÓN — lógica de cálculo compartida entre el controller de facturas
// y el controller de remitos (estado de facturación de cada remito).
// ============================================================================

/**
 * Estado de facturación DERIVADO de un remito (no es una columna nueva):
 *  - NO_FACTURADO: no tiene ninguna cantidad facturada
 *  - PARCIAL:      facturó parte del total (ej. 100 L de 300 L)
 *  - FACTURADO:    cubrió el total remitido
 */
export const calcularEstadoFacturacion = (total, facturado) => {
  const totalNum = parseFloat(total) || 0;
  const facturadoNum = parseFloat(facturado) || 0;
  if (facturadoNum <= 0) return 'NO_FACTURADO';
  if (facturadoNum >= totalNum) return 'FACTURADO';
  return 'PARCIAL';
};

/**
 * Suma de cantidades facturadas por remito, considerando solo facturas
 * no anuladas. Devuelve { [remito_id]: total }.
 * Acepta `transaction` para usar dentro de transacciones con lock.
 */
export const sumarFacturadoPorRemito = async (remitoIds, { transaction } = {}) => {
  const resultado = {};
  if (!Array.isArray(remitoIds) || remitoIds.length === 0) return resultado;

  const filas = await RemitoFacturas.findAll({
    attributes: ['remito_id', [fn('SUM', col('cantidad_facturada')), 'total']],
    include: [
      {
        model: Facturas,
        as: 'factura',
        attributes: [],
        where: { estado: { [Op.ne]: 'ANULADA' } },
        required: true,
      },
    ],
    where: { remito_id: { [Op.in]: remitoIds } },
    group: ['remito_id'],
    raw: true,
    transaction,
  });

  for (const fila of filas) {
    resultado[fila.remito_id] = parseFloat(fila.total) || 0;
  }
  return resultado;
};

/**
 * Total remitido por remito (suma de quantity_dispatched de sus ítems,
 * en unidades base / litros). Devuelve { [remito_id]: total }.
 */
export const sumarTotalRemitos = async (remitoIds, { transaction } = {}) => {
  const resultado = {};
  if (!Array.isArray(remitoIds) || remitoIds.length === 0) return resultado;

  const filas = await RemitoItems.findAll({
    attributes: ['remito_id', [fn('SUM', col('quantity_dispatched')), 'total']],
    where: { remito_id: { [Op.in]: remitoIds } },
    group: ['remito_id'],
    raw: true,
    transaction,
  });

  for (const fila of filas) {
    resultado[fila.remito_id] = parseFloat(fila.total) || 0;
  }
  return resultado;
};

/**
 * Calcula total, facturado, saldo y estado de facturación para una lista
 * de remitos, en una sola pasada. Devuelve { [remito_id]: { total, facturado, saldo, estado } }.
 */
export const calcularSaldosFacturacion = async (remitoIds, { transaction } = {}) => {
  const ids = Array.isArray(remitoIds) ? [...new Set(remitoIds)] : [];
  const [totales, facturados] = await Promise.all([
    sumarTotalRemitos(ids, { transaction }),
    sumarFacturadoPorRemito(ids, { transaction }),
  ]);

  const saldos = {};
  for (const id of ids) {
    const total = totales[id] || 0;
    const facturado = facturados[id] || 0;
    saldos[id] = {
      total,
      facturado,
      saldo: Math.max(total - facturado, 0),
      estado: calcularEstadoFacturacion(total, facturado),
    };
  }
  return saldos;
};
