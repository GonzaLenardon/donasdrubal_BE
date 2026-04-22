//controllers/alertas.js
import fs from 'fs';
import path from 'path';
import db from '../config/database.js';
// import Clientes from '../models/clientes.js';
// import Users from '../models/users.js';
// import ClienteIngenieros from '../models/clientesIngenieros.js';
// import Maquinas from '../models/maquinas.js';
// import Calibraciones from '../models/calibraciones.js';
// import Pozo from '../models/pozo.js';
// import MuestraAgua from '../models/muestra_agua.js';
// import Jornada from '../models/jornada.js';
// import Roles from '../models/roles.js';
// import UserRoles from '../models/user_roles.js';}
import {
  Clientes,
  Users,
  Maquinas,
  Pozo,
  MuestraAgua,
  Jornada,
  Calibraciones,
  // Alertas,

  // TipoClientes,
  // TipoServicios,
} from '../models/index.js';
import Alertas from '../models/alertas.js';
import TipoClientes from '../models/tipoClientes.js';
import TipoServicios from '../models/tiposServicios.js';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

const genAlertasServices = async () => {

  const fecha_vencimiento = dayjs().add(20, 'day').toDate();
  const fecha_alerta = dayjs(fecha_vencimiento).subtract(7, 'day').toDate();
  const usuario_from_id = 1; // ID DEL ADMIN DEL SISTEMA O USUARIO QUE GENERA LAS ALERTAS (PUEDE SER UN USUARIO DEDICADO SOLO PARA ESTO)
  const alertasGeneradas = [];
  let genCount = 1;
  try {
    await db.authenticate();
    console.log('✅ Conectado a la base de datos');
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
              es_principal: 1
            }
          },
        }],
    });

    const alertasGeneradas = [];

    for (const cliente of clientes) {
      // console.log('Cliente:', cliente);
      console.log('Ingenieros asociados:', cliente.ingenieros.map(ing => ({ id: ing.id, nombre: ing.nombre, email: ing.email, es_principal: ing.ClienteIngenieros.es_principal })));
      console.log('Ingeniero principal:', cliente.ingenieros[0]?.id ?? null);

      /* =====================================================
        🔧 CALIBRACIONES (por máquina)
      ====================================================== */
      const maquinas = await Maquinas.findAll({
        where: { cliente_id: cliente.id },
      });

      for (const maquina of maquinas) {

        const calibraciones = await Calibraciones.findAll({
          where: { maquina_id: maquina.id, },
        });

        for (const calibracion of calibraciones) {
          alertasGeneradas.push({
            usuario_from_id: usuario_from_id, // Sistema
            usuario_to_id: cliente.ingenieros[0]?.id ?? cliente.user_id,
            // tipo_servicio_id: tipoServicioCalibracion.id,
            // id_servicio_realizado: calibracion.id,
            entidad_id: calibracion.id,           // ← AGREGADO
            entidad_tipo: 'calibracion',              // ← AGREGADO
            tipo_alerta: 'sin_configurar',    // ← AGREGADO
            categoria: 'calibraciones',                 // ← AGREGADO
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
        const muestras = await MuestraAgua.findAll({
          where: { pozo_id: pozo.id },
        });

        for (const muestra of muestras) {

          alertasGeneradas.push({
            usuario_from_id: usuario_from_id, // Sistema
            usuario_to_id: cliente.ingenieros[0]?.id ?? cliente.user_id,
            // tipo_servicio_id: tipoServicioMuestra.id,
            // entidad_id: muestra.id,                // ← AGREGADO
            entidad_id: muestra.id,              // ← AGREGADO
            entidad_tipo: 'muestra_agua',        // ← AGREGADO
            tipo_alerta: 'servicio_sin_configurar',      // ← AGREGADO
            categoria: 'muestras_agua',                  // ← AGREGADO
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
      }

      // await Alertas.bulkCreate(alertasGeneradas);

      // alertasGeneradas.length = 0;        

      /* =====================================================
        JORNADAS DE CAPACITACIÓN (1 por cliente)
      ====================================================== */


      const jornadas = await Jornada.findAll({
        where: { cliente_id: cliente.id },
      });
      for (const jornada of jornadas) {
        alertasGeneradas.push({
          usuario_from_id: usuario_from_id, // Sistema
          usuario_to_id: cliente.ingenieros[0]?.id ?? cliente.user_id,
          // tipo_servicio_id: tipoServicioJornada.id,
          // entidad_id: newJornada.id,             // ← AGREGADO
          entidad_id: jornada.id,              // ← AGREGADO
          entidad_tipo: 'jornada',              // ← AGREGADO
          tipo_alerta: 'servicio_sin_configurar',     // ← AGREGADO
          categoria: 'jornada',                  // ← AGREGADO
          titulo: `Jornada de capacitación programada`,  // ← AGREGADO
          mensaje: `Se ha programado una jornada de capacitación para el cliente ${cliente.razon_social}. Fecha: ${dayjs(fecha_vencimiento).format('DD/MM/YYYY')}`,  // ← AGREGADO            
          fecha_vencimiento,
          fecha_alerta,
          fecha_evento: new Date(),
          estado: 'ACTIVA',
          prioridad: 'NORMAL',
          requiere_accion: true,
          url_accion: `/clientes/${cliente.id}/jornadas/${jornada.id}`,
          accion_texto: 'Ver Jornada',
          metadata: {
            cliente_id: cliente.id,
            cliente_nombre: cliente.razon_social,
            dias_alerta_previa: dayjs(fecha_vencimiento).diff(dayjs(fecha_alerta), 'day')
          }
        });
      }


      await db.transaction(async (transaction) => {
        await Alertas.bulkCreate(alertasGeneradas, { transaction });
        alertasGeneradas.length = 0;
        console.log(`✅Alerta n° ${genCount} creada para cliente "${cliente.razon_social}" con ${maquinas.length} máquinas, ${pozos.length} pozos y 2 jornadas `);
        genCount += 1;
      });

    }


    console.log(`\nGeneracion de Alertas finalizada: ${genCount} alertas generada.`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
};


genAlertasServices();



