// services/reportes/reporteSemanalService.js

import { Op } from 'sequelize';

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';

import Clientes from '../../models/clientes.js';
import Users from '../../models/users.js';
import ClienteIngenieros from '../../models/clientesIngenieros.js';
import Maquinas from '../../models/maquinas.js';
import Calibraciones from '../../models/calibraciones.js';
import Pozo from '../../models/pozo.js';
import MuestraAgua from '../../models/muestra_agua.js';
import Jornada from '../../models/jornada.js';
import Alertas from '../../models/alertas.js';
import Notas from '../../models/notas.js';

dayjs.extend(isoWeek);

class ReporteSemanalService {
  // =========================================================
  // HELPERS — RANGOS DE FECHA
  // =========================================================

  /**
   * Rango automático: lunes–viernes de la semana que contiene `semana`.
   * Usado por el cron.
   * @param {string|null} semana  Fecha ISO de referencia. Null = semana actual.
   * @returns {{ inicio: Date, fin: Date, label: string }}
   */
  buildWeekRange(semana) {
    const ref = semana ? dayjs(semana) : dayjs();

    const inicio = ref.isoWeekday(1).startOf('day').toDate();
    const fin = ref.isoWeekday(5).endOf('day').toDate();
    const label = `${dayjs(inicio).format('DD/MM/YYYY')} – ${dayjs(fin).format('DD/MM/YYYY')}`;

    return { inicio, fin, label };
  }

  /**
   * Rango libre: cualquier fecha inicio–fin.
   * Usado por el endpoint manual.
   * @param {string} fechaInicio  Fecha ISO (ej: "2026-05-01")
   * @param {string} fechaFin     Fecha ISO (ej: "2026-05-23")
   * @returns {{ inicio: Date, fin: Date, label: string }}
   */
  buildCustomRange(fechaInicio, fechaFin) {
    const inicio = dayjs(fechaInicio).startOf('day').toDate();
    const fin = dayjs(fechaFin).endOf('day').toDate();
    const label = `${dayjs(inicio).format('DD/MM/YYYY')} – ${dayjs(fin).format('DD/MM/YYYY')}`;

    return { inicio, fin, label };
  }

  /**
   * Cláusula WHERE para detectar actividad en el rango,
   * evaluando tanto createdAt como updatedAt.
   */
  actividadEnRango(inicio, fin) {
    return {
      [Op.or]: [
        { createdAt: { [Op.between]: [inicio, fin] } },
        { updatedAt: { [Op.between]: [inicio, fin] } },
      ],
    };
  }

  // =========================================================
  // CORE — QUERIES DE ACTIVIDAD
  // =========================================================

  /**
   * Dado un rango, retorna todos los cliente_ids con al menos
   * un movimiento en alguna entidad del sistema.
   */
  async _resolverClientesConActividad(rangoWhere) {
    // ── Calibraciones → maquinas → clientes ──────────────────────────────
    const calibracionesEnRango = await Calibraciones.findAll({
      attributes: ['id', 'maquina_id'],
      where: rangoWhere,
      raw: true,
    });

    const maquinaIdsConActividad = [
      ...new Set(calibracionesEnRango.map((c) => c.maquina_id).filter(Boolean)),
    ];

    const maquinasConActividad = maquinaIdsConActividad.length
      ? await Maquinas.findAll({
          attributes: ['id', 'cliente_id'],
          where: { id: { [Op.in]: maquinaIdsConActividad } },
          raw: true,
        })
      : [];

    const clienteIdsPorCalibracion = [
      ...new Set(maquinasConActividad.map((m) => m.cliente_id).filter(Boolean)),
    ];

    // ── Muestras de agua → pozos → clientes ──────────────────────────────
    const pozosConMuestras = await Pozo.findAll({
      attributes: ['id', 'cliente_id'],
      include: [
        {
          model: MuestraAgua,
          as: 'muestrasAgua',
          attributes: ['id'],
          where: rangoWhere,
          required: true,
        },
      ],
      raw: true,
    });

    const clienteIdsPorMuestra = [
      ...new Set(pozosConMuestras.map((p) => p.cliente_id).filter(Boolean)),
    ];

    // ── Jornadas ──────────────────────────────────────────────────────────
    const jornadasEnRango = await Jornada.findAll({
      attributes: ['cliente_id'],
      where: rangoWhere,
      raw: true,
    });

    const clienteIdsPorJornada = [
      ...new Set(jornadasEnRango.map((j) => j.cliente_id).filter(Boolean)),
    ];

    // ── Alertas → via metadata.cliente_id ────────────────────────────────
    const alertasEnRango = await Alertas.findAll({
      attributes: ['id', 'categoria', 'metadata'],
      where: rangoWhere,
      raw: true,
    });

    const clienteIdsPorAlerta = [
      ...new Set(
        alertasEnRango
          .map((a) => {
            // metadata puede venir como string (raw:true) o como objeto
            const meta =
              typeof a.metadata === 'string'
                ? JSON.parse(a.metadata)
                : a.metadata;
            return meta?.cliente_id;
          })
          .filter(Boolean),
      ),
    ];

    // ── Notas ─────────────────────────────────────────────────────────────
    const notasEnRango = await Notas.findAll({
      attributes: ['cliente_id'],
      where: rangoWhere,
      raw: true,
    });

    const clienteIdsPorNota = [
      ...new Set(notasEnRango.map((n) => n.cliente_id).filter(Boolean)),
    ];

    // ── Unión ─────────────────────────────────────────────────────────────
    const todosClienteIds = [
      ...new Set([
        ...clienteIdsPorCalibracion,
        ...clienteIdsPorMuestra,
        ...clienteIdsPorJornada,
        ...clienteIdsPorAlerta,
        ...clienteIdsPorNota,
      ]),
    ];

    return { todosClienteIds, alertasEnRango };
  }

