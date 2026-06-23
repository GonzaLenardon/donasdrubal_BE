import { Op } from 'sequelize';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';

import {
  Clientes,
  Users,
  Maquinas,
  Calibraciones,
  Pozo,
  MuestraAgua,
  Jornada,
  Alertas,
  Notas,
} from '../../models/index.js';

dayjs.extend(isoWeek);

const ESTADOS_ALERTA_ACTIVAS = ['PENDIENTE', 'ACTIVA', 'ALERTADO', 'VENCIDO'];

class ResumenCrmService {
  //*  ==========  ESTA FUNCION ES PARA OBTENER LA SEMANA DE LUNES A VIERNES

  /*  buildWeekRange(semana) {
    const ref = semana ? dayjs(semana) : dayjs();

    const inicio = ref.isoWeekday(1).startOf('day').toDate();
    const fin = ref.isoWeekday(5).endOf('day').toDate();
    const label = `${dayjs(inicio).format('DD/MM/YYYY')} – ${dayjs(fin).format('DD/MM/YYYY')}`;

    console.log(
      'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm .................... ',
    );

    return { inicio, fin, label };
  } */

  buildWeekRange(semana) {
    const ref = semana ? dayjs(semana) : dayjs();

    // isoWeekday: Lu=1, Ma=2, Mi=3, Ju=4, Vi=5, Sá=6, Do=7
    const diaSemana = ref.isoWeekday();

    // Días transcurridos desde el sábado de esta semana
    // Sá=0, Do=1, Lu=2, Ma=3, Mi=4, Ju=5, Vi=6
    const diasDesdeSabado =
      diaSemana === 6 ? 0 : diaSemana === 7 ? 1 : diaSemana + 1;

    const sabadoInicio = ref.subtract(diasDesdeSabado, 'day').startOf('day');
    const viernesFin = sabadoInicio.add(6, 'day').endOf('day');

    const label = `${sabadoInicio.format('DD/MM/YYYY')} – ${viernesFin.format('DD/MM/YYYY')}`;

    return {
      inicio: sabadoInicio.toDate(),
      fin: viernesFin.toDate(),
      label,
    };
  }

  buildCustomRange(fechaInicio, fechaFin) {
    const inicio = dayjs(fechaInicio).startOf('day').toDate();
    const fin = dayjs(fechaFin).endOf('day').toDate();
    const label = `${dayjs(inicio).format('DD/MM/YYYY')} – ${dayjs(fin).format('DD/MM/YYYY')}`;

    return { inicio, fin, label };
  }

  actividadEnRango(inicio, fin) {
    return {
      [Op.or]: [
        { createdAt: { [Op.between]: [inicio, fin] } },
        { updatedAt: { [Op.between]: [inicio, fin] } },
      ],
    };
  }

  buildIndicador(actual, anterior) {
    return {
      actual,
      anterior,
      variacion: this.calcularVariacion(actual, anterior),
    };
  }

  async obtenerActividadPeriodo(inicio, fin) {
    const rangoWhere = this.actividadEnRango(inicio, fin);

    const [calibraciones, muestras, jornadas, alertas, notas] =
      await Promise.all([
        Calibraciones.findAll({
          attributes: [
            'id',
            'maquina_id',
            'responsable_id',
            'createdAt',
            'updatedAt',
          ],
          where: rangoWhere,
          raw: true,
        }),

        MuestraAgua.findAll({
          attributes: ['id', 'pozo_id', 'createdAt', 'updatedAt'],
          where: rangoWhere,
          raw: true,
        }),

        Jornada.findAll({
          attributes: ['id', 'cliente_id', 'createdAt', 'updatedAt'],
          where: rangoWhere,
          raw: true,
        }),

        Alertas.findAll({
          attributes: [
            'id',
            'categoria',
            'metadata',
            'estado',
            'fecha_vencimiento',
            'createdAt',
            'updatedAt',
          ],
          where: rangoWhere,
          raw: true,
        }),

        Notas.findAll({
          attributes: [
            'id',
            'cliente_id',
            'usuario_id',
            'createdAt',
            'updatedAt',
          ],
          where: rangoWhere,
          raw: true,
        }),
      ]);

    return {
      calibraciones,
      muestras,
      jornadas,
      alertas,
      notas,
    };
  }

  getPeriodoAnterior(inicio, fin) {
    const dias = dayjs(fin).diff(dayjs(inicio), 'day') + 1;

    return {
      inicioAnterior: dayjs(inicio)
        .subtract(dias, 'day')
        .startOf('day')
        .toDate(),

      finAnterior: dayjs(inicio).subtract(1, 'day').endOf('day').toDate(),
    };
  }

