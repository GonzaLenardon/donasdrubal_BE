import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Calibraciones extends Model {}

Calibraciones.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_maquina: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_bomba: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_agitador: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_filtroPrimario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_filtroSecundario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_FiltroLinea: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_manguerayconexiones: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_antigoteo: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_limpiezaTanque: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estabilidadVerticalBotalon: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_pastillas: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Observaciones: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    maquina_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Calibraciones',
    tableName: 'calibraciones',
    timestamps: false,
  }
);

export default Calibraciones;