  // =========================================================
  // CORE — RESUMEN POR CLIENTE
  // =========================================================

  async _buildResumenCliente({ cliente, rangoWhere, alertasEnRango }) {
    const cliente_id = cliente.id;

    // ── Máquinas del cliente ──────────────────────────────────────────────
    const maquinasCliente = await Maquinas.findAll({
      attributes: ['id'],
      where: { cliente_id },
      raw: true,
    });

    const maquinaIds = maquinasCliente.map((m) => m.id);

    // ── Calibraciones ─────────────────────────────────────────────────────
    const totalCalibraciones = maquinaIds.length
      ? await Calibraciones.count({
          where: { maquina_id: { [Op.in]: maquinaIds }, ...rangoWhere },
        })
      : 0;

    // ── Pozos del cliente ─────────────────────────────────────────────────
    const pozosCliente = await Pozo.findAll({
      attributes: ['id'],
      where: { cliente_id },
      raw: true,
    });

    const pozoIds = pozosCliente.map((p) => p.id);

    // ── Muestras de agua ──────────────────────────────────────────────────
    const totalMuestras = pozoIds.length
      ? await MuestraAgua.count({
          where: { pozo_id: { [Op.in]: pozoIds }, ...rangoWhere },
        })
      : 0;

    // ── Jornadas ──────────────────────────────────────────────────────────
    const totalJornadas = await Jornada.count({
      where: { cliente_id, ...rangoWhere },
    });

    // ── Alertas (filtradas del batch ya traído) ───────────────────────────
    const alertasCliente = alertasEnRango.filter((a) => {
      const meta =
        typeof a.metadata === 'string' ? JSON.parse(a.metadata) : a.metadata;
      return meta?.cliente_id === cliente_id;
    });

    const alertasAgrupadas = alertasCliente.reduce((acc, alerta) => {
      const categoria = alerta.categoria || 'sin_categoria';
      acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {});

    // ── Notas ─────────────────────────────────────────────────────────────
    const totalNotas = await Notas.count({
      where: { cliente_id, ...rangoWhere },
    });

    // ── Ingenieros ────────────────────────────────────────────────────────
    const ingenieros = (cliente.ingenieros || []).map((ing) => ({
      id: ing.id,
      nombre: ing.nombre,
      email: ing.email,
      es_principal: ing.ClienteIngenieros?.es_principal ?? false,
    }));

    return {
      cliente_id,
      razon_social: cliente.razon_social,
      email: cliente.email,
      telefono: cliente.telefono,
      ingenieros,
      resumen: {
        calibraciones: totalCalibraciones,
        muestras_agua: totalMuestras,
        jornadas: totalJornadas,
        alertas: {
          total: alertasCliente.length,
          por_categoria: alertasAgrupadas,
        },
        comentarios_observaciones: totalNotas,
      },
    };
  }

  // =========================================================
  // MÉTODO PRINCIPAL — PUNTO DE ENTRADA ÚNICO
  // =========================================================

  /**
   * Genera el reporte para el rango dado.
   *
   * Modo cron (automático):
   *   generarReporte({ semana: '2026-05-19' })   → lunes–viernes de esa semana
   *   generarReporte()                            → semana actual
   *
   * Modo manual (form):
   *   generarReporte({ fechaInicio: '2026-05-01', fechaFin: '2026-05-23' })
   *
   * @param {{ semana?: string, fechaInicio?: string, fechaFin?: string }} [params]
   */
  async generarReporte(params = {}) {
    const { semana, fechaInicio, fechaFin } = params;

    // Determina el rango según el modo de invocación
    const { inicio, fin, label } =
      fechaInicio && fechaFin
        ? this.buildCustomRange(fechaInicio, fechaFin)
        : this.buildWeekRange(semana);

    const rangoWhere = this.actividadEnRango(inicio, fin);

    // Detecta todos los clientes con actividad en el rango
    const { todosClienteIds, alertasEnRango } =
      await this._resolverClientesConActividad(rangoWhere);

    if (todosClienteIds.length === 0) {
      return { ok: true, periodo: label, total_clientes: 0, data: [] };
    }

    // Carga clientes con sus ingenieros
    const clientes = await Clientes.findAll({
      where: { id: { [Op.in]: todosClienteIds } },
      attributes: ['id', 'razon_social', 'email', 'telefono'],
      include: [
        {
          model: Users,
          as: 'ingenieros',
          attributes: ['id', 'nombre', 'email'],
          through: { model: ClienteIngenieros, attributes: ['es_principal'] },
        },
      ],
      order: [['razon_social', 'ASC']],
    });

    // Construye el resumen de cada cliente
    const data = await Promise.all(
      clientes.map((cliente) =>
        this._buildResumenCliente({ cliente, rangoWhere, alertasEnRango }),
      ),
    );

    return { ok: true, periodo: label, total_clientes: data.length, data };
  }
}

export default ReporteSemanalService;
