// controllers/clienteController.js
import { Op } from 'sequelize';
import Alertas, { ENTIDAD_TIPOS } from '../models/alertas.js';
import Clientes from '../models/clientes.js';
import Users from '../models/users.js';
import Calibraciones from '../models/calibraciones.js';
import MuestraAgua from '../models/muestra_agua.js';
import Jornada from '../models/jornada.js';
import Maquinas from '../models/maquinas.js';
import MaquinaTipo from '../models/maquina_tipo.js';
import Pozo from '../models/pozo.js';

export const getClienteUpcomingServices = async (req, res) => {
  try {
    const { clienteId } = req.params;

    // 1. Obtener el cliente con su usuario asociado
    const cliente = await Clientes.findByPk(clienteId, {
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

    // 4. Obtener todos los detalles en paralelo con sus relaciones
    const [calibraciones, muestras, jornadas] = await Promise.all([
      calibracionIds.length > 0 
        ? Calibraciones.findAll({
            where: { id: calibracionIds },
            include: [{
              model: Maquinas,
              as: 'maquina'
            //   attributes: ['id', 'nombre', 'tipo', 'marca', 'modelo']
                },
                { model: MaquinaTipo, as: 'tipo' }
            ],
            
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

    // 5. Crear mapas para acceso rápido
    const calibracionesMap = new Map(calibraciones.map(c => [c.id, c]));
    const muestrasMap = new Map(muestras.map(m => [m.id, m]));
    const jornadasMap = new Map(jornadas.map(j => [j.id, j]));

    // 6. Construir respuesta
    const data = {
      calibracion: [],
      muestras_agua: [],
      jornadas: [] // Agregamos jornadas por si las necesitas
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
            tipoMaquina: cal.maquina?.tipo || 'No especificado',
            marca: cal.maquina?.marca,
            modelo: cal.maquina?.modelo,
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
            motivo: jornada.motivo,
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


export const getClienteMachinesChartOptimized = async (req, res) => {
  try {
    const { clienteId } = req.params;

    // 1. Obtener usuario del cliente en una consulta
    const cliente = await Clientes.findByPk(clienteId, {
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id']
      }],
      attributes: ['id']
    });

    if (!cliente?.user) {
      return res.status(404).json({
        message: 'Cliente o usuario no encontrado',
        payload: {
          data: [
            { name: 'Al día', value: 0, color: '#10b981' },
            { name: 'Próximo', value: 0, color: '#f59e0b' },
            { name: 'Vencido', value: 0, color: '#ef4444' }
          ],
          total: 0
        }
      });
    }

    // 2. Obtener todas las calibraciones del cliente con sus alertas asociadas
    // Esto asume que tienes una relación directa o puedes hacer un JOIN
    const [results] = await db.query(`
      SELECT 
        c.id as calibracion_id,
        c.estado as calibracion_estado,
        c.fecha as calibracion_fecha,
        a.tipo_alerta as alerta_tipo,
        a.estado as alerta_estado,
        CASE 
          WHEN a.tipo_alerta IN ('calibracion_vencida', 'servicio_vencido') THEN 'vencido'
          WHEN a.tipo_alerta IN ('calibracion_proxima', 'servicio_proximo') THEN 'proximo'
          WHEN a.id IS NULL THEN 'al_dia'
          ELSE 'al_dia'
        END as clasificacion
      FROM calibraciones c
      INNER JOIN maquinas m ON m.id = c.maquina_id
      LEFT JOIN alertas a ON 
        a.entidad_tipo = 'calibracion' 
        AND a.entidad_id = c.id
        AND a.usuario_id = :usuarioId
        AND a.estado IN ('ACTIVA', 'ALERTADO', 'PENDIENTE')
      WHERE m.cliente_id = :clienteId
    `, {
      replacements: { 
        clienteId: cliente.id,
        usuarioId: cliente.user.id 
      },
      type: db.QueryTypes.SELECT
    });

    // 3. Clasificar resultados
    let alDia = 0;
    let proximo = 0;
    let vencido = 0;

    results.forEach(row => {
      if (row.clasificacion === 'vencido') {
        vencido++;
      } else if (row.clasificacion === 'proximo') {
        proximo++;
      } else {
        // Para los que están al día, verificar si realmente lo están
        // o si necesitan clasificación por fecha
        if (row.calibracion_estado === 'COMPLETADO') {
          alDia++;
        } else if (row.calibracion_fecha) {
          const hoy = new Date();
          const fechaCal = new Date(row.calibracion_fecha);
          const diasDiff = Math.floor((fechaCal - hoy) / (1000 * 60 * 60 * 24));
          
          if (diasDiff < 0) {
            vencido++;
          } else if (diasDiff <= 15) {
            proximo++;
          } else {
            alDia++;
          }
        } else {
          alDia++;
        }
      }
    });

    const total = results.length;

    return res.status(200).json({
      message: 'Estadísticas del cliente obtenidas correctamente',
      payload: {
        data: [
          { name: 'Al día', value: alDia, color: '#10b981' },
          { name: 'Próximo', value: proximo, color: '#f59e0b' },
          { name: 'Vencido', value: vencido, color: '#ef4444' }
        ],
        total: total
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      message: 'Error al obtener estadísticas',
      payload: {
        data: [
          { name: 'Al día', value: 0, color: '#10b981' },
          { name: 'Próximo', value: 0, color: '#f59e0b' },
          { name: 'Vencido', value: 0, color: '#ef4444' }
        ],
        total: 0
      }
    });
  }
};

//Nada

