//controllers/alertas.js
import {
  Clientes,
  Maquinas,
  Pozo,
  MuestraAgua,
  Jornada,
  Calibraciones,
  Alertas,
  TipoClientes,
  TipoServicios,
} from '../models/index.js';
import dayjs from 'dayjs';
import { allMuestrasAgua } from './muestras_agua.js';
import { Op } from 'sequelize';

const controllersAlertas = {
  addAllService: async (req, res) => {
    const { fecha_vencimiento, fecha_alerta } = req.body;

    try {
      /* =========================
       1️⃣ Tipos base
    ========================== */
      const tipoCliente = await TipoClientes.findOne({
        where: { tipoClientes: { [Op.like]: 'AAA%' } },
      });

      const tipoServicioCalibracion = await TipoServicios.findOne({
        where: { nombre: { [Op.like]: '%alibrac%' } },
      });

      const tipoServicioMuestra = await TipoServicios.findOne({
        where: { nombre: { [Op.like]: '%uestra%' } },
      });

      const tipoServicioJornada = await TipoServicios.findOne({
        where: { nombre: { [Op.like]: '%ornada%' } },
      });

      if (!tipoCliente || !tipoServicioCalibracion || !tipoServicioMuestra) {
        return res.status(400).json({
          message: 'Tipos de cliente o servicios no encontrados',
        });
      }

      /* =========================
       2️⃣ Clientes AAA
    ========================== */
      const clientes = await Clientes.findAll({
        where: { tipo_cliente_id: tipoCliente.id },
      });

      const alertasGeneradas = [];

      for (const cliente of clientes) {

      /* =====================================================
         🔧 CALIBRACIONES (por máquina)
      ====================================================== */
        const maquinas = await Maquinas.findAll({
          where: { cliente_id: cliente.id },
        });

        for (const maquina of maquinas) {
          const calibracion = await Calibraciones.create({
            maquina_id: maquina.id,
            alerta: true,
            fecha: null,
            responsable: null,
          });

          alertasGeneradas.push({
            usuario_from_id: req.user.id, // Sistema
            usuario_to_id: cliente.user_id,
            // tipo_servicio_id: tipoServicioCalibracion.id,
            // id_servicio_realizado: calibracion.id,
            entidad_id: calibracion.id,           // ← AGREGADO
            entidad_tipo: 'calibracion',              // ← AGREGADO
            tipo_alerta: 'calibracion_proxima',    // ← AGREGADO
            categoria: 'servicio',                 // ← AGREGADO
            titulo: `Calibración programada - ${maquina.nombre || 'Máquina'}`,  // ← AGREGADO
            mensaje: `Se ha programado una calibración para ${maquina.nombre || 'la máquina'} del cliente ${cliente.razon_social}. Fecha límite: ${dayjs(fecha_vencimiento).format('DD/MM/YYYY')}`,  // ← AGREGADO
            fecha_vencimiento,
            fecha_alerta,
            fecha_evento: new Date(),              // ← AGREGADO
            fecha_vencimiento,
            fecha_alerta,
            estado: 'PENDIENTE',
            prioridad: 'NORMAL',
            requiere_accion: true,                 // ← AGREGADO
            url_accion: `/clientes/${cliente.id}/calibraciones/${calibracion.id}`,  // ← AGREGADO
            accion_texto: 'Ver Calibración',       // ← AGREGADO
            metadata: {                            
              cliente_id: cliente.id,
              cliente_nombre: cliente.razon_social,
              maquina_id: maquina.id,
              maquina_nombre: maquina.nombre,
              maquina_tipo: maquina.tipo,
              dias_alerta_previa: dayjs(fecha_vencimiento).diff(dayjs(fecha_alerta), 'day')
            }
          });
        }

        /* =====================================================
         💧 MUESTRAS DE AGUA (por pozo)
      ====================================================== */
        const pozos = await Pozo.findAll({
          where: { cliente_id: cliente.id },
        });

        for (const pozo of pozos) {
          const muestra = await MuestraAgua.create({
            pozo_id: pozo.id,
            alerta: true,
            fecha_muestra: null,
            fecha_analisis: null,
          });

          alertasGeneradas.push({
            usuario_from_id: req.user.id, // Sistema
            usuario_to_id: cliente.user_id,
            // tipo_servicio_id: tipoServicioMuestra.id,
            // entidad_id: muestra.id,                // ← AGREGADO
            entidad_id: muestra.id,              // ← AGREGADO
            entidad_tipo: 'muestra_agua',        // ← AGREGADO
            tipo_alerta: 'muestra_pendiente',      // ← AGREGADO
            categoria: 'muestra',                  // ← AGREGADO
            titulo: `Muestra de agua pendiente - ${pozo.nombre || 'Pozo'}`,  // ← AGREGADO
            mensaje: `Se ha programado un análisis de agua para ${pozo.nombre || 'el pozo'} del cliente ${cliente.razon_social}. Fecha límite: ${dayjs(fecha_vencimiento).format('DD/MM/YYYY')}`,  // ← AGREGADO            
            fecha_vencimiento,
            fecha_alerta,
            fecha_evento: new Date(),
            estado: 'ACTIVA',
            prioridad: 'NORMAL',
            requiere_accion: true,
            url_accion: `/clientes/${cliente.id}/muestras/${muestra.id}`,
            accion_texto: 'Ver Muestra',
            metadata: {
              cliente_id: cliente.id,
              cliente_nombre: cliente.razon_social,
              pozo_id: pozo.id,
              pozo_nombre: pozo.nombre,
              dias_alerta_previa: dayjs(fecha_vencimiento).diff(dayjs(fecha_alerta), 'day')
            }
          });
        }

        for (let index = 0; index < 2; index++) {
          const newJornada = await Jornada.create({
            cliente_id: cliente.id,
            alerta: true,
          });

          alertasGeneradas.push({
            usuario_from_id: req.user.id, // Sistema
            usuario_to_id: cliente.user_id,
            // tipo_servicio_id: tipoServicioJornada.id,
            // entidad_id: newJornada.id,             // ← AGREGADO
            entidad_id: newJornada.id,              // ← AGREGADO
            entidad_tipo: 'jornada',              // ← AGREGADO
            tipo_alerta: 'jornada_programada',     // ← AGREGADO
            categoria: 'jornada',                  // ← AGREGADO
            titulo: `Jornada de capacitación programada`,  // ← AGREGADO
            mensaje: `Se ha programado una jornada de capacitación para el cliente ${cliente.razon_social}. Fecha: ${dayjs(fecha_vencimiento).format('DD/MM/YYYY')}`,  // ← AGREGADO            
            fecha_vencimiento,
            fecha_alerta,
            fecha_evento: new Date(),
            estado: 'ACTIVA',
            prioridad: 'NORMAL',
            requiere_accion: true,
            url_accion: `/clientes/${cliente.id}/jornadas/${newJornada.id}`,
            accion_texto: 'Ver Jornada',
            metadata: {
              cliente_id: cliente.id,
              cliente_nombre: cliente.razon_social,
              dias_alerta_previa: dayjs(fecha_vencimiento).diff(dayjs(fecha_alerta), 'day')
            }
          });
        }

        /*   const jornada = await Jornada.findAll({
          where: { cliente_id: cliente.id },
        });

        console.log('Jornadas .......... ', jornada);
 */
      }

      /* =========================
       3️⃣ Inserción masiva
    ========================== */
      await Alertas.bulkCreate(alertasGeneradas);

      return res.status(200).json({
        message: 'Servicios y alertas generados correctamente',
        total: alertasGeneradas.length,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al generar servicios y alertas',
        error: error.message,
      });
    }
  },

  add: async (req, res) => {
    try {
      const data = req.body;
      console.log('data', data);

      const alerta = await Alertas.create(data);

      return res.status(201).json(alerta);
    } catch (error) {
      console.error('Error al crear Alerta de Servicios:', error);
      return res.status(500).json({
        message: 'Error al crear Alerta de Servicios',
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const alertas = await Alertas.findAll();
      return res.status(200).json(alertas);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: 'Error al obtener Alertas de Servicios' });
    }
  },
};

export default controllersAlertas;
