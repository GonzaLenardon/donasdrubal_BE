import { Op } from 'sequelize';
import {
  Remitos,
  Warehouses,
  Clientes,
  ClienteIngenieros,
} from '../../models/index.js';

export const UMBRAL_AGRUPACION = 5;
export const MAX_FALTANTES_DETALLE = 1000;

export const parseNumeroRemito = (remitoNumber) => {
  const numero = parseInt(String(remitoNumber ?? '').replace(/\D/g, ''), 10);
  return Number.isFinite(numero) ? numero : null;
};

export const formatNumeroRemito = (numero, ancho = 8) =>
  String(numero ?? '').padStart(ancho, '0');

export const construirRunsFaltantes = (numerosFaltantes, umbral) => {
  const numeros = [...new Set(numerosFaltantes)].sort((a, b) => a - b);
  const corridas = [];

  let inicio = null;
  let previo = null;

  numeros.forEach((numero) => {
    if (inicio === null) {
      inicio = numero;
      previo = numero;
      return;
    }
    if (numero === previo + 1) {
      previo = numero;
      return;
    }
    corridas.push({
      desde: inicio,
      hasta: previo,
      cantidad: previo - inicio + 1,
    });
    inicio = numero;
    previo = numero;
  });

  if (inicio !== null) {
    corridas.push({
      desde: inicio,
      hasta: previo,
      cantidad: previo - inicio + 1,
    });
  }

  const resultado = [];

  corridas.forEach((corrida) => {
    if (corrida.cantidad > umbral) {
      resultado.push({ ...corrida, agrupado: true });
      return;
    }
    for (let numero = corrida.desde; numero <= corrida.hasta; numero += 1) {
      resultado.push({
        desde: numero,
        hasta: numero,
        cantidad: 1,
        agrupado: false,
      });
    }
  });

  return resultado;
};

export const analizarGrupo = (remitos, { agrupar = false } = {}) => {
  const items = (remitos ?? [])
    .map((remito) => ({
      ...remito,
      numero: parseNumeroRemito(remito.remito_number),
    }))
    .filter((item) => item.numero !== null)
    .sort((a, b) => a.numero - b.numero);

  const ancho =
    items.reduce(
      (acc, item) =>
        Math.max(acc, String(item.remito_number ?? '').replace(/\D/g, '').length),
      0,
    ) || 8;

  const presentes = new Set(items.map((item) => item.numero));
  const numeroMin = items.length ? items[0].numero : null;
  const numeroMax = items.length ? items[items.length - 1].numero : null;

  const faltantes = [];
  if (numeroMin !== null) {
    for (let numero = numeroMin + 1; numero <= numeroMax; numero += 1) {
      if (!presentes.has(numero)) faltantes.push(numero);
    }
  }

  const runs = agrupar
    ? construirRunsFaltantes(faltantes, UMBRAL_AGRUPACION)
    : construirRunsFaltantes(faltantes, Number.POSITIVE_INFINITY);

  const truncado = runs.length > MAX_FALTANTES_DETALLE;
  const runsVisibles = truncado ? runs.slice(0, MAX_FALTANTES_DETALLE) : runs;

  const filas = [];
  let indiceFaltante = 0;

  items.forEach((item) => {
    while (
      indiceFaltante < runsVisibles.length &&
      runsVisibles[indiceFaltante].hasta < item.numero
    ) {
      filas.push({ tipo: 'faltante', ...runsVisibles[indiceFaltante] });
      indiceFaltante += 1;
    }
    filas.push({ tipo: 'remito', numero: item.numero, remito: item });
  });

  while (indiceFaltante < runsVisibles.length) {
    filas.push({ tipo: 'faltante', ...runsVisibles[indiceFaltante] });
    indiceFaltante += 1;
  }

  return {
    items,
    ancho,
    numeroMin,
    numeroMax,
    truncado,
    totalFaltantes: faltantes.length,
    faltantes: runsVisibles.map((run) => ({
      ...run,
      desde_texto: formatNumeroRemito(run.desde, ancho),
      hasta_texto: formatNumeroRemito(run.hasta, ancho),
    })),
    filas,
  };
};

const clienteIdsDeIngeniero = async (userId) => {
  const vinculos = await ClienteIngenieros.findAll({
    where: { user_id: userId },
    attributes: ['cliente_id'],
  });
  return vinculos.map((vinculo) => vinculo.cliente_id);
};