  _parseAlertaMetadata(alerta) {
    if (!alerta || !alerta.metadata) {
      return null;
    }

    if (typeof alerta.metadata === 'string') {
      try {
        return JSON.parse(alerta.metadata);
      } catch (error) {
        return null;
      }
    }

    return alerta.metadata;
  }

  _clienteIdDesdeAlerta(alerta) {
    const metadata = this._parseAlertaMetadata(alerta);

    if (metadata?.cliente_id) {
      return metadata.cliente_id;
    }

    return null;
  }

  getSemanaAnterior(inicio) {
    const inicioAnterior = dayjs(inicio)
      .subtract(7, 'day')
      .startOf('day')
      .toDate();

    const finAnterior = dayjs(inicio).subtract(3, 'day').endOf('day').toDate();

    return {
      inicioAnterior,
      finAnterior,
    };
  }

  calcularVariacion(actual, anterior) {
    if (actual === 0 && anterior === 0) {
      return '=';
    }

    if (anterior === 0) {
      return 'Nuevo';
    }

    const porcentaje = Math.round(((actual - anterior) / anterior) * 100);

    return `${porcentaje > 0 ? '+' : ''}${porcentaje}%`;
  }

  async generarResumenV2(params = {}) {
    const { semana, fechaInicio, fechaFin } = params;

    const { inicio, fin, label } =
      fechaInicio && fechaFin
        ? this.buildCustomRange(fechaInicio, fechaFin)
        : this.buildWeekRange(semana);

    const { inicioAnterior, finAnterior } = this.getPeriodoAnterior(
      inicio,
      fin,
    );

    const maquinas = await Maquinas.findAll({
      attributes: ['id', 'cliente_id'],
      raw: true,
    });

    const pozos = await Pozo.findAll({
      attributes: ['id', 'cliente_id'],
      raw: true,
    });

    const maquinasPorId = maquinas.reduce((acc, item) => {
      acc[item.id] = item.cliente_id;
      return acc;
    }, {});

    const pozosPorId = pozos.reduce((acc, item) => {
      acc[item.id] = item.cliente_id;
      return acc;
    }, {});

    const actividadActual = await this.obtenerActividadPeriodo(inicio, fin);

    const actividadAnterior = await this.obtenerActividadPeriodo(
      inicioAnterior,
      finAnterior,
    );

    const clientesActual = new Set();
    const clientesAnterior = new Set();

    // =======================================
    // INGENIEROS ACTIVOS (Definir primero)
    // =======================================
    const ingenierosActual = new Set();
    const ingenierosAnterior = new Set();

    const actividadIngenieroActual = new Map();
    const actividadIngenieroAnterior = new Map();

    const incrementarIngeniero = (mapa, ingenieroId) => {
      if (!ingenieroId) return;
      mapa.set(ingenieroId, (mapa.get(ingenieroId) || 0) + 1);
    };

    // ============================
    // CLIENTES ACTIVOS
    // ============================

    // Actual
    actividadActual.calibraciones.forEach((item) => {
      const clienteId = maquinasPorId[item.maquina_id];
      if (clienteId) clientesActual.add(clienteId);

      if (item.responsable_id) {
        ingenierosActual.add(item.responsable_id);
        incrementarIngeniero(actividadIngenieroActual, item.responsable_id);
      }
    });

    actividadActual.muestras.forEach((item) => {
      const clienteId = pozosPorId[item.pozo_id];
      if (clienteId) clientesActual.add(clienteId);
    });

    actividadActual.jornadas.forEach((item) => {
      if (item.cliente_id) clientesActual.add(item.cliente_id);
    });

    actividadActual.notas.forEach((item) => {
      if (item.cliente_id) clientesActual.add(item.cliente_id);

      if (item.usuario_id) {
        ingenierosActual.add(item.usuario_id);
        incrementarIngeniero(actividadIngenieroActual, item.usuario_id);
      }
    });

    // Anterior
    actividadAnterior.calibraciones.forEach((item) => {
      const clienteId = maquinasPorId[item.maquina_id];
      if (clienteId) clientesAnterior.add(clienteId);

      if (item.responsable_id) {
        ingenierosAnterior.add(item.responsable_id);
        incrementarIngeniero(actividadIngenieroAnterior, item.responsable_id);
      }
    });

    actividadAnterior.muestras.forEach((item) => {
      const clienteId = pozosPorId[item.pozo_id];
      if (clienteId) clientesAnterior.add(clienteId);
    });

    actividadAnterior.jornadas.forEach((item) => {
      if (item.cliente_id) clientesAnterior.add(item.cliente_id);
    });

    actividadAnterior.notas.forEach((item) => {
      if (item.cliente_id) clientesAnterior.add(item.cliente_id);

      if (item.usuario_id) {
        ingenierosAnterior.add(item.usuario_id);
        incrementarIngeniero(actividadIngenieroAnterior, item.usuario_id);
      }
    });

    const actividadesActual =
      actividadActual.calibraciones.length +
      actividadActual.muestras.length +
      actividadActual.jornadas.length +
      actividadActual.notas.length;

    const actividadesAnterior =
      actividadAnterior.calibraciones.length +
      actividadAnterior.muestras.length +
      actividadAnterior.jornadas.length +
      actividadAnterior.notas.length;

    // =======================================
    // INDICADORES
    // =======================================

    const indicadores = {
      clientes_activos: this.buildIndicador(
        clientesActual.size,
        clientesAnterior.size,
      ),

      actividades: this.buildIndicador(actividadesActual, actividadesAnterior),

      ingenieros_activos: this.buildIndicador(
        ingenierosActual.size,
        ingenierosAnterior.size,
      ),

      calibraciones: this.buildIndicador(
        actividadActual.calibraciones.length,
        actividadAnterior.calibraciones.length,
      ),

      muestras: this.buildIndicador(
        actividadActual.muestras.length,
        actividadAnterior.muestras.length,
      ),

      jornadas: this.buildIndicador(
        actividadActual.jornadas.length,
        actividadAnterior.jornadas.length,
      ),

      alertas: this.buildIndicador(
        actividadActual.alertas.length,
        actividadAnterior.alertas.length,
      ),

      notas: this.buildIndicador(
        actividadActual.notas.length,
        actividadAnterior.notas.length,
      ),
    };

    // =======================================
    //   ACTIVIDAD POR CLIENTE
    // =======================================

    const actividadClientes = new Map();

    const incrementarCliente = (clienteId, tipo) => {
      if (!clienteId) return;

      if (!actividadClientes.has(clienteId)) {
        actividadClientes.set(clienteId, {
          cliente_id: clienteId,
          calibraciones: 0,
          muestras: 0,
          jornadas: 0,
          notas: 0,
          alertas: 0,
          total: 0,
        });
      }

      const item = actividadClientes.get(clienteId);

      item[tipo] += 1;
      item.total += 1;
    };

    actividadActual.calibraciones.forEach((item) => {
      incrementarCliente(maquinasPorId[item.maquina_id], 'calibraciones');
    });

    actividadActual.muestras.forEach((item) => {
      incrementarCliente(pozosPorId[item.pozo_id], 'muestras');
    });

    actividadActual.jornadas.forEach((item) => {
      incrementarCliente(item.cliente_id, 'jornadas');
    });

    actividadActual.notas.forEach((item) => {
      if (item.cliente_id) {
        incrementarCliente(item.cliente_id, 'notas');
      }
    });

    actividadActual.alertas.forEach((alerta) => {
      const clienteId = this._clienteIdDesdeAlerta(alerta);
      if (clienteId) {
        incrementarCliente(clienteId, 'alertas');
      }
    });

    const clienteIds = [...actividadClientes.keys()];

    const clientesData = clienteIds.length
      ? await Clientes.findAll({
          where: {
            id: {
              [Op.in]: clienteIds,
            },
          },
          attributes: ['id', 'razon_social'],
          raw: true,
        })
      : [];

    const rankingClientes = [...actividadClientes.values()]
      .map((item) => {
        const cliente = clientesData.find((c) => c.id === item.cliente_id);

        return {
          ...item,
          cliente: cliente?.razon_social || 'Cliente desconocido',
        };
      })
      .sort((a, b) => b.total - a.total);

    const topClientes = rankingClientes.slice(0, 5);

    const bottomClientes = [...rankingClientes]
      .sort((a, b) => a.total - b.total)
      .slice(0, 5);

    const todosLosClientes = await Clientes.findAll({
      attributes: ['id', 'razon_social'],
      raw: true,
    });

    const ultimaActividadPorCliente = new Map();

    const actualizarUltimaActividad = (clienteId, fecha) => {
      if (!clienteId || !fecha) return;

      const actual = ultimaActividadPorCliente.get(clienteId);

      if (!actual || dayjs(fecha).isAfter(actual)) {
        ultimaActividadPorCliente.set(clienteId, dayjs(fecha));
      }
    };

    const [todasCalibraciones, todasMuestras, todasJornadas, todasNotas] =
      await Promise.all([
        Calibraciones.findAll({
          attributes: ['maquina_id', 'createdAt', 'updatedAt'],
          raw: true,
        }),

        MuestraAgua.findAll({
          attributes: ['pozo_id', 'createdAt', 'updatedAt'],
          raw: true,
        }),

        Jornada.findAll({
          attributes: ['cliente_id', 'createdAt', 'updatedAt'],
          raw: true,
        }),

        Notas.findAll({
          attributes: ['cliente_id', 'createdAt', 'updatedAt'],
          raw: true,
        }),
      ]);

    todasCalibraciones.forEach((item) => {
      const clienteId = maquinasPorId[item.maquina_id];

      actualizarUltimaActividad(clienteId, item.updatedAt || item.createdAt);
    });

    todasMuestras.forEach((item) => {
      const clienteId = pozosPorId[item.pozo_id];

      actualizarUltimaActividad(clienteId, item.updatedAt || item.createdAt);
    });

    todasJornadas.forEach((item) => {
      actualizarUltimaActividad(
        item.cliente_id,
        item.updatedAt || item.createdAt,
      );
    });

    todasNotas.forEach((item) => {
      actualizarUltimaActividad(
        item.cliente_id,
        item.updatedAt || item.createdAt,
      );
    });

    const clientesInactivos = todosLosClientes
      .map((cliente) => {
        const ultima = ultimaActividadPorCliente.get(cliente.id);

        if (!ultima) {
          return {
            cliente_id: cliente.id,
            cliente: cliente.razon_social,
            ultima_actividad: null,
            dias_inactivo: null,
            sin_historial: true,
          };
        }

        return {
          cliente_id: cliente.id,
          cliente: cliente.razon_social,
          ultima_actividad: ultima.format('YYYY-MM-DD'),
          dias_inactivo: dayjs().diff(ultima, 'day'),
          sin_historial: false,
        };
      })
      .filter((item) => item.dias_inactivo > 30)
      .sort((a, b) => b.dias_inactivo - a.dias_inactivo)
      .slice(0, 5);

    const actividadPorTipo = [
      {
        tipo: 'Calibraciones',
        actual: actividadActual.calibraciones.length,
        anterior: actividadAnterior.calibraciones.length,
        variacion: this.calcularVariacion(
          actividadActual.calibraciones.length,
          actividadAnterior.calibraciones.length,
        ),
      },
      {
        tipo: 'Muestras',
        actual: actividadActual.muestras.length,
        anterior: actividadAnterior.muestras.length,
        variacion: this.calcularVariacion(
          actividadActual.muestras.length,
          actividadAnterior.muestras.length,
        ),
      },
      {
        tipo: 'Jornadas',
        actual: actividadActual.jornadas.length,
        anterior: actividadAnterior.jornadas.length,
        variacion: this.calcularVariacion(
          actividadActual.jornadas.length,
          actividadAnterior.jornadas.length,
        ),
      },
      {
        tipo: 'Notas',
        actual: actividadActual.notas.length,
        anterior: actividadAnterior.notas.length,
        variacion: this.calcularVariacion(
          actividadActual.notas.length,
          actividadAnterior.notas.length,
        ),
      },
    ];

    const ingenieroIds = [
      ...new Set([
        ...actividadIngenieroActual.keys(),
        ...actividadIngenieroAnterior.keys(),
      ]),
    ];

    const ingenierosData = ingenieroIds.length
      ? await Users.findAll({
          where: { id: { [Op.in]: ingenieroIds } },
          attributes: ['id', 'nombre'],
          raw: true,
        })
      : [];

    const rankingIngenieros = [...actividadIngenieroActual.entries()]
      .map(([ingenieroId, actual]) => {
        const anterior = actividadIngenieroAnterior.get(ingenieroId) || 0;
        const usuario = ingenierosData.find((u) => u.id === ingenieroId);

        return {
          ingeniero_id: ingenieroId,
          ingeniero: usuario?.nombre || 'Sin nombre',
          actual,
          anterior,
          variacion: this.calcularVariacion(actual, anterior),
        };
      })
      .sort((a, b) => b.actual - a.actual)
      .slice(0, 5);

    const actividadPredominante = [...actividadPorTipo].sort(
      (a, b) => b.actual - a.actual,
    )[0];

    const resumenEjecutivo = {
      actividad_predominante: actividadPredominante.tipo,
      cantidad_actividad_predominante: actividadPredominante.actual,

      cliente_top: topClientes[0]?.cliente || '-',
      cliente_top_total: topClientes[0]?.total || 0,

      ingeniero_top: rankingIngenieros[0]?.ingeniero || '-',
      ingeniero_top_total: rankingIngenieros[0]?.actual || 0,

      total_clientes_inactivos: clientesInactivos.length,
    };

    return {
      ok: true,
      periodo: label,

      indicadores,

      actividad_por_tipo: actividadPorTipo,

      clientes_mas_activos: topClientes,

      clientes_menos_activos: bottomClientes,

      clientes_inactivos: clientesInactivos,

      ingenieros_mas_activos: rankingIngenieros,

      resumen_ejecutivo: resumenEjecutivo,
    };
  }
}

export default ResumenCrmService;
