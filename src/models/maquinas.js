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
    marca: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
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
