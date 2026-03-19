//models/alertas.js

import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';
import User from './users.js';
import TipoServicios from './tiposServicios.js';

// ============================================
// CONSTANTES Y MAPEOS (FUERA de la clase)
// ============================================

// 1. Constantes para entidad_tipo
export const ENTIDAD_TIPOS = {
  CALIBRACION: 'calibracion',
  MUESTRA_AGUA: 'muestra_agua',
  JORNADA: 'jornada',
  POZO: 'pozo',
  CLIENTE: 'cliente',
  USER: 'user',
};

// 2. Mapeo a modelos (para uso interno con Sequelize)
export const ENTIDAD_TO_MODEL = {
  [ENTIDAD_TIPOS.CALIBRACION]: 'Calibracion',
  [ENTIDAD_TIPOS.MUESTRA_AGUA]: 'MuestraAgua',
  [ENTIDAD_TIPOS.JORNADA]: 'Jornada',
  [ENTIDAD_TIPOS.POZO]: 'Pozo',
  [ENTIDAD_TIPOS.CLIENTE]: 'Cliente',
  [ENTIDAD_TIPOS.USER]: 'User',
};

// 3. Mapeo a tablas (para SQL raw)
export const ENTIDAD_TO_TABLE = {
  [ENTIDAD_TIPOS.CALIBRACION]: 'calibraciones',
  [ENTIDAD_TIPOS.MUESTRA_AGUA]: 'muestras_agua',
  [ENTIDAD_TIPOS.JORNADA]: 'jornadas',
  [ENTIDAD_TIPOS.POZO]: 'pozos',
  [ENTIDAD_TIPOS.CLIENTE]: 'clientes',
  [ENTIDAD_TIPOS.USER]: 'users',
};

// 4. (Opcional) Categorías por entidad
export const ENTIDAD_CATEGORIA = {
  [ENTIDAD_TIPOS.CALIBRACION]: 'servicio',
  [ENTIDAD_TIPOS.MUESTRA_AGUA]: 'servicio',
  [ENTIDAD_TIPOS.JORNADA]: 'servicio',
  [ENTIDAD_TIPOS.POZO]: 'infraestructura',
  [ENTIDAD_TIPOS.CLIENTE]: 'cliente',
  [ENTIDAD_TIPOS.USER]: 'usuario',
};

class Alertas extends Model {}

