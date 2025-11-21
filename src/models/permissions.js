import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Permissions extends Model {}

Permissions.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Permissions',
    tableName: 'permissions',
    timestamps: true,
  }
);

export default Permissions;
