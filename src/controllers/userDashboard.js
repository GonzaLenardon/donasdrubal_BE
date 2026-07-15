import { Op, fn, col, Sequelize } from 'sequelize';
import Pozo from '../models/pozo.js';
import Maquinas from '../models/maquinas.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import Calibracion from '../models/calibraciones.js';
import Jornada from '../models/jornada.js';
import MuestraAgua from '../models/muestra_agua.js';
import Alertas, { ENTIDAD_TIPOS } from '../models/alertas.js';
import Clientes from '../models/clientes.js';
import ClienteIngenieros from '../models/clientesIngenieros.js';
import Users from '../models/users.js';
import TipoClientes from '../models/tipoClientes.js';

export const getUserServices = async (req, res) => {
  try {
    const { clientes_ids } = req.body;

    const [totalCalibraciones, totalMuestras, totalJornadas] =
      await Promise.all([
        Calibracion.count({
          include: [
            {
              model: Maquinas,
              as: 'maquina',
              where: {
                cliente_id: {
                  [Op.in]: clientes_ids,
                },
              },
              attributes: [],
            },
          ],
        }),

        MuestraAgua.count({
          include: [
            {
              model: Pozo,
              as: 'pozo',
              where: {
                cliente_id: {
                  [Op.in]: clientes_ids,
                },
              },
              attributes: [],
            },
          ],
        }),

        Jornada.count({
          where: {
            cliente_id: {
              [Op.in]: clientes_ids,
            },
          },
        }),
      ]);

    const data = {
      data: [
        { name: 'Calibración', value: totalCalibraciones, color: '#3b82f6' },
        { name: 'Análisis Agua', value: totalMuestras, color: '#f59e0b' },
        { name: 'Capacitación', value: totalJornadas, color: '#10b981' },
      ],
      total: totalCalibraciones + totalMuestras + totalJornadas,
    };

    return res.status(200).json({
      message: 'Estadísticas obtenidas correctamente',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: error.message,
    });
  }
};

export const getUserMachine = async (req, res) => {
  try {
    const { clientes_ids } = req.body;

    const [totalPozos, totalMaquinas] = await Promise.all([
      Pozo.count({
        where: {
          cliente_id: {
            [Op.in]: clientes_ids,
          },
        },
      }),

      Maquinas.count({
        where: {
          cliente_id: {
            [Op.in]: clientes_ids,
          },
        },
      }),
    ]);

    const data = {
      data: [
        { name: 'Pozos', value: totalPozos, color: '#3b82f6' },
        { name: 'Máquinas', value: totalMaquinas, color: '#f59e0b' },
      ],
      total: totalPozos + totalMaquinas,
    };

    return res.status(200).json({
      message: 'Estadísticas obtenidas correctamente',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener estadísticas',
      error: error.message,
    });
  }
};
/* 
export const allServicesToClients = async (req, res) => {
  try {
    const { clientes_ids } = req.body;

    const all = await Clientes.findAll({
      where: {
        id: { [Op.in]: clientes_ids },
      },
      include: [
        {
          model: Pozo,
          as: 'pozos',
          include: [
            {
              model: MuestraAgua,
              as: 'muestrasAgua',
            },
          ],
        },
        {
          model: Maquinas,
          as: 'maquinas',
          include: [
            {
              model: Calibracion,
              as: 'calibracionesmaquina',
            },
          ],
        },

        {
          model: Jornada,
          as: 'jornadas',
        },
      ],
    });

    return res.status(200).json({
      message: 'Servicios obtenidos correctamente',
      data: all,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al obtener servicios',
      error: error.message,
    });
  }
}; */

export const allServicesToClients = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;

    let clientesIds = [];

    // ───────────────────────────────
    // 1️⃣ Permisos 
    // ───────────────────────────────

    if (rol === 'Administrador') {
      const clientes = await Clientes.findAll({
        attributes: ['id'],
        raw: true,
      });

      clientesIds = clientes.map((c) => c.id);
    } else if (rol === 'Ingeniero') {
      const relaciones = await ClienteIngenieros.findAll({
        where: { user_id: userId },
        attributes: ['cliente_id'],
        raw: true,
      });

      clientesIds = relaciones.map((r) => r.cliente_id);
    } else {
      return res.status(403).json({
        message: 'No tienes permisos',
      });
    }

    if (clientesIds.length === 0) {
      return res.status(200).json({
        message: 'Sin clientes asignados',
        data: [],
      });
    }

    // ───────────────────────────────
    // 2️⃣ Datos básicos cliente
    // ───────────────────────────────
