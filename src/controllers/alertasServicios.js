import {
  Clientes,
  Maquinas,
  Pozo,
  MuestraAgua,
  Jornada,
  Calibraciones,
  AlertasServicios,
  TipoClientes,
  TipoServicios,
} from '../models/index.js';
import dayjs from 'dayjs';
import { allMuestrasAgua } from './muestras_agua.js';
import { Op } from 'sequelize';

const controllersAlertaServicios = {
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
            fecha: null,
            responsable: null,
          });

          alertasGeneradas.push({
            cliente_id: cliente.id,
            tipo_servicio_id: tipoServicioCalibracion.id,
            fecha_vencimiento,
            fecha_alerta,
            estado: 'PENDIENTE',
            prioridad: 'NORMAL',
            id_servicio_realizado: calibracion.id,
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
            fecha_muestra: null,
            fecha_analisis: null,
          });

          alertasGeneradas.push({
            cliente_id: cliente.id,
            tipo_servicio_id: tipoServicioMuestra.id,
            fecha_vencimiento,
            fecha_alerta,
            estado: 'PENDIENTE',
            prioridad: 'NORMAL',
            id_servicio_realizado: muestra.id,
          });
        }

        for (let index = 0; index < 2; index++) {
          const newJornada = await Jornada.create({
            cliente_id: cliente.id,
          });

          alertasGeneradas.push({
            cliente_id: cliente.id,
            tipo_servicio_id: tipoServicioJornada.id,
            fecha_vencimiento,
            fecha_alerta,
            estado: 'PENDIENTE',
            prioridad: 'NORMAL',
            id_servicio_realizado: newJornada.id,
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
      await AlertasServicios.bulkCreate(alertasGeneradas);

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

      const alerta = await AlertasServicios.create(data);

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
      const alertas = await AlertasServicios.findAll();
      return res.status(200).json(alertas);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: 'Error al obtener Alertas de Servicios' });
    }
  },
};

export default controllersAlertaServicios;
