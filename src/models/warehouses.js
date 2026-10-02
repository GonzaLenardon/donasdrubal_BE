import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Warehouses extends Model {}

Warehouses.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Warehouses',
    tableName: 'warehouses',
    timestamps: true,
    paranoid: false,
  },
);

export default Warehouses;
