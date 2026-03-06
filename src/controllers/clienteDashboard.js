// controllers/dashboardController.js
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
      where: {
        estado: 'COMPLETADO'
      },
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

    const jornadasProximas = await Jornada.count({
      where: {
        cliente_id, 
        // fecha_jornada: {
        //   [Op.between]: [hoy, en15Dias]
        // }
        estado: 'PENDIENTE'
      }
    });

    const totalServiciosPendientes =
      calibracionesProximas + muestrasProximas +  jornadasProximas;

    /*
    =====================================================
    5️⃣ JORNADAS
    (Asumo que Jornada sí tiene cliente_id)
    =====================================================
    */

    const totalJornadas = await Jornada.count({
      where: { cliente_id }
    });

    const nuevasJornadas = await Jornada.count({
      where: {
        cliente_id,
        createdAt: {
          [Op.gte]: inicioAnio
        }
      }
    });
    /*
    =====================================================
    RESPONSE FINAL
    =====================================================
    */

    const data = {
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
        nuevos: nuevasJornadas,
        periodo: 'este año'
      }
    }
    return res.status(200).json({
      message: 'Estadísticas del cliente obtenidas correctamente',
      payload: data,
      });

  } catch (error) {
    console.error('Error en getClienteStats:', error);
    return res.status(500).json({
      error: 'Error al obtener estadísticas',
      detalle: error.message
    });
  }
};





export const getClienteServicesChart = async (req, res) => {
  // Agregaciones específicas para gráfico
  const cliente_id = req.params.cliente_id;
  const [totalCalibarciones, totalMuestras, totalJornadas] = await Promise.all([
    Calibracion.count({
      include: [{
        model: Maquina,
        as: 'maquina',
        where: { cliente_id },
        attributes: []
      }]
    }),
    MuestraAgua.count({
      include: [{
        model: Pozo,
        as: 'pozo',
        where: { cliente_id },
        attributes: []
      }]
    }),
    Jornada.count({
      where: { cliente_id }
    })
  ]);

  const data = {
    data: [
      { name: 'Calibración', value: totalCalibarciones, color: '#3b82f6' },
      { name: 'Análisis Agua', value: totalMuestras, color: '#f59e0b' },
      { name: 'Capacitación', value: totalJornadas, color: '#10b981' }
    ],
    total: totalCalibarciones + totalMuestras + totalJornadas
  }
  return res.status(200).json({
      message: 'Estadísticas del cliente obtenidas correctamente',
      payload: data,
    });
};

export const getClienteMachinesChart = async (req, res) => {
  // Agregaciones específicas para gráfico
  const data = {
    data: [
      { name: 'Al día', value: 4, color: '#10b981' },
      { name: 'Próximo', value: 1, color: '#f59e0b' },
      { name: 'Vencido', value: 0, color: '#ef4444' }
    ],
    total: 5
  };
    return res.status(200).json({
      message: 'Estadísticas del cliente obtenidas correctamente',
      payload: data,
    });
};

export const getClienteUpcomingServices = async (req, res) => {
  try {
    const { cliente_id } = req.params;

    // 1. Obtener el cliente con su usuario asociado
    const cliente = await Clientes.findByPk(cliente_id, {
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id']
      }]
    });

    if (!cliente) {
      return res.status(404).json({
        message: 'Cliente no encontrado',
        payload: null
      });
    }

    const usuarioId = cliente.user?.id;

    if (!usuarioId) {
      return res.status(404).json({
        message: 'El cliente no tiene un usuario asociado',
        payload: null
      });
    }

    // 2. Obtener todas las alertas activas para este usuario
    const alertas = await Alertas.findAll({
      where: {
        usuario_to_id: usuarioId,
        estado: {
          [Op.in]: ['PENDIENTE', 'ACTIVA', 'ALERTADO']
        },
        entidad_tipo: {
          [Op.in]: [ENTIDAD_TIPOS.CALIBRACION, ENTIDAD_TIPOS.MUESTRA_AGUA, ENTIDAD_TIPOS.JORNADA]
        }
      },
      attributes: ['id', 'entidad_tipo', 'entidad_id', 'titulo', 'prioridad', 'fecha_vencimiento', 'fecha_alerta'],
      order: [['fecha_vencimiento', 'ASC']],
      raw: true
    });
    console.log('Alertas obtenidas:', alertas);

    // 3. Separar IDs por tipo de entidad
    const calibracionIds = alertas
      .filter(a => a.entidad_tipo === ENTIDAD_TIPOS.CALIBRACION)
      .map(a => a.entidad_id);
      
    const muestraIds = alertas                                      // vector de Ids alertas filtrado por tipo muestra_agua, luego mapeado a un vector de ids de muestras de agua
      .filter(a => a.entidad_tipo === ENTIDAD_TIPOS.MUESTRA_AGUA)
      .map(a => a.entidad_id);
      
    const jornadaIds = alertas
      .filter(a => a.entidad_tipo === ENTIDAD_TIPOS.JORNADA)
      .map(a => a.entidad_id);