export const obtenerRemitosFaltantes = async ({
  depositoId = null,
  ingenieroId = null,
  agrupar = false,
  user,
  esAdmin = false,
} = {}) => {
  const where = {};

  if (depositoId) {
    where.origin_warehouse_id = depositoId;
  }

  if (ingenieroId) {
    const clienteIds = await clienteIdsDeIngeniero(ingenieroId);
    const condiciones = [{ created_by: ingenieroId }];
    if (clienteIds.length) {
      condiciones.push({ destination_client_id: { [Op.in]: clienteIds } });
    }
    where[Op.or] = condiciones;
  }

  let scope = 'COMPLETO';

  if (!esAdmin) {
    scope = 'PARCIAL';
    const clienteIds = user?.id ? await clienteIdsDeIngeniero(user.id) : [];
    where.destination_client_id = { [Op.in]: clienteIds };
    if (!clienteIds.length) {
      return {
        scope,
        modo: agrupar ? 'agrupados' : 'detalle',
        umbral_agrupacion: agrupar ? UMBRAL_AGRUPACION : null,
        filtros: { deposito_id: depositoId, ingeniero_id: ingenieroId },
        resumen: {
          total_remitos: 0,
          total_faltantes: 0,
          depositos_con_faltantes: 0,
          total_depositos: 0,
        },
        grupos: [],
      };
    }
  }

  const remitos = await Remitos.findAll({
    where,
    attributes: [
      'id',
      'remito_number',
      'type',
      'status',
      'origin_warehouse_id',
      'destination_client_id',
      'created_by',
      'createdAt',
    ],
    include: [
      {
        model: Warehouses,
        as: 'depositoOrigen',
        attributes: ['id', 'nombre', 'codigo'],
      },
      {
        model: Clientes,
        as: 'cliente',
        attributes: ['id', 'razon_social'],
      },
    ],
    order: [['origin_warehouse_id', 'ASC'], ['remito_number', 'ASC']],
  });

  const porDeposito = new Map();

  remitos.forEach((remito) => {
    const id = remito.origin_warehouse_id;
    if (!porDeposito.has(id)) porDeposito.set(id, []);
    porDeposito.get(id).push(remito);
  });

  const grupos = [...porDeposito.entries()].map(([depositoIdGrupo, lista]) => {
    const analisis = analizarGrupo(lista, { agrupar });
    const deposito = lista[0]?.depositoOrigen ?? null;

    return {
      deposito_id: depositoIdGrupo,
      deposito: deposito
        ? {
            id: deposito.id,
            nombre: deposito.nombre,
            codigo: deposito.codigo,
          }
        : null,
      total_remitos: analisis.items.length,
      total_faltantes: analisis.totalFaltantes,
      truncado: analisis.truncado,
      numeracion_min:
        analisis.numeroMin !== null
          ? formatNumeroRemito(analisis.numeroMin, analisis.ancho)
          : null,
      numeracion_max:
        analisis.numeroMax !== null
          ? formatNumeroRemito(analisis.numeroMax, analisis.ancho)
          : null,
      siguiente_numero:
        analisis.numeroMax !== null
          ? formatNumeroRemito(analisis.numeroMax + 1, analisis.ancho)
          : null,
      ancho: analisis.ancho,
      faltantes: analisis.faltantes,
      remitos: analisis.items.map((item) => ({
        id: item.id,
        remito_number: item.remito_number,
        type: item.type,
        status: item.status,
        createdAt: item.createdAt,
        cliente_id: item.destination_client_id,
        cliente: item.cliente?.razon_social ?? null,
      })),
      filas: analisis.filas.map((fila) => {
        if (fila.tipo === 'faltante') {
          return {
            tipo: 'faltante',
            desde: fila.desde,
            hasta: fila.hasta,
            cantidad: fila.cantidad,
            agrupado: fila.agrupado,
            desde_texto: formatNumeroRemito(fila.desde, analisis.ancho),
            hasta_texto: formatNumeroRemito(fila.hasta, analisis.ancho),
          };
        }
        return {
          tipo: 'remito',
          id: fila.remito.id,
          numero: fila.numero,
          remito_number: fila.remito.remito_number,
          type: fila.remito.type,
          status: fila.remito.status,
          createdAt: fila.remito.createdAt,
          cliente_id: fila.remito.destination_client_id,
          cliente: fila.remito.cliente?.razon_social ?? null,
        };
      }),
    };
  });

  return {
    scope,
    modo: agrupar ? 'agrupados' : 'detalle',
    umbral_agrupacion: agrupar ? UMBRAL_AGRUPACION : null,
    filtros: { deposito_id: depositoId, ingeniero_id: ingenieroId },
    resumen: {
      total_remitos: remitos.length,
      total_faltantes: grupos.reduce(
        (acc, grupo) => acc + grupo.total_faltantes,
        0,
      ),
      depositos_con_faltantes: grupos.filter(
        (grupo) => grupo.total_faltantes > 0,
      ).length,
      total_depositos: grupos.length,
    },
    grupos,
  };
};
