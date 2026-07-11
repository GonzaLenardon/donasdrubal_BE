import { Op } from 'sequelize';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';

import {
  Clientes,
  Users,
  Maquinas,
  MaquinaTipo,
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

  buildWeekRange(semana, semanaAnterior = false) {
    let ref = semana ? dayjs(semana) : dayjs();

    // Si se pide explícitamente la semana anterior (caso: cron corriendo
    // un sábado a la mañana, cuando "hoy" ya es el inicio de la semana
    // siguiente), retrocedemos 1 día antes de calcular. Con eso, un
    // sábado 11/07 pasa a comportarse como si fuera viernes 10/07.
    if (semanaAnterior) {
      ref = ref.subtract(1, 'day');
    }

    const diaSemana = ref.isoWeekday();
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

  // ============================================================
  // NUEVO: Detalle de actividad por ingeniero (Hoja 2 del PDF)
  // Se arma en memoria a partir de actividadActual, sin queries extra.
  // ============================================================
  construirDetalleActividadIngenieros({
    actividadActual,
    maquinasPorId,
    pozosPorId,
    maquinasInfoPorId,
    pozosInfoPorId,
    ingenierosData,
    clientesData,
  }) {
    const resolverIngeniero = (id) => {
      const usuario = ingenierosData.find((u) => u.id === id);
      return usuario?.nombre || 'Sin asignar';
    };

    const resolverCliente = (id) => {
      const cliente = clientesData.find((c) => c.id === id);
      return cliente?.razon_social || 'Cliente desconocido';
    };

    const resolverEstado = (item) => {
      const creado = dayjs(item.createdAt);
      const actualizado = dayjs(item.updatedAt);
      const diffSegundos = Math.abs(actualizado.diff(creado, 'second'));
      return diffSegundos <= 1 ? 'Creado' : 'Modificado';
    };

    // Máquina: no tenemos un nombre propio útil, así que mostramos
    // tipo_maquina + ID para que quede unívocamente identificable.
    const resolverDetalleMaquina = (maquinaId) => {
      const info = maquinasInfoPorId[maquinaId];

      if (!info) return '-';

      return `${info.marca || 'Sin Marca'} - ${info.modelo || 'Sin Modelo'}`;
    };

    // Pozo: nombre + establecimiento, salteando cualquiera que venga vacío.
    const resolverDetallePozo = (pozoId) => {
      const info = pozosInfoPorId[pozoId];
      if (!info) return '-';
      const partes = [info.nombre, info.establecimiento].filter(Boolean);
      return partes.length ? partes.join(' - ') : '-';
    };

    const filas = [];

    actividadActual.calibraciones.forEach((item) => {
      filas.push({
        ingeniero: resolverIngeniero(item.responsable_id),
        cliente: resolverCliente(maquinasPorId[item.maquina_id]),
        servicio: 'Calibración',
        detalle: resolverDetalleMaquina(item.maquina_id),
        fecha: item.updatedAt || item.createdAt,
        estado: resolverEstado(item),
      });
    });

    actividadActual.muestras.forEach((item) => {
      filas.push({
        ingeniero: resolverIngeniero(item.responsable_id),
        cliente: resolverCliente(pozosPorId[item.pozo_id]),
        servicio: 'Muestra de agua',
        detalle: resolverDetallePozo(item.pozo_id),
        fecha: item.updatedAt || item.createdAt,
        estado: resolverEstado(item),
      });
    });

    actividadActual.jornadas.forEach((item) => {
      filas.push({
        ingeniero: resolverIngeniero(item.responsable_id),
        cliente: resolverCliente(item.cliente_id),
        servicio: 'Jornada',
        detalle: '-', // Jornada no referencia máquina ni pozo
        fecha: item.updatedAt || item.createdAt,
        estado: resolverEstado(item),
      });
    });

    return filas
      .sort((a, b) => {
        const cmpIngeniero = a.ingeniero.localeCompare(b.ingeniero, 'es');
        if (cmpIngeniero !== 0) return cmpIngeniero;
        return dayjs(b.fecha).diff(dayjs(a.fecha));
      })
      .map((fila) => ({
        ...fila,
        fecha: dayjs(fila.fecha).format('DD/MM/YYYY HH:mm'),
      }));
  }

  // ============================================================
  // NUEVO: Clientes tipo A / prioridad alta (Hoja 3 del PDF)
  // Reutiliza el mapa ultimaActividadPorCliente ya calculado en
  // generarResumenV2 (histórico completo, no solo el período).
  // ============================================================
  async obtenerClientesPrioridadAlta(ultimaActividadPorCliente) {
    const clientesPrioridad = await Clientes.findAll({
      where: {
        tipo_cliente_id: 1,
        categoria: 'alto',
      },
      attributes: ['id', 'razon_social', 'categoria'],
      raw: true,
    });

    return clientesPrioridad
      .map((cliente) => {
        const ultima = ultimaActividadPorCliente.get(cliente.id);

        return {
          cliente_id: cliente.id,
          cliente: cliente.razon_social,
          categoria: cliente.categoria,
          ultima_actividad: ultima
            ? ultima.format('DD/MM/YYYY')
            : 'Sin registro',
          dias_inactivo: ultima ? dayjs().diff(ultima, 'day') : null,
          sin_historial: !ultima,
        };
      })
      .sort((a, b) => {
        // Sin historial (nunca tuvo servicio) = máxima prioridad, va primero
        if (a.dias_inactivo === null && b.dias_inactivo === null) return 0;
        if (a.dias_inactivo === null) return -1;
        if (b.dias_inactivo === null) return 1;
        return b.dias_inactivo - a.dias_inactivo;
      });
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
          attributes: [
            'id',
            'pozo_id',
            'responsable_id',
            'createdAt',
            'updatedAt',
          ], // ✅ agregado
          where: rangoWhere,
          raw: true,
        }),

        Jornada.findAll({
          attributes: [
            'id',
            'cliente_id',
            'responsable_id',
            'createdAt',
            'updatedAt',
          ], // ✅ agregado
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
    const { semana, fechaInicio, fechaFin, semanaAnterior } = params;

    const { inicio, fin, label } =
      fechaInicio && fechaFin
        ? this.buildCustomRange(fechaInicio, fechaFin)
        : this.buildWeekRange(semana, semanaAnterior);

    const { inicioAnterior, finAnterior } = this.getPeriodoAnterior(
      inicio,
      fin,
    );

    const maquinas = await Maquinas.findAll({
      attributes: ['id', 'cliente_id', 'tipo_maquina'],
      include: [
        { model: MaquinaTipo, as: 'tipo', attributes: ['marca', 'modelo'] },
      ], // ✅ ampliado
      raw: true,
    });

    const pozos = await Pozo.findAll({
      attributes: ['id', 'cliente_id', 'nombre', 'establecimiento'], // ✅ ampliado
      raw: true,
    });

    const maquinasPorId = maquinas.reduce((acc, item) => {
      acc[item.id] = item.cliente_id;
      return acc;
    }, {});

    const maquinasInfoPorId = maquinas.reduce((acc, item) => {
      acc[item.id] = {
        tipo_maquina: item.tipo_maquina,
        marca: item['tipo.marca'],
        modelo: item['tipo.modelo'],
      };
      return acc;
    }, {});

    const pozosPorId = pozos.reduce((acc, item) => {
      acc[item.id] = item.cliente_id;
      return acc;
    }, {});

    const pozosInfoPorId = pozos.reduce((acc, item) => {
      acc[item.id] = {
        nombre: item.nombre,
        establecimiento: item.establecimiento,
      };
      return acc;
    }, {});

    const actividadActual = await this.obtenerActividadPeriodo(inicio, fin);

    const actividadAnterior = await this.obtenerActividadPeriodo(
      inicioAnterior,
      finAnterior,
    );

    const clientesActual = new Set();
    const clientesAnterior = new Set();

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

      if (item.responsable_id) {
        ingenierosActual.add(item.responsable_id);
        incrementarIngeniero(actividadIngenieroActual, item.responsable_id);
      }
    });

    actividadActual.jornadas.forEach((item) => {
      if (item.cliente_id) clientesActual.add(item.cliente_id);

      if (item.responsable_id) {
        ingenierosActual.add(item.responsable_id);
        incrementarIngeniero(actividadIngenieroActual, item.responsable_id);
      }
    });

    actividadActual.notas.forEach((item) => {
      if (item.cliente_id) clientesActual.add(item.cliente_id);

      if (item.usuario_id) {
        ingenierosActual.add(item.usuario_id);
        incrementarIngeniero(actividadIngenieroActual, item.usuario_id);
      }
    });

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

      if (item.responsable_id) {
        ingenierosAnterior.add(item.responsable_id);
        incrementarIngeniero(actividadIngenieroAnterior, item.responsable_id);
      }
    });

    actividadAnterior.jornadas.forEach((item) => {
      if (item.cliente_id) clientesAnterior.add(item.cliente_id);

      if (item.responsable_id) {
        ingenierosAnterior.add(item.responsable_id);
        incrementarIngeniero(actividadIngenieroAnterior, item.responsable_id);
      }
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

    // =======================================
    // ÚLTIMA ACTIVIDAD POR CLIENTE (histórico completo)
    // =======================================

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

    // =======================================
    // CLIENTES TIPO A / PRIORIDAD ALTA
    // (única fuente de verdad: dashboard usa el top 5, la hoja del PDF
    // usa la lista completa — ✅ movido acá, ya con el Map completo)
    // =======================================

    const clientesPrioridadAlta = await this.obtenerClientesPrioridadAlta(
      ultimaActividadPorCliente,
    );

    const clientesInactivos = clientesPrioridadAlta.slice(0, 5);

    const totalClientesPrioridadInactivos = clientesPrioridadAlta.filter(
      (c) => c.sin_historial || c.dias_inactivo > 30,
    ).length;

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

    // =======================================
    // ACTIVIDAD DETALLADA POR INGENIERO
    // =======================================

    const actividadDetalleIngeniero = new Map();

    const incrementarDetalleIngeniero = (ingenieroId, tipo) => {
      if (!ingenieroId) return;

      if (!actividadDetalleIngeniero.has(ingenieroId)) {
        actividadDetalleIngeniero.set(ingenieroId, {
          ingeniero_id: ingenieroId,
          calibraciones: 0,
          muestras: 0,
          jornadas: 0,
          notas: 0,
        });
      }

      const item = actividadDetalleIngeniero.get(ingenieroId);
      item[tipo] += 1;
    };

    actividadActual.calibraciones.forEach((item) => {
      incrementarDetalleIngeniero(item.responsable_id, 'calibraciones');
    });

    actividadActual.muestras.forEach((item) => {
      incrementarDetalleIngeniero(item.responsable_id, 'muestras');
    });

    actividadActual.jornadas.forEach((item) => {
      incrementarDetalleIngeniero(item.responsable_id, 'jornadas');
    });

    actividadActual.notas.forEach((item) => {
      incrementarDetalleIngeniero(item.usuario_id, 'notas');
    });

    const rankingIngenieros = [...actividadIngenieroActual.entries()]
      .map(([ingenieroId, actual]) => {
        const anterior = actividadIngenieroAnterior.get(ingenieroId) || 0;
        const usuario = ingenierosData.find((u) => u.id === ingenieroId);
        const detalle = actividadDetalleIngeniero.get(ingenieroId) || {
          calibraciones: 0,
          muestras: 0,
          jornadas: 0,
          notas: 0,
        };

        return {
          ingeniero_id: ingenieroId,
          ingeniero: usuario?.nombre || 'Sin nombre',
          calibraciones: detalle.calibraciones,
          muestras: detalle.muestras,
          jornadas: detalle.jornadas,
          notas: detalle.notas,
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

      total_clientes_inactivos: totalClientesPrioridadInactivos,
    };

    const detalleActividadIngenieros = this.construirDetalleActividadIngenieros(
      {
        actividadActual,
        maquinasPorId,
        pozosPorId,
        maquinasInfoPorId, // ✅ nuevo
        pozosInfoPorId, // ✅ nuevo
        ingenierosData,
        clientesData,
      },
    );

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

      detalle_actividad_ingenieros: detalleActividadIngenieros,
      clientes_prioridad_alta: clientesPrioridadAlta,
    };
  }
}

export default ResumenCrmService;