const clientes = await Clientes.findAll({
  where: {
    id: {
      [Op.in]: clientesIds,
    },
  },
  attributes: [
    'id',
    'razon_social',
    'cuil_cuit',
    'telefono',
    'direccion_fiscal',
    'ciudad',
    'provincia',
    'litros_estimados',
    'tipo_cliente_id',
  ],
  include: [
    {
      model: Users,
      as: 'ingenieros',
      attributes: ['id', 'nombre', 'email'],
      through: {
        attributes: ['es_principal'],
      },
    },
    {
      model: TipoClientes,
      as: 'tipoCliente',
      attributes: ['id', 'tipoClientes'], // campo que identifica A/B/C
      required: false,
    },    
  ],
});
    // const clientes = await Clientes.findAll({
    //   where: { id: { [Op.in]: clientesIds } },
    //   attributes: [
    //     'id',
    //     'razon_social',
    //     'cuil_cuit',
    //     'telefono',
    //     'direccion_fiscal',
    //     'ciudad',
    //     'provincia',
    //     'litros_estimados',
    //   ],
    //   raw: true,
    // });

    const clientesMap = {};

clientes.forEach((cliente) => {
  clientesMap[cliente.id] = {
    id: cliente.id,
    razon_social: cliente.razon_social,
    cuit: cliente.cuil_cuit,
    telefono: cliente.telefono,
    direccion: cliente.direccion_fiscal,
    ciudad: cliente.ciudad,
    provincia: cliente.provincia,
    litros_estimados: cliente.litros_estimados,
    tipo_cliente_id: cliente.tipo_cliente_id,
    tipo_cliente: cliente.tipoCliente
      ? {
          id: cliente.tipoCliente.id,
          nombre: cliente.tipoCliente.tipoClientes,
        }
      : null,
    ingenieros: cliente.ingenieros.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      email: i.email,
      es_principal: i.ClienteIngenieros?.es_principal ?? false,
    })),

    Maquinas: {
      totalMaquinas: 0,
      totalCalibraciones: 0,
      calibracionesPendientes: 0,
      calibracionesCerradas: 0,
      calibracionesProceso: 0,
    },
    Pozos: {
      totalPozos: 0,
      totalMuestras: 0,
      muestrasPendientes: 0,
      muestrasCerradas: 0,
      muestrasProceso: 0,
    },
    Jornadas: {
      totalJornadas: 0,
      jornadasPendientes: 0,
      jornadasCerradas: 0,
      jornadasProceso: 0,
    },
  };
});

    // ───────────────────────────────
    // 3️⃣ MAQUINAS
    // ───────────────────────────────

    const maquinas = await Maquinas.findAll({
      attributes: [
        'cliente_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      ],
      where: { cliente_id: { [Op.in]: clientesIds } },
      group: ['cliente_id'],
      raw: true,
    });

    console.log(
      '..............................................................................................',
    );
    console.log('maq', maquinas);

    maquinas.forEach((m) => {
      clientesMap[m.cliente_id].Maquinas.totalMaquinas = Number(m.total);
    });

    // ───────────────────────────────
    // 4️⃣ CALIBRACIONES
    // ───────────────────────────────

    const calibraciones = await Calibracion.findAll({
      attributes: [
        [Sequelize.col('maquina.cliente_id'), 'cliente_id'],
        [Sequelize.fn('COUNT', Sequelize.col('Calibraciones.id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Calibraciones.estado = 'PENDIENTE' THEN 1 ELSE 0 END",
            ),
          ),
          'pendientes',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Calibraciones.estado = 'CERRADO' THEN 1 ELSE 0 END",
            ),
          ),
          'cerradas',
        ],

        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Calibraciones.estado = 'EN PROCESO' THEN 1 ELSE 0 END",
            ),
          ),
          'proceso',
        ],
      ],
      include: [
        {
          model: Maquinas,
          as: 'maquina', // ✅ CORRECTO
          attributes: [],
        },
      ],
      group: ['maquina.cliente_id'],
      raw: true,
    });

    calibraciones.forEach((c) => {
      console.log('Calibraciones ... ', c);
      const clienteId = c.cliente_id;
      if (clientesMap[clienteId]) {
        clientesMap[clienteId].Maquinas.totalCalibraciones = Number(c.total);
        clientesMap[clienteId].Maquinas.calibracionesPendientes = Number(
          c.pendientes,
        );
        clientesMap[clienteId].Maquinas.calibracionesCerradas = Number(
          c.cerradas,
        );
        clientesMap[clienteId].Maquinas.calibracionesProceso = Number(
          c.proceso,
        );
      }
    });

    // ───────────────────────────────
    // 5️⃣ POZOS
    // ───────────────────────────────

    const pozos = await Pozo.findAll({
      attributes: [
        'cliente_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
      ],
      where: { cliente_id: { [Op.in]: clientesIds } },
      group: ['cliente_id'],
      raw: true,
    });

    pozos.forEach((p) => {
      clientesMap[p.cliente_id].Pozos.totalPozos = Number(p.total);
    });

    // ───────────────────────────────
    // 6️⃣ MUESTRAS
    // ───────────────────────────────

    const muestras = await MuestraAgua.findAll({
      attributes: [
        [Sequelize.col('pozo.cliente_id'), 'cliente_id'],
        [Sequelize.fn('COUNT', Sequelize.col('MuestraAgua.id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN MuestraAgua.estado = 'PENDIENTE' THEN 1 ELSE 0 END",
            ),
          ),
          'pendientes',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN MuestraAgua.estado = 'CERRADO' THEN 1 ELSE 0 END",
            ),
          ),
          'cerradas',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN MuestraAgua.estado = 'EN PROCESO' THEN 1 ELSE 0 END",
            ),
          ),
          'proceso',
        ],
      ],
      include: [
        {
          model: Pozo,
          as: 'pozo',
          attributes: [],
        },
      ],
      group: ['pozo.cliente_id'],
      raw: true,
    });

    muestras.forEach((m) => {
      const clienteId = m.cliente_id;
      if (clientesMap[clienteId]) {
        clientesMap[clienteId].Pozos.totalMuestras = Number(m.total);
        clientesMap[clienteId].Pozos.muestrasPendientes = Number(m.pendientes);
        clientesMap[clienteId].Pozos.muestrasCerradas = Number(m.cerradas);
        clientesMap[clienteId].Pozos.muestrasProceso = Number(m.proceso);
      }
    });

    // ───────────────────────────────
    // 7️⃣ JORNADAS
    // ───────────────────────────────

    const jornadas = await Jornada.findAll({
      attributes: [
        'cliente_id',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END",
            ),
          ),
          'pendientes',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal("CASE WHEN estado = 'CERRADO' THEN 1 ELSE 0 END"),
          ),
          'cerradas',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN estado = 'EN PROCESO' THEN 1 ELSE 0 END",
            ),
          ),
          'proceso',
        ],
      ],
      where: { cliente_id: { [Op.in]: clientesIds } },
      group: ['cliente_id'],
      raw: true,
    });

    jornadas.forEach((j) => {
      clientesMap[j.cliente_id].Jornadas.totalJornadas = Number(j.total);
      clientesMap[j.cliente_id].Jornadas.jornadasPendientes = Number(
        j.pendientes,
      );
      clientesMap[j.cliente_id].Jornadas.jornadasCerradas = Number(j.cerradas);
      clientesMap[j.cliente_id].Jornadas.jornadasProceso = Number(j.proceso);
    });

    // ───────────────────────────────
    // RESPUESTA
    // ───────────────────────────────

    return res.status(200).json({
      message: 'Servicios totalizados correctamente',
      data: Object.values(clientesMap),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al obtener servicios',
      error: error.message,
    });
  }
};

