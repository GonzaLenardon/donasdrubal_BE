// controllers/dashboardController.js
import { Op, fn, col } from 'sequelize';
import Pozo from '../models/pozo.js';
import Maquina from '../models/maquinas.js';
import Calibracion from '../models/calibraciones.js';
import Jornada from '../models/jornada.js';
import MuestraAgua from '../models/muestra_agua.js';

export const getClienteStats = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    if (!cliente_id) {
      return res.status(400).json({ error: 'cliente_id requerido' });
    }

    const hoy = new Date();
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
    const en15Dias = new Date();
    en15Dias.setDate(hoy.getDate() + 15);

    /*
    =====================================================
    1️⃣ POZOS
    =====================================================
    */

    const totalPozos = await Pozo.count({
      where: { cliente_id }
    });

    const nuevosPozos = await Pozo.count({
      where: {
        cliente_id,
        createdAt: {
          [Op.gte]: inicioAnio
        }
      }
    });

    /*
    =====================================================
    2️⃣ MAQUINAS
    =====================================================
    */

    const totalMaquinas = await Maquina.count({
      where: { cliente_id }
    });

    /*
    =====================================================
    3️⃣ MAQUINAS CALIBRADAS
    (JOIN Calibraciones -> Maquinas)
    =====================================================
    */

    const maquinasCalibradas = await Calibracion.count({
      distinct: true,
      col: 'maquina_id',
      include: [{
        model: Maquina,
        as: 'maquina',
        where: { cliente_id },
        attributes: []
      }]
    });

    const porcentajeCalibradas =
      totalMaquinas > 0
        ? Math.round((maquinasCalibradas / totalMaquinas) * 100)
        : 0;

    /*
    =====================================================
    4️⃣ SERVICIOS PROXIMOS 15 DIAS
    =====================================================
    */

    // Calibraciones próximas
    const calibracionesProximas = await Calibracion.count({
      include: [{
        model: Maquina,
        as: 'maquina',
        where: { cliente_id },
        attributes: []
      }],
      where: {
        // fecha: {
        //   [Op.between]: [hoy, en15Dias]
        // }
        estado: 'PENDIENTE'
      }
    });

    // Muestras de agua próximas
    const muestrasProximas = await MuestraAgua.count({
      include: [{
        model: Pozo,
        as: 'pozo',
        where: { cliente_id },
        attributes: []
      }],
      where: {
        // fecha_programada: {
        //   [Op.between]: [hoy, en15Dias]
        // }
        estado: 'PENDIENTE'
      }
    });

    const totalServiciosPendientes =
      calibracionesProximas + muestrasProximas;

    /*
    =====================================================
    5️⃣ JORNADAS
    (Asumo que Jornada sí tiene cliente_id)
    =====================================================
    */

    const totalJornadas = await Jornada.count({
      where: { cliente_id }
    });

    // const personasCapacitadas = await Jornada.sum(
    //   'cantidad_personas',
    //   { where: { cliente_id } }
    // ) || 0;

    /*
    =====================================================
    RESPONSE FINAL
    =====================================================
    */

    res.json({
      pozos: {
        total: totalPozos,
        nuevos: nuevosPozos,
        periodo: 'este año'
      },
      maquinas: {
        total: totalMaquinas,
        calibradas: maquinasCalibradas,
        porcentaje: porcentajeCalibradas
      },
      serviciosPendientes: {
        total: totalServiciosPendientes,
        proximos15dias: totalServiciosPendientes
      },
      jornadas: {
        total: totalJornadas,
        personasCapacitadas: 14 // personasCapacitadas
      }
    });

  } catch (error) {
    console.error('Error en getClienteStats:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      detalle: error.message
    });
  }
};





export const getClienteServicesChart = async (req, res) => {
  // Agregaciones específicas para gráfico
  return {
    data: [
      { name: 'Calibración', value: 8, color: '#3b82f6' },
      { name: 'Análisis Agua', value: 6, color: '#f59e0b' },
      { name: 'Capacitación', value: 4, color: '#10b981' }
    ],
    total: 18
  };
};

export const getClienteMachinesChart = async (req, res) => {
  // Agregaciones específicas para gráfico
  return {
    data: [
      { name: 'Al día', value: 4, color: '#10b981' },
      { name: 'Próximo', value: 1, color: '#f59e0b' },
      { name: 'Vencido', value: 0, color: '#ef4444' }
    ],
    total: 5
  };
};

export const getClienteUpcomingServices = async (req, res) => {
  // Queries de servicios próximos
return {
    calibracion: [
      {
        id: 1,
        maquina: 'Pulverizadora Jacto PJ-600',
        tipo: 'Calibración anual programada',
        fecha: '2024-07-25',
        estado: 'Confirmado',
        tipoMaquina: 'Autopropulsada'
      },
      {
        id: 2,
        maquina: 'Pulverizadora Montana X-12',
        tipo: 'Recalibración por cambio de picos',
        fecha: '2024-08-02',
        estado: 'Pendiente',
        tipoMaquina: 'Arrastre'
      },
      {
        id: 3,
        maquina: 'Equipo de Mochila Stihl',
        tipo: 'Calibración de presión',
        fecha: '2024-06-15',
        estado: 'Realizado',
        tipoMaquina: 'Mochila'
      }
    ],
    otros: [
      {
        id: 4,
        nombre: 'Pozo Norte - Lote 42',
        tipo: 'Análisis fisicoquímico completo',
        fecha: '2024-07-28',
        estado: 'Confirmado',
        categoria: 'analisis'
      },
      {
        id: 5,
        nombre: 'Jornada: Aplicación Eficiente',
        tipo: 'Capacitación de 8 operarios',
        fecha: '2024-08-05',
        estado: 'Pendiente',
        categoria: 'capacitacion'
      },
      {
        id: 6,
        nombre: 'Pozo Sur - Lote 18',
        tipo: 'Análisis de pH y dureza',
        fecha: '2024-06-10',
        estado: 'Realizado',
        categoria: 'analisis'
      }
    ]
  };  
};