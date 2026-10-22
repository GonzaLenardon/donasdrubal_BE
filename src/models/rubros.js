import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Rubros extends Model {}

Rubros.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Rubros',
    tableName: 'rubros',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at',
  },
);

export default Rubros;