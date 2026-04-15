import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Jornada extends Model {}

Jornada.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    motivo: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Nueva Jornada mezcla',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_jornada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    alerta: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'PENDIENTE',
      validate: {
        isIn: [['PENDIENTE', 'ALERTADO', 'VENCIDO', 'CERRADO', 'CANCELADO']],
      },
    },

    deletedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    },
  },
  {
    sequelize: db,
    modelName: 'Jornada',
    tableName: 'jornadas',
    timestamps: true, // Necesario para paranoid
    paranoid: true, // Activa soft delete
  },
);

export default Jornada;