Alertas.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // quien genera la alerta (ej: sistema, cliente, admin, etc)
    usuario_from_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // 0 para sistema
      comment: 'ID del usuario que generó la alerta (0 para sistema)',
    },

    // a quien se asocia el alerta pude ser cliente ou otro usaurio del sistema, por eso se llama usuario_id y no cliente_id
    usuario_to_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    // tipo_servicio_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   references: {
    //     model: TipoServicios,
    //     key: 'id',
    //   },
    //   onDelete: 'RESTRICT',
    //   comment: 'Tipo de servicio relacionado (solo para alertas de servicios)'
    // },

    // // Relación con servicio realizado
    // id_servicio_realizado: {
    //   type: DataTypes.INTEGER,
    //   allowNull: true,
    //   comment: 'ID del servicio que completó/resolvió esta alerta'
    // },
    // ==================== CONTEXTO POLIMÓRFICO ====================
    // alerta puede estar relacionada a diferentes entidades (calibración, muestra de agua, jornada, pozo, cliente, etc)
    entidad_tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Tipo de entidad relacionada',
      validate: {
        isIn: [
          [
            ENTIDAD_TIPOS.CALIBRACION,
            ENTIDAD_TIPOS.MUESTRA_AGUA,
            ENTIDAD_TIPOS.JORNADA,
            ENTIDAD_TIPOS.POZO,
            ENTIDAD_TIPOS.CLIENTE,
            ENTIDAD_TIPOS.USER,
          ],
        ],
      },
    },

    entidad_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment:
        'ID de la entidad específica (ej: id de calibración que generó la alerta)',
    },
    // ==================== TIPO Y CATEGORÍA ====================
    tipo_alerta: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Tipo específico de alerta',
      validate: {
        isIn: [
          [
            // Servicios
            'servicio_vencido',
            'servicio_proximo',
            'calibracion_vencida',
            'calibracion_proxima',
            // Muestras
            'muestra_pendiente',
            'resultado_muestra_listo',
            'muestra_fuera_parametros',
            // Jornadas
            'jornada_programada',
            'jornada_cancelada',
            // Cliente
            'cliente_inactivo',
            'documentacion_vencida',
            // Sistema
            'tarea_asignada',
            'mensaje_recibido',
            'recordatorio',
          ],
        ],
      },
    },

    categoria: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'servicio',
      comment: 'Categoría general para agrupar',
      validate: {
        isIn: [
          ['servicio', 'muestra', 'jornada', 'cliente', 'sistema', 'tarea'],
        ],
      },
    },

    // ==================== PRIORIDAD Y ESTADO ====================
    estado: {
      type: DataTypes.ENUM(
        'PENDIENTE',
        'ACTIVA',
        'LEIDA',
        'ALERTADO',
        'VENCIDO',
        'RESUELTA',
        'COMPLETADO',
        'DESCARTADA',
        'CANCELADO',
        'ARCHIVADA',
      ),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },

    prioridad: {
      type: DataTypes.ENUM('BAJA', 'NORMAL', 'ALTA', 'URGENTE'),
      allowNull: false,
      defaultValue: 'NORMAL',
    },

    // ==================== CONTENIDO ====================
    titulo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Título breve de la alerta',
    },

    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Descripción detallada',
    },

    // ==================== FECHAS ====================
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },

    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha límite o de vencimiento del servicio',
    },

    fecha_alerta: {
      type: DataTypes.DATE,
      allowNull: true,
      comment:
        'Fecha en que se debe mostrar la alerta (fecha_vencimiento - dias_alerta_previa)',
    },

    fecha_evento: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha del evento que generó la alerta',
    },

    fecha_leida: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Cuándo fue vista por el usuario',
    },

    fecha_completado: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Cuándo se completó/resolvió (de AlertasServicios)',
    },

    // ==================== ACCIONES ====================
    requiere_accion: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si requiere que el usuario haga algo',
    },

    url_accion: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL a la que debe ir el usuario',
    },

    accion_texto: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Texto del botón de acción',
    },

    // ==================== METADATA ADICIONAL ====================
    // Solo para datos NO críticos, específicos por tipo
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: `
        Datos adicionales NO críticos, específicos por tipo de alerta.
        
        Ejemplo para servicios:
        {
          cliente_id: 123,
          cliente_nombre: "Finca El Girasol",
          dias_vencido: 5,
          dias_alerta_previa: 15,
          maquina_id: 456,
          maquina_nombre: "Pulverizadora Jacto",
          maquina_tipo: "Autopropulsada"
        }
        
        Ejemplo para muestras:
        {
          pozo_id: 789,
          pozo_nombre: "Pozo Norte",
          resultado_ph: 7.2,
          fuera_parametros: ["dureza", "nitratos"]
        }
      `,
    },
    // ==================== NOTIFICACIONES ====================
    notificado_email: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    fecha_email: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    notificado_push: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // Observaciones
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    motivo_cancelacion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Alertas',
    tableName: 'alertas',
    timestamps: true,
    indexes: [
      { name: 'idx_usuario_to_estado', fields: ['usuario_to_id', 'estado'] },
      { name: 'idx_usuario_tipo', fields: ['usuario_to_id', 'tipo_alerta'] },
      { name: 'idx_fecha_vencimiento', fields: ['fecha_vencimiento'] },
      { name: 'idx_fecha_alerta', fields: ['fecha_alerta'] },
      { name: 'idx_entidad', fields: ['entidad_tipo', 'entidad_id'] },
      { name: 'idx_prioridad_fecha', fields: ['prioridad', 'fecha_creacion'] },
    ],
  },
);

export default Alertas;

/* ------------------- EJEMPLO DE USO ------------------- */
// // En un controlador o servicio
// import Alertas, { ENTIDAD_TIPOS, ENTIDAD_TO_MODEL } from '../models/alertas.js';

// // Crear una alerta usando constantes
// const nuevaAlerta = await Alertas.create({
//   usuario_id: 123,
//   entidad_tipo: ENTIDAD_TIPOS.CALIBRACION,  // 'calibracion'
//   entidad_id: 456,
//   tipo_alerta: 'calibracion_vencida',
//   titulo: 'Calibración vencida',
//   mensaje: 'El equipo necesita calibración'
// });

// // Obtener el modelo relacionado dinámicamente
// function getModeloPorEntidad(entidad_tipo) {
//   const nombreModelo = ENTIDAD_TO_MODEL[entidad_tipo];
//   return db.models[nombreModelo];
// }

// // Usarlo en una función
// async function getEntidadRelacionada(alerta) {
//   const Modelo = getModeloPorEntidad(alerta.entidad_tipo);
//   return await Modelo.findByPk(alerta.entidad_id);
// }