console.log('IDs de calibraciones:', calibracionIds);
console.log('IDs de muestras de agua:', muestraIds);
console.log('IDs de jornadas:', jornadaIds);    
    // 4. Obtener todos los detalles en paralelo con sus relaciones
    const [calibraciones, muestras, jornadas] = await Promise.all([
      calibracionIds.length > 0 
        ? Calibracion.findAll({
            where: { id: calibracionIds },
            include: [{
              model: Maquina,
              as: 'maquina',
              include: [
                { model: MaquinaTipo, as: 'tipo' },
                { model: Clientes, as: 'cliente' }
              ]
            }],
            
            raw: true,
            nest: true
          })
        : [],
      
      muestraIds.length > 0 
        ? MuestraAgua.findAll({
            where: { id: muestraIds },
            include: [{
              model: Pozo,
              as: 'pozo',
              attributes: ['id', 'nombre', 'establecimiento']
            }],
            raw: true,
            nest: true
          })
        : [],
      
      jornadaIds.length > 0 
        ? Jornada.findAll({
            where: { id: jornadaIds },
            raw: true
          })
        : []
    ]);
    console.log('Calibraciones obtenidas:', calibraciones);
    console.log('Muestras de agua obtenidas:', muestras);
    console.log('Jornadas obtenidas:', jornadas);
    // 5. Crear mapas para acceso rápido
    const calibracionesMap = new Map(calibraciones.map(c => [c.id, c]));
    const muestrasMap = new Map(muestras.map(m => [m.id, m]));
    const jornadasMap = new Map(jornadas.map(j => [j.id, j]));

    // 6. Construir respuesta
    const data = {
      calibracion: [],
      muestras_agua: [],
      jornadas: [], // Agregamos jornadas por si las necesitas
      otros:[]
    };

    alertas.forEach(alerta => {
      if (alerta.entidad_tipo === ENTIDAD_TIPOS.CALIBRACION) {
        const cal = calibracionesMap.get(alerta.entidad_id);
        if (cal) {
          data.calibracion.push({
            id: cal.id,
            maquina: cal.maquina?.nombre || 'Sin máquina',
            tipo: alerta.titulo,
            fecha: cal.fecha,
            estado: cal.estado,
            tipoMaquina: cal.maquina?.tipo.tipo || 'No especificado',
            marca: cal.maquina?.tipo.marca,
            modelo: cal.maquina?.tipo.modelo,
            alerta_id: alerta.id,
            prioridad: alerta.prioridad,
            fecha_vencimiento: alerta.fecha_vencimiento,
            fecha_alerta: alerta.fecha_alerta
          });
        }
      } 
      else if (alerta.entidad_tipo === ENTIDAD_TIPOS.MUESTRA_AGUA) {
        const muestra = muestrasMap.get(alerta.entidad_id);
        if (muestra) {
          data.muestras_agua.push({
            id: muestra.id,
            nombre: muestra.pozo?.nombre || 'Pozo sin nombre',
            tipo: alerta.titulo,
            fecha: muestra.fecha_muestra,
            estado: muestra.estado,
            categoria: 'analisis',
            pozo_id: muestra.pozo_id,
            pozo_ubicacion: muestra.pozo?.ubicacion,
            alerta_id: alerta.id,
            prioridad: alerta.prioridad,
            fecha_vencimiento: alerta.fecha_vencimiento,
            parametros: {
              ph: muestra.ph,
              dureza: muestra.dureza,
              alcalinidad: muestra.alcalinidad,
              salinidad: muestra.salinidad
            }
          });
        }
      }
      else if (alerta.entidad_tipo === ENTIDAD_TIPOS.JORNADA) {
        const jornada = jornadasMap.get(alerta.entidad_id);
        if (jornada) {
          data.jornadas.push({
            id: jornada.id,
            nombre: jornada.motivo,
            tipo: alerta.titulo,
            fecha: jornada.fecha_jornada,
            estado: jornada.estado,
            observaciones: jornada.observaciones,
            alerta_id: alerta.id,
            prioridad: alerta.prioridad,
            fecha_vencimiento: alerta.fecha_vencimiento
          });
        }
      }
    });

    // 7. Ordenar por fecha
    data.calibracion.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    data.muestras_agua.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    data.jornadas.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    return res.status(200).json({
      message: 'Servicios pendientes obtenidos correctamente',
      payload: data
    });

  } catch (error) {
    console.error('Error al obtener servicios pendientes:', error);
    return res.status(500).json({
      message: 'Error al obtener servicios pendientes',
      payload: null,
      error: error.message
    });
  }
};

export const getClienteUpcomingServicesMock = async (req, res) => {
  // Queries de servicios próximos
const data = {
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
    return res.status(200).json({
      message: 'Estadísticas del cliente obtenidas correctamente',
      payload: data,
    });
};