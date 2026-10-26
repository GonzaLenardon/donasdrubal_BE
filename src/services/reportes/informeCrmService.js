import dayjs from 'dayjs';
import { Op } from 'sequelize';
import {
  Calibraciones,
  Clientes,
  Jornada,
  Maquinas,
  MuestraAgua,
  Pozo,
  TipoClientes,
  Users,
} from '../../models/index.js';

const SERVICIOS = {
  jornada: { model: Jornada, label: 'Jornadas' },
  muestra_agua: { model: MuestraAgua, label: 'Muestras de agua' },
  calibracion: { model: Calibraciones, label: 'Calibraciones' },
};

const idValido = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

function normalizarLista(value, nombre, validos, defaults) {
  if (value === undefined || value === null) return defaults;
  const items = Array.isArray(value) ? value : [value];
  if (!items.length || items.some((item) => typeof item !== 'string')) {
    throw new Error(`${nombre} debe ser una lista no vacía de valores válidos`);
  }
  const normalizados = [...new Set(items.map((item) => item.trim().toLowerCase()))];
  if (normalizados.some((item) => !validos.includes(item))) {
    throw new Error(`Valores inválidos en ${nombre}`);
  }
  return normalizados;
}

function parsearFecha(value, nombre, final = false) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !dayjs(value).isValid() || dayjs(value).format('YYYY-MM-DD') !== value) {
    throw new Error(`${nombre} debe tener formato YYYY-MM-DD y ser una fecha válida`);
  }
  return final ? dayjs(value).endOf('day').toDate() : dayjs(value).startOf('day').toDate();
}

export class FiltroInvalidoError extends Error {
  constructor(message) { super(message); this.name = 'FiltroInvalidoError'; }
}
export class RecursoNoEncontradoError extends Error {
  constructor(message) { super(message); this.name = 'RecursoNoEncontradoError'; }
}

class InformeCrmService {
  async generar(params = {}) {
    try {
      return await this._generar(params);
    } catch (error) {
      if (error instanceof FiltroInvalidoError || error instanceof RecursoNoEncontradoError) throw error;
      if (/^(fecha|servicios|tiposCliente|Valores inválidos|clienteId|ingenieroId)/.test(error.message || '')) {
        throw new FiltroInvalidoError(error.message);
      }
      throw error;
    }
  }

