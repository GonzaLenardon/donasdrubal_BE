import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Providers extends Model {}

Providers.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cuit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    telefono: {
      type: DataTypes.STRING(50),
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
    modelName: 'Providers',
    tableName: 'providers',
    timestamps: true,
    paranoid: false,
  },
);

export default Providers;
