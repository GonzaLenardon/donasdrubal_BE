import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class TipoClientes extends Model {}

TipoClientes.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipoClientes: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    observaciones: {
      type: DataTypes.CHAR,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'TipoClientes',
    tableName: 'tipoClientes',
    timestamps: true, // Necesario para paranoid
    paranoid: true, // Activa soft delete
  },
);

export default TipoClientes;
