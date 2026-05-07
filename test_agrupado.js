import { Sequelize } from 'sequelize';
import './src/models/index.js'; // Importar para definir asociaciones
import db from './src/config/database.js';
import Calibracion from './src/models/calibraciones.js';
import Maquinas from './src/models/maquinas.js';
import MuestraAgua from './src/models/muestra_agua.js';
import Pozo from './src/models/pozo.js';

async function test() {
  try {
    console.log('=== CALIBRACIONES AGRUPADAS ===');
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
              "CASE WHEN Calibraciones.estado = 'PROCESO' THEN 1 ELSE 0 END",
            ),
          ),
          'proceso',
        ],
      ],
      include: [
        {
          model: Maquinas,
          as: 'maquina',
          attributes: [],
        },
      ],
      group: ['maquina.cliente_id'],
      raw: true,
    });
    console.log('Resultado:', calibraciones);

    console.log('\n=== MUESTRAS AGRUPADAS ===');
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
              "CASE WHEN MuestraAgua.estado = 'PROCESO' THEN 1 ELSE 0 END",
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
    console.log('Resultado:', muestras);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

test();
