import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Maquinas extends Model {}

Maquinas.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_maquina: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    ancho_trabajo: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    distancia_entrePicos: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    numero_picos: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    capacidad_tanque: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },

    sistema_corte: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    responsable: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'Maquinas',
    tableName: 'maquinas',
    timestamps: false,
  }
);

export default Maquinas;
