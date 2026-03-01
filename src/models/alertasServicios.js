import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';
import Clientes from './clientes.js';
import TipoServicios from './tiposServicios.js';

class AlertasServicios extends Model {}

AlertasServicios.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Clientes,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    tipo_servicio_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: TipoServicios,
        key: 'id',
      },
      onDelete: 'RESTRICT',
    },

    // Fechas
    fecha_creacion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    fecha_alerta: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'fecha_vencimiento - dias_alerta_previa',
    },

    // Estado
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'PENDIENTE',
      validate: {
        isIn: [['PENDIENTE', 'ALERTADO', 'VENCIDO', 'COMPLETADO', 'CANCELADO']],
      },
    },

    prioridad: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'NORMAL',
      validate: {
        isIn: [['BAJA', 'NORMAL', 'ALTA', 'URGENTE']],
      },
    },

    // Relación con servicio realizado
    id_servicio_realizado: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    fecha_completado: {
      type: DataTypes.DATE,
      allowNull: true,
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
    modelName: 'AlertasServicios',
    tableName: 'alertas_servicios',
    timestamps: true,
  },
);

export default AlertasServicios;