  async _generar({ fechaInicio, fechaFin, clienteId, ingenieroId, servicios, tiposCliente }) {
    const inicio = parsearFecha(fechaInicio, 'fechaInicio');
    const fin = parsearFecha(fechaFin, 'fechaFin', true);
    if (inicio > fin) throw new FiltroInvalidoError('fechaInicio no puede ser posterior a fechaFin');
    if (clienteId !== undefined && !idValido(clienteId)) throw new FiltroInvalidoError('clienteId debe ser un identificador válido');
    if (ingenieroId !== undefined && !idValido(ingenieroId)) throw new FiltroInvalidoError('ingenieroId debe ser un identificador válido');
    const serviciosElegidos = normalizarLista(servicios, 'servicios', Object.keys(SERVICIOS), Object.keys(SERVICIOS));
    const tiposElegidos = normalizarLista(tiposCliente, 'tiposCliente', ['a', 'b', 'c'], null);

    const [cliente, ingeniero, tiposDb] = await Promise.all([
      clienteId === undefined ? null : Clientes.findByPk(Number(clienteId), { attributes: ['id', 'razon_social'] }),
      ingenieroId === undefined ? null : Users.findByPk(Number(ingenieroId), { attributes: ['id', 'nombre'] }),
      tiposElegidos ? TipoClientes.findAll({ attributes: ['id', 'tipoClientes'], raw: true }) : [],
    ]);
    if (clienteId !== undefined && !cliente) throw new RecursoNoEncontradoError('Cliente inexistente');
    if (ingenieroId !== undefined && !ingeniero) throw new RecursoNoEncontradoError('Ingeniero inexistente');

    let tiposAplicados = [];
    if (tiposElegidos) {
      const tipoPorCodigo = new Map(tiposDb.map((tipo) => [String(tipo.tipoClientes).trim().toLowerCase(), tipo]));
      if (tiposElegidos.some((codigo) => !tipoPorCodigo.has(codigo))) {
        throw new FiltroInvalidoError('Los tipos de cliente solicitados no existen en la configuración del CRM');
      }
      tiposAplicados = tiposElegidos.map((codigo) => tipoPorCodigo.get(codigo).id);
    }

    const clienteWhere = {};
    if (clienteId !== undefined) clienteWhere.id = Number(clienteId);
    if (tiposElegidos) clienteWhere.tipo_cliente_id = { [Op.in]: tiposAplicados };
    const clientesValidos = await Clientes.findAll({
      where: clienteWhere,
      attributes: ['id', 'razon_social', 'tipo_cliente_id'],
      include: [{ model: TipoClientes, as: 'tipoCliente', attributes: ['tipoClientes'], required: Boolean(tiposElegidos) }],
      raw: true,
    });
    const clientesPorId = new Map(clientesValidos.map((c) => [Number(c.id), c]));
    const idsClientes = [...clientesPorId.keys()];
    const maquinas = idsClientes.length ? await Maquinas.findAll({ where: { cliente_id: { [Op.in]: idsClientes } }, attributes: ['id', 'cliente_id'], raw: true }) : [];
    const pozos = idsClientes.length ? await Pozo.findAll({ where: { cliente_id: { [Op.in]: idsClientes } }, attributes: ['id', 'cliente_id'], raw: true }) : [];
    const clientePorMaquina = new Map(maquinas.map((m) => [Number(m.id), Number(m.cliente_id)]));
    const clientePorPozo = new Map(pozos.map((p) => [Number(p.id), Number(p.cliente_id)]));

    const actividadWhere = {
      [Op.or]: [
        { createdAt: { [Op.between]: [inicio, fin] } },
        { updatedAt: { [Op.between]: [inicio, fin] } },
      ],
      ...(ingenieroId !== undefined ? { responsable_id: Number(ingenieroId) } : {}),
    };
    const actividad = [];
    for (const servicio of serviciosElegidos) {
      const Model = SERVICIOS[servicio].model;
      const rows = await Model.findAll({
        where: actividadWhere,
        attributes: servicio === 'jornada'
          ? ['id', 'cliente_id', 'responsable_id', 'createdAt', 'updatedAt']
          : ['id', servicio === 'calibracion' ? 'maquina_id' : 'pozo_id', 'responsable_id', 'createdAt', 'updatedAt'],
        raw: true,
      });
      for (const row of rows) {
        const idCliente = servicio === 'jornada' ? Number(row.cliente_id) : servicio === 'calibracion' ? clientePorMaquina.get(Number(row.maquina_id)) : clientePorPozo.get(Number(row.pozo_id));
        const datosCliente = clientesPorId.get(idCliente);
        if (!datosCliente) continue;
        actividad.push({ id: row.id, clienteId: idCliente, cliente: datosCliente.razon_social, ingenieroId: row.responsable_id, servicio, fecha: row.updatedAt || row.createdAt });
      }
    }

    const ingenieroIds = [...new Set(actividad.map((a) => a.ingenieroId).filter(Boolean).map(Number))];
    const ingenieros = ingenieroIds.length ? await Users.findAll({ where: { id: { [Op.in]: ingenieroIds } }, attributes: ['id', 'nombre'], raw: true }) : [];
    const nombreIngeniero = new Map(ingenieros.map((i) => [Number(i.id), i.nombre]));
    const conteoServicios = Object.fromEntries(serviciosElegidos.map((s) => [s, actividad.filter((a) => a.servicio === s).length]));
    const clientesActivos = new Set(actividad.map((a) => a.clienteId));
    const ingenierosActivos = new Set(actividad.map((a) => a.ingenieroId).filter(Boolean));
    const filas = actividad.map((a) => ({ ...a, ingeniero: nombreIngeniero.get(Number(a.ingenieroId)) || 'Sin asignar', fecha: dayjs(a.fecha).format('DD/MM/YYYY') })).sort((a, b) => a.cliente.localeCompare(b.cliente, 'es') || a.fecha.localeCompare(b.fecha));
    return {
      filtros: { fechaInicio, fechaFin, cliente: cliente?.razon_social || null, ingeniero: ingeniero?.nombre || null, servicios: serviciosElegidos, tiposCliente: tiposElegidos?.map((t) => t.toUpperCase()) || null },
      indicadores: { clientesActivos: clientesActivos.size, ingenierosActivos: ingenierosActivos.size, totalActividades: actividad.length, porServicio: conteoServicios },
      detalle: filas,
      sinResultados: filas.length === 0,
      universoClientes: clientesValidos.length,
    };
  }
}

export default InformeCrmService;
