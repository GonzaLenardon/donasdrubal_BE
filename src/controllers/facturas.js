import { Op } from 'sequelize';
import {
  Facturas,
  RemitoFacturas,
  Remitos,
  RemitoItems,
  ProductVariants,
  Products,
  ProductPresentations,
  Clientes,
  Users,
  ClienteIngenieros,
} from '../models/index.js';
import { ROLES } from '../config/constants/roles.js';
import db from '../config/database.js';
import { calcularSaldosFacturacion } from '../services/facturacionService.js';

// ============================================================================
// FACTURACIÓN — en esta etapa las facturas son "simuladas": sirven para marcar
// remitos como facturados (total o parcialmente) y para registrar anticipos
// sin remitos. La etapa futura de facturación real agrega columnas de
// comprobante a la misma tabla sin tocar remito_facturas.
// ============================================================================

const TIPOS_VALIDOS = ['FACTURA', 'ANTICIPO'];
const ESTADOS_NO_ANULADOS = { [Op.ne]: 'ANULADA' };

const fallo = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const esAdmin = (req) => req.user?.rol === ROLES.ADMIN;

/** Clientes vinculados al usuario (mismo scoping que allRemitos). */
const clientesDelUsuario = async (userId) => {
  const vinculos = await ClienteIngenieros.findAll({
    where: { user_id: userId },
    attributes: ['cliente_id'],
  });
  return vinculos.map((v) => v.cliente_id);
};

const incluirClienteYRemitos = [
  { model: Clientes, as: 'cliente', attributes: ['id', 'razon_social', 'cuil_cuit'] },
  { model: Users, as: 'creadoPor', attributes: ['id', 'nombre', 'email'] },
  {
    model: RemitoFacturas,
    as: 'remitos',
    include: [
      {
        model: Remitos,
        as: 'remito',
        attributes: [
          'id',
          'remito_number',
          'status',
          'issued_at',
          'createdAt',
          'origin_warehouse_id',
          'destination_client_id',
          'destination_warehouse_id',
        ],
      },
    ],
  },
];

