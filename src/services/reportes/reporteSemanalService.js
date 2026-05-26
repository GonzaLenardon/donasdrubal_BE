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
  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  buildWeekRange(semana) {
    const ref = semana ? dayjs(semana) : dayjs();

    const inicio = ref.isoWeekday(1).startOf('day').toDate();

    const fin = ref.isoWeekday(5).endOf('day').toDate();

    const label = `${dayjs(inicio).format(
      'DD/MM/YYYY',
    )} – ${dayjs(fin).format('DD/MM/YYYY')}`;

    return {
      inicio,
      fin,
      label,
    };
  }

  actividadEnRango(inicio, fin) {
    return {
      [Op.or]: [
        {
          createdAt: {
            [Op.between]: [inicio, fin],
          },
        },
        {
          updatedAt: {
            [Op.between]: [inicio, fin],
          },
        },
      ],
    };
  }

  // ─────────────────────────────────────────────
  // Generar reporte
  // ─────────────────────────────────────────────

  async generarReporte(semana) {
    const { inicio, fin, label } = this.buildWeekRange(semana);

    const rangoWhere = this.actividadEnRango(inicio, fin);

    // ─────────────────────────────────────────
    // 1. CALIBRACIONES
    // ─────────────────────────────────────────

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
          where: {
            id: {
              [Op.in]: maquinaIdsConActividad,
            },
          },
          raw: true,
        })
      : [];

    const clienteIdsPorCalibracion = [
      ...new Set(maquinasConActividad.map((m) => m.cliente_id).filter(Boolean)),
    ];

    // ─────────────────────────────────────────
    // 2. MUESTRAS DE AGUA
    // ─────────────────────────────────────────

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

    // ─────────────────────────────────────────
    // 3. JORNADAS
    // ─────────────────────────────────────────

    const jornadasEnRango = await Jornada.findAll({
      attributes: ['cliente_id'],
      where: rangoWhere,
      raw: true,
    });

    const clienteIdsPorJornada = [
      ...new Set(jornadasEnRango.map((j) => j.cliente_id).filter(Boolean)),
    ];

    // ─────────────────────────────────────────
    // 4. ALERTAS
    // ─────────────────────────────────────────

    const alertasEnRango = await Alertas.findAll({
      attributes: ['id', 'categoria', 'metadata'],
      where: rangoWhere,
      raw: true,
    });

    const clienteIdsPorAlerta = [
      ...new Set(
        alertasEnRango.map((a) => a.metadata?.cliente_id).filter(Boolean),
      ),
    ];

    // ─────────────────────────────────────────
    // 5. NOTAS
    // ─────────────────────────────────────────

    const notasEnRango = await Notas.findAll({
      attributes: ['cliente_id'],
      where: rangoWhere,
      raw: true,
    });

    const clienteIdsPorNota = [
      ...new Set(notasEnRango.map((n) => n.cliente_id).filter(Boolean)),
    ];

    // ─────────────────────────────────────────
    // 6. UNION CLIENTES
    // ─────────────────────────────────────────

    const todosClienteIds = [
      ...new Set([
        ...clienteIdsPorCalibracion,
        ...clienteIdsPorMuestra,
        ...clienteIdsPorJornada,
        ...clienteIdsPorAlerta,
        ...clienteIdsPorNota,
      ]),
    ];

    // ─────────────────────────────────────────
    // SIN ACTIVIDAD
    // ─────────────────────────────────────────

    if (todosClienteIds.length === 0) {
      return {
        ok: true,
        periodo: label,
        total_clientes: 0,
        data: [],
      };
    }

    // ─────────────────────────────────────────
    // 7. CLIENTES
    // ─────────────────────────────────────────

    const clientes = await Clientes.findAll({
      where: {
        id: {
          [Op.in]: todosClienteIds,
        },
      },

      attributes: ['id', 'razon_social', 'email', 'telefono'],

      include: [
        {
          model: Users,
          as: 'ingenieros',

          attributes: ['id', 'nombre', 'email'],

          through: {
            model: ClienteIngenieros,
            attributes: ['es_principal'],
          },
        },
      ],

      order: [['razon_social', 'ASC']],
    });

    // ─────────────────────────────────────────
    // 8. RESUMEN
    // ─────────────────────────────────────────

    const data = await Promise.all(
      clientes.map(async (cliente) => {
        const cliente_id = cliente.id;

        // ─────────────────────
        // MAQUINAS
        // ─────────────────────

        const maquinasCliente = await Maquinas.findAll({
          attributes: ['id'],
          where: { cliente_id },
          raw: true,
        });

        const maquinaIds = maquinasCliente.map((m) => m.id);

        // ─────────────────────
        // CALIBRACIONES
        // ─────────────────────

        const totalCalibraciones = maquinaIds.length
          ? await Calibraciones.count({
              where: {
                maquina_id: {
                  [Op.in]: maquinaIds,
                },
                ...rangoWhere,
              },
            })
          : 0;

        // ─────────────────────
        // POZOS
        // ─────────────────────

        const pozosCliente = await Pozo.findAll({
          attributes: ['id'],
          where: { cliente_id },
          raw: true,
        });

        const pozoIds = pozosCliente.map((p) => p.id);

        // ─────────────────────
        // MUESTRAS
        // ─────────────────────

        const totalMuestras = pozoIds.length
          ? await MuestraAgua.count({
              where: {
                pozo_id: {
                  [Op.in]: pozoIds,
                },
                ...rangoWhere,
              },
            })
          : 0;

        // ─────────────────────
        // JORNADAS
        // ─────────────────────

        const totalJornadas = await Jornada.count({
          where: {
            cliente_id,
            ...rangoWhere,
          },
        });

        // ─────────────────────
        // ALERTAS
        // ─────────────────────

        const alertasCliente = alertasEnRango.filter(
          (a) => a.metadata?.cliente_id === cliente_id,
        );

        const totalAlertas = alertasCliente.length;

        const alertasAgrupadas = alertasCliente.reduce((acc, alerta) => {
          const categoria = alerta.categoria || 'sin_categoria';

          acc[categoria] = (acc[categoria] || 0) + 1;

          return acc;
        }, {});

        // ─────────────────────
        // NOTAS
        // ─────────────────────

        const totalNotas = await Notas.count({
          where: {
            cliente_id,
            ...rangoWhere,
          },
        });

        // ─────────────────────
        // INGENIEROS
        // ─────────────────────

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
              total: totalAlertas,
              por_categoria: alertasAgrupadas,
            },

            comentarios_observaciones: totalNotas,
          },
        };
      }),
    );

    // ─────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────

    return {
      ok: true,
      periodo: label,
      total_clientes: data.length,
      data,
    };
  }
}

export default ReporteSemanalService;
