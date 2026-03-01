import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class MuestraAgua extends Model {}

MuestraAgua.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ph: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    dureza: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    alcalinidad: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    salinidad: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fuerza_ionica: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    dosis: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    fecha_muestra: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_analisis: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pozo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_alerta_origen: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'alertas_servicios',
        key: 'id',
      },
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'PENDIENTE',
      validate: {
        isIn: [['PENDIENTE', 'ALERTADO', 'VENCIDO', 'COMPLETADO', 'CANCELADO']],
      },
    },

    deletedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    },
  },
  {
    sequelize: db,
    modelName: 'MuestraAgua',
    tableName: 'muestras_aguas',
    timestamps: true, // Necesario para paranoid
    paranoid: true, // Activa soft delete
  },
);

export default MuestraAgua;