// ----------------------------------------------------------------------------
// GET /stock/facturas
// ----------------------------------------------------------------------------
export const allFacturas = async (req, res) => {
  try {
    const where = {};

    if (!esAdmin(req)) {
      const clientes = await clientesDelUsuario(req.user.id);
      where.cliente_id = { [Op.in]: clientes };
    }

    const facturas = await Facturas.findAll({
      where,
      include: incluirClienteYRemitos,
      order: [['createdAt', 'DESC']],
    });

    res.json(facturas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------------------------------
// GET /stock/facturas/:id
// ----------------------------------------------------------------------------
export const getFacturaById = async (req, res) => {
  try {
    const factura = await Facturas.findByPk(req.params.id, {
      include: incluirClienteYRemitos,
    });

    if (!factura) {
      return res.status(404).json({ message: 'Factura no encontrada' });
    }

    if (!esAdmin(req)) {
      const clientes = await clientesDelUsuario(req.user.id);
      if (!clientes.includes(factura.cliente_id)) {
        return res.status(403).json({ message: 'No tiene acceso a esta factura' });
      }
    }

    res.json(factura);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------------------------------
// Motivo por el que un remito no puede facturarse todavía.
// Sirve para explicar en la UI por qué un remito pendiente no es facturable.
// ----------------------------------------------------------------------------
const MOTIVO_BLOQUEO = {
  PENDIENTE: 'Falta subir el remito firmado',
  REVISION: 'Falta confirmar el remito',
  SIN_CANTIDADES: 'El remito no tiene cantidades para facturar',
  SIN_SALDO: 'Sin saldo pendiente (ya facturado)',
};

const motivoBloqueoFacturacion = (remito, saldo) => {
  if (remito.status === 'PENDIENTE') return MOTIVO_BLOQUEO.PENDIENTE;
  if (remito.status === 'REVISION') return MOTIVO_BLOQUEO.REVISION;
  if (saldo.total <= 0) return MOTIVO_BLOQUEO.SIN_CANTIDADES;
  if (saldo.saldo <= 0) return MOTIVO_BLOQUEO.SIN_SALDO;
  return null;
};

// ----------------------------------------------------------------------------
// GET /stock/facturas/remitos-disponibles?cliente_id=&incluir_no_facturables=
//   Remitos COMPLETADO a cliente con saldo pendiente de facturar.
//   Con incluir_no_facturables=1 devuelve también los remitos PENDIENTE y
//   REVISION (y los que ya no tienen saldo), para poder listar los pendientes
//   de facturación de un cliente aunque todavía no sean facturables.
//   (Debe declararse antes de /:id)
// ----------------------------------------------------------------------------
export const remitosDisponibles = async (req, res) => {
  try {
    const clienteId = Number(req.query.cliente_id);
    if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
      return res.status(400).json({ message: 'cliente_id inválido' });
    }

    if (!esAdmin(req)) {
      const clientes = await clientesDelUsuario(req.user.id);
      if (!clientes.includes(clienteId)) {
        return res.status(403).json({ message: 'No tiene acceso a este cliente' });
      }
    }

    const incluirNoFacturables = ['1', 'true'].includes(
      String(req.query.incluir_no_facturables ?? ''),
    );

    const remitos = await Remitos.findAll({
      where: {
        destination_client_id: clienteId,
        destination_warehouse_id: null,
        status: incluirNoFacturables
          ? { [Op.in]: ['PENDIENTE', 'REVISION', 'COMPLETADO'] }
          : 'COMPLETADO',
      },
      include: [
        {
          model: RemitoItems,
          as: 'items',
          attributes: ['id', 'product_variant_id', 'quantity_dispatched'],
          include: [
            {
              model: ProductVariants,
              as: 'variante',
              attributes: ['id', 'codigo'],
              include: [
                { model: Products, as: 'producto', attributes: ['id', 'nombre'] },
                {
                  model: ProductPresentations,
                  as: 'presentacion',
                  attributes: ['id', 'nombre'],
                  include: [{ model: ProductPresentations, as: 'unidadBase', attributes: ['id', 'nombre'] }],
                },
              ],
            },
          ],
        },
      ],
      order: [
        ['issued_at', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });

    const saldos = await calcularSaldosFacturacion(remitos.map((r) => r.id));

    const disponibles = remitos
      .map((remito) => {
        const saldo = saldos[remito.id] || {
          total: 0,
          facturado: 0,
          saldo: 0,
          estado: 'NO_FACTURADO',
        };
        const facturable =
          remito.status === 'COMPLETADO' && saldo.total > 0 && saldo.saldo > 0;
        return {
          ...remito.toJSON(),
          total_remitido: saldo.total,
          facturado: saldo.facturado,
          saldo: saldo.saldo,
          saldo_facturacion: saldo.saldo,
          estado_facturacion: saldo.estado,
          facturable,
          motivo_bloqueo: facturable ? null : motivoBloqueoFacturacion(remito, saldo),
        };
      })
      .filter((remito) => (incluirNoFacturables ? true : remito.facturable));

    res.json(disponibles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------------------------------
// POST /stock/facturas  (solo Administrador)
//   Body: { cliente_id, tipo, fecha, numero?, notas?, remitos: [{remito_id, cantidad_facturada}] }
// ----------------------------------------------------------------------------
export const addFactura = async (req, res) => {
  const transaction = await db.transaction();
  let confirmada = false;

  try {
    const { cliente_id, tipo, fecha, numero, notas, remitos } = req.body;

    // ---------- validaciones de cabecera ----------
    const clienteId = Number(cliente_id);
    if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
      throw fallo(400, 'cliente_id inválido');
    }

    const tipoFinal = (tipo || 'FACTURA').toUpperCase();
    if (!TIPOS_VALIDOS.includes(tipoFinal)) {
      throw fallo(400, `Tipo de comprobante inválido: ${tipo}`);
    }

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
      throw fallo(400, 'La fecha es obligatoria (formato YYYY-MM-DD)');
    }

    const numeroLimpio = numero != null && String(numero).trim() !== ''
      ? String(numero).trim()
      : null;
    if (numeroLimpio && numeroLimpio.length > 20) {
      throw fallo(400, 'El número de factura no puede superar los 20 caracteres');
    }

    const listaRemitos = Array.isArray(remitos) ? remitos : [];
    if (tipoFinal === 'FACTURA' && listaRemitos.length === 0) {
      throw fallo(400, 'Una factura debe incluir al menos un remito');
    }
    if (tipoFinal === 'ANTICIPO' && listaRemitos.length > 0) {
      throw fallo(400, 'Un anticipo no tiene remitos asociados');
    }

    const cliente = await Clientes.findByPk(clienteId, { transaction });
    if (!cliente) {
      throw fallo(404, 'Cliente no encontrado');
    }

    // ---------- unicidad del número de factura (entre no anuladas) ----------
    if (numeroLimpio) {
      const enUso = await Facturas.findOne({
        where: { company_id: 1, numero: numeroLimpio, estado: ESTADOS_NO_ANULADOS },
        transaction,
      });
      if (enUso) {
        throw fallo(409, `El número de factura ${numeroLimpio} ya está en uso`);
      }
    }

    // ---------- validación de remitos (con lock) ----------
    const ids = [];
    for (const item of listaRemitos) {
      const id = Number(item?.remito_id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        throw fallo(400, 'remito_id inválido en el detalle');
      }
      if (ids.includes(id)) {
        throw fallo(400, 'Hay un remito repetido en la factura');
      }
      ids.push(id);
    }

    const filasDetalle = [];

    if (ids.length > 0) {
      const remitosBD = await Remitos.findAll({
        where: { id: { [Op.in]: ids } },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });
      const porId = new Map(remitosBD.map((r) => [r.id, r]));
      const saldos = await calcularSaldosFacturacion(ids, { transaction });

      for (const item of listaRemitos) {
        const id = Number(item.remito_id);
        const remito = porId.get(id);

        if (!remito) {
          throw fallo(404, `Remito #${id} no encontrado`);
        }
        if (remito.status !== 'COMPLETADO') {
          throw fallo(400, `El remito ${remito.remito_number} debe estar completado para facturarlo (estado actual: ${remito.status})`);
        }
        if (remito.destination_warehouse_id) {
          throw fallo(400, `El remito ${remito.remito_number} es una transferencia interna y no se factura`);
        }
        if (Number(remito.destination_client_id) !== clienteId) {
          throw fallo(400, `El remito ${remito.remito_number} pertenece a otro cliente`);
        }

        const cantidad = parseFloat(item.cantidad_facturada);
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
          throw fallo(400, `Cantidad facturada inválida para el remito ${remito.remito_number}`);
        }

        const saldo = saldos[id]?.saldo ?? 0;
        if (cantidad > saldo + 0.0001) {
          throw fallo(
            400,
            `El remito ${remito.remito_number} tiene un saldo de ${saldo} disponibles y se intentan facturar ${cantidad}`,
          );
        }

        filasDetalle.push({
          remito_id: id,
          cantidad_facturada: cantidad,
        });
      }
    }

    // ---------- alta de la factura ----------
    const factura = await Facturas.create(
      {
        company_id: 1,
        cliente_id: clienteId,
        tipo: tipoFinal,
        fecha,
        numero: numeroLimpio,
        estado: 'SIMULADA',
        notas: notas || null,
        created_by: req.user?.id ?? null,
      },
      { transaction },
    );

    if (filasDetalle.length > 0) {
      await RemitoFacturas.bulkCreate(
        filasDetalle.map((fila) => ({ ...fila, factura_id: factura.id })),
        { transaction },
      );
    }

    await transaction.commit();
    confirmada = true;

    const completa = await Facturas.findByPk(factura.id, {
      include: incluirClienteYRemitos,
    });
    return res.status(201).json(completa);
  } catch (error) {
    if (!confirmada) {
      await transaction.rollback();
    }
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El número de factura ya está en uso' });
    }
    return res.status(400).json({ message: error.message });
  }
};

// ----------------------------------------------------------------------------
// PUT /stock/facturas/:id/anular  (solo Administrador)
//   Pasa la factura a ANULADA y libera sus remitos (las filas de
//   remito_facturas quedan, pero dejan de contar para los saldos).
// ----------------------------------------------------------------------------
export const anularFactura = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const factura = await Facturas.findByPk(req.params.id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!factura) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Factura no encontrada' });
    }
    if (factura.estado === 'ANULADA') {
      await transaction.rollback();
      return res.status(400).json({ message: 'La factura ya está anulada' });
    }
    if (factura.estado === 'EMITIDA') {
      await transaction.rollback();
      return res.status(400).json({ message: 'No se puede anular una factura emitida' });
    }

    factura.estado = 'ANULADA';
    await factura.save({ transaction });

    await transaction.commit();

    const completa = await Facturas.findByPk(factura.id, {
      include: incluirClienteYRemitos,
    });
    res.json(completa);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};
