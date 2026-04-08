import { Op, fn, col } from 'sequelize';
import Pozo from '../models/pozo.js';
import Maquina from '../models/maquinas.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import Calibracion from '../models/calibraciones.js';
import Jornada from '../models/jornada.js';
import MuestraAgua from '../models/muestra_agua.js';
import Alertas, { ENTIDAD_TIPOS } from '../models/alertas.js';
import Clientes from '../models/clientes.js';
import Users from '../models/users.js';

export const getUserServices = async (req, res) => {
  try {
    const { clientes_ids } = req.body;

    const [totalCalibraciones, totalMuestras, totalJornadas] =
      await Promise.all([
        Calibracion.count({
          include: [
            {
              model: Maquina,
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

      Maquina.count({
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
          model: Maquina,
          as: 'maquinas',
          include: [
            {
              model: Calibracion,
              as: 'calibracionesmaquina',
            },
          ],
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
};