export const getDashboardTotals = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;

    let clientesIds = [];

    // ───────────────────────────────
    // 1️⃣ FILTRO POR ROL
    // ───────────────────────────────

    if (rol === 'Administrador') {
      const clientes = await Clientes.findAll({
        attributes: ['id'],
        raw: true,
      });
      clientesIds = clientes.map((c) => c.id);
    } else if (rol === 'Ingeniero') {
      const relaciones = await ClienteIngenieros.findAll({
        where: { user_id: userId },
        attributes: ['cliente_id'],
        raw: true,
      });
      clientesIds = relaciones.map((r) => r.cliente_id);
    } else {
      return res.status(403).json({ message: 'No tienes permisos' });
    }

    if (!clientesIds.length) {
      return res.status(200).json({
        message: 'Sin clientes asignados',
        data: {},
      });
    }

    // ───────────────────────────────
    // 2️⃣ CLIENTES
    // ───────────────────────────────

    const totalClientes = clientesIds.length;

    // ───────────────────────────────
    // 3️⃣ MAQUINAS
    // ───────────────────────────────

    const totalMaquinas = await Maquinas.count({
      where: { cliente_id: clientesIds },
    });

    // ───────────────────────────────
    // 4️⃣ CALIBRACIONES
    // ───────────────────────────────

    const calibraciones = await Calibracion.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('Calibraciones.id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Calibraciones.estado = 'PENDIENTE' THEN 1 ELSE 0 END",
            ),
          ),
          'pendientes',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Calibraciones.estado = 'EN PROCESO' THEN 1 ELSE 0 END",
            ),
          ),
          'proceso',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Calibraciones.estado = 'CERRADO' THEN 1 ELSE 0 END",
            ),
          ),
          'cerradas',
        ],
      ],
      include: [
        {
          model: Maquinas,
          as: 'maquina',
          attributes: [],
          where: { cliente_id: clientesIds },
        },
      ],
      raw: true,
    });

    // ───────────────────────────────
    // 5️⃣ POZOS
    // ───────────────────────────────

    const totalPozos = await Pozo.count({
      where: { cliente_id: clientesIds },
    });

    // ───────────────────────────────
    // 6️⃣ MUESTRAS
    // ───────────────────────────────

    const muestras = await MuestraAgua.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('MuestraAgua.id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN MuestraAgua.estado = 'PENDIENTE' THEN 1 ELSE 0 END",
            ),
          ),
          'pendientes',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN MuestraAgua.estado = 'EN PROCESO' THEN 1 ELSE 0 END",
            ),
          ),
          'proceso',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN MuestraAgua.estado = 'CERRADO' THEN 1 ELSE 0 END",
            ),
          ),
          'cerradas',
        ],
      ],
      include: [
        {
          model: Pozo,
          as: 'pozo',
          attributes: [],
          where: { cliente_id: clientesIds },
        },
      ],
      raw: true,
    });

    // ───────────────────────────────
    // 7️⃣ JORNADAS
    // ───────────────────────────────

    const jornadas = await Jornada.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('Jornada.id')), 'total'],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Jornada.estado = 'PENDIENTE' THEN 1 ELSE 0 END",
            ),
          ),
          'pendientes',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Jornada.estado = 'EN PROCESO' THEN 1 ELSE 0 END",
            ),
          ),
          'proceso',
        ],
        [
          Sequelize.fn(
            'SUM',
            Sequelize.literal(
              "CASE WHEN Jornada.estado = 'CERRADO' THEN 1 ELSE 0 END",
            ),
          ),
          'cerradas',
        ],
      ],
      where: { cliente_id: clientesIds },
      raw: true,
    });

    // ───────────────────────────────
    // 8️⃣ RESPUESTA FINAL
    // ───────────────────────────────

    return res.status(200).json({
      message: 'Dashboard global obtenido correctamente',
      data: {
        totalClientes,

        Maquinas: {
          totalMaquinas: Number(totalMaquinas),
          totalCalibraciones: Number(calibraciones[0]?.total || 0),
          pendientes: Number(calibraciones[0]?.pendientes || 0),
          proceso: Number(calibraciones[0]?.proceso || 0),
          cerradas: Number(calibraciones[0]?.cerradas || 0),
        },

        Pozos: {
          totalPozos: Number(totalPozos),
          totalMuestras: Number(muestras[0]?.total || 0),
          pendientes: Number(muestras[0]?.pendientes || 0),
          proceso: Number(muestras[0]?.proceso || 0),
          cerradas: Number(muestras[0]?.cerradas || 0),
        },

        Jornadas: {
          totalJornadas: Number(jornadas[0]?.total || 0),
          pendientes: Number(jornadas[0]?.pendientes || 0),
          proceso: Number(jornadas[0]?.proceso || 0),
          cerradas: Number(jornadas[0]?.cerradas || 0),
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al obtener dashboard',
      error: error.message,
    });
  }
};
