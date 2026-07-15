//controllers/alertas.js
import { extractModelFields } from '../utils/model/payload.js';
import {
  Clientes,
  Users,
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
import { allIngenieros } from './users.js';
import EmailService from '../services/email/emailService.js';

const enviarEmailAlerta = async (alerta) => {
  await EmailService.enviarNotificacionAlerta(alerta);
  await alerta.update({
    notificado_email: true,
    fecha_email: new Date(),
  });
};

export const crearAlerta = async (data, { enviarEmail = true } = {}) => {
  const alerta = await Alertas.create(data);
  let emailEnviado = false;
  let emailError = null;

  if (enviarEmail) {
    try {
      await enviarEmailAlerta(alerta);
      emailEnviado = true;
    } catch (error) {
      emailError = error.message;
      console.error('Error al enviar email de alerta:', error);
    }
  }

  return {
    alerta,
    emailEnviado,
    emailError,
  };
};

const controllersAlertas = {
  addAllService: async (req, res) => {
    const { fecha_vencimiento, fecha_alerta } = req.body;

    try {
      /* =========================
       1️⃣ Tipos base
    ========================== */
      const tipoCliente = await TipoClientes.findOne({
        where: { tipoClientes: { [Op.like]: 'A' } },
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
        include: [
          {
            model: Users,
            as: 'ingenieros',
            attributes: ['id', 'nombre', 'email'],
            required: false,
            through: {
              attributes: ['es_principal'],
              where: {
                es_principal: 1,
              },
            },
          },
        ],
      });

      const alertasGeneradas = [];
      let totalAlertasGeneradas = 0;
      let emailsEnviados = 0;
      let emailsFallidos = 0;

      for (const cliente of clientes) {
        // console.log('Cliente:', cliente);
        /*   console.log('Ingenieros asociados:', cliente.ingenieros.map(ing => ({ id: ing.id, nombre: ing.nombre, email: ing.email, es_principal: ing.ClienteIngenieros.es_principal })));
        console.log('Ingeniero principal:', cliente.ingenieros[0]?.id ?? null); */

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
            usuario_to_id: cliente.ingenieros[0]?.id ?? cliente.user_id,
            // tipo_servicio_id: tipoServicioCalibracion.id,
            // id_servicio_realizado: calibracion.id,
            entidad_id: calibracion.id, // ← AGREGADO
            entidad_tipo: 'calibracion', // ← AGREGADO
            tipo_alerta: 'sin_configurar', // ← AGREGADO
            categoria: 'calibraciones', // ← AGREGADO
            titulo: `Calibración programada - ${maquina.nombre || 'Máquina'}`, // ← AGREGADO
            mensaje: `Se ha programado una calibración para ${maquina.nombre || 'la máquina'} del cliente ${cliente.razon_social}. Fecha límite: ${dayjs(fecha_vencimiento).format('DD/MM/YYYY')}`, // ← AGREGADO
            fecha_vencimiento,
            fecha_alerta,
            fecha_evento: new Date(), // ← AGREGADO
            fecha_vencimiento,
            fecha_alerta,
            estado: 'PENDIENTE',
            prioridad: 'NORMAL',
            requiere_accion: true, // ← AGREGADO
            url_accion: `/clientes/${cliente.id}/maquinas/${maquina.id}/calibraciones`, // ← AGREGADO
            accion_texto: 'Ver Calibración', // ← AGREGADO
            metadata: {
              cliente_id: cliente.id,
              cliente_nombre: cliente.razon_social,
              maquina_id: maquina.id,
              maquina_nombre: maquina.nombre,
              maquina_tipo: maquina.tipo,
              dias_alerta_previa: dayjs(fecha_vencimiento).diff(
                dayjs(fecha_alerta),
                'day',
              ),
            },
          });
        }

        // await Alertas.bulkCreate(alertasGeneradas);

        // alertasGeneradas.length = 0;

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
            entidad_id: muestra.id, // ← AGREGADO
            entidad_tipo: 'muestra_agua', // ← AGREGADO
            tipo_alerta: 'servicio_sin_configurar', // ← AGREGADO
            categoria: 'muestras_agua', // ← AGREGADO
            titulo: `Muestra de agua pendiente - ${pozo.nombre || 'Pozo'}`, // ← AGREGADO
            mensaje: `Se ha programado un análisis de agua para ${pozo.nombre || 'el pozo'} del cliente ${cliente.razon_social}. Fecha límite: ${dayjs(fecha_vencimiento).format('DD/MM/YYYY')}`, // ← AGREGADO
            fecha_vencimiento,
            fecha_alerta,
            fecha_evento: new Date(),
            estado: 'ACTIVA',
            prioridad: 'NORMAL',
            requiere_accion: true,
            url_accion: `/clientes/${cliente.id}/pozos/${pozo.id}/muestras`,
            accion_texto: 'Ver Muestra',
            metadata: {
              cliente_id: cliente.id,
              cliente_nombre: cliente.razon_social,
              pozo_id: pozo.id,
              pozo_nombre: pozo.nombre,
              dias_alerta_previa: dayjs(fecha_vencimiento).diff(
                dayjs(fecha_alerta),
                'day',
              ),
            },
          });
        }

        // await Alertas.bulkCreate(alertasGeneradas);

        // alertasGeneradas.length = 0;

        /* =====================================================
          JORNADAS DE CAPACITACIÓN (1 por cliente)
        ====================================================== */

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
            entidad_id: newJornada.id, // ← AGREGADO
            entidad_tipo: 'jornada', // ← AGREGADO
            tipo_alerta: 'servicio_sin_configurar', // ← AGREGADO
            categoria: 'jornada', // ← AGREGADO
            titulo: `Jornada de capacitación programada`, // ← AGREGADO
            mensaje: `Se ha programado una jornada de capacitación para el cliente ${cliente.razon_social}. Fecha: ${dayjs(fecha_vencimiento).format('DD/MM/YYYY')}`, // ← AGREGADO
            fecha_vencimiento,
            fecha_alerta,
            fecha_evento: new Date(),
            estado: 'ACTIVA',
            prioridad: 'NORMAL',
            requiere_accion: true,
            url_accion: `/clientes/${cliente.id}/jornadas`,
            accion_texto: 'Ver Jornada',
            metadata: {
              cliente_id: cliente.id,
              cliente_nombre: cliente.razon_social,
              dias_alerta_previa: dayjs(fecha_vencimiento).diff(
                dayjs(fecha_alerta),
                'day',
              ),
            },
          });
        }
        const alertasCreadas = await Alertas.bulkCreate(alertasGeneradas);
        totalAlertasGeneradas += alertasCreadas.length;

        const resultadosEmail = await Promise.allSettled(
          alertasCreadas.map((alerta) => enviarEmailAlerta(alerta)),
        );

        emailsEnviados += resultadosEmail.filter(
          (resultado) => resultado.status === 'fulfilled',
        ).length;
        emailsFallidos += resultadosEmail.filter(
          (resultado) => resultado.status === 'rejected',
        ).length;

        resultadosEmail
          .filter((resultado) => resultado.status === 'rejected')
          .forEach((resultado) => {
            console.error('Error al enviar email de alerta:', resultado.reason);
          });

        alertasGeneradas.length = 0;
      }

      return res.status(200).json({
        message: 'Servicios y alertas generados correctamente',
        total: totalAlertasGeneradas,
        emailsEnviados,
        emailsFallidos,
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
      const payload = extractModelFields(Alertas, req.body);
      console.log('addAlerta controller: payload->', payload);

      const { alerta, emailEnviado, emailError } = await crearAlerta(payload);

      return res.status(201).json({
        ...alerta.toJSON(),
        emailEnviado,
        emailError,
      });
    } catch (error) {
      console.error('Error al crear Alerta de Servicios:', error);
      return res.status(500).json({
        message: 'Error al crear Alerta de Servicios',
      });
    }
  },
  update: async (req, res) => {
    const { alerta_id } = req.params;
  
    console.log(
      'Actualizar Alerta - ID:',
      alerta_id,
    );
    try {
      const payload = extractModelFields(Alertas, req.body);

      const alerta = await Alertas.findByPk(alerta_id);
  
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta no encontrada' });
      }
      console.log('updateAlerta controller: payload->', payload);
      const resp = await alerta.update(payload);
  
      return res.status(200).json({
        message: 'Alerta actualizada exitosamente',
        data: resp,
      });
    } catch (error) {
      console.log('Error al actualizar Alerta:', error);
      return res.status(500).json({
        error: 'Error al actualizar Alerta',
        details: error.message,
      });
    }
  },
  deleteAlerta: async (req, res) => {
    const { alerta_id } = req.params;
    try {
      const alerta = await Alertas.findByPk(alerta_id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta no encontrada' });
      }

      await alerta.destroy();
      return res.status(200).json({
        message: 'Alerta eliminada exitosamente',
      });
    } catch (error) {
      console.log('Error al eliminar Alerta:', error);
      return res.status(500).json({
        error: 'Error en el servidor',
        details: error.message,
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
  getByUserFromId: async (req, res) => {
    const { from_user_id } = req.params;
    console.log('from_user_id', from_user_id);
    console.log('parametros', req.params);
    try {
      const alertas = await Alertas.findAll({
        where: {
          usuario_from_id: from_user_id,
        },
      });
      return res.status(200).json(alertas);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: 'Error al obtener Alertas Enviadas' });
    }
  },
  getByUserToId: async (req, res) => {
    const { to_user_id } = req.params;
    try {
      const alertas = await Alertas.findAll({
        where: {
          usuario_to_id: to_user_id,
        },
      });
      return res.status(200).json(alertas);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: 'Error al obtener Alertas Recibidas' });
    }
  },
};

export default controllersAlertas;
