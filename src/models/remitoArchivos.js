import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class RemitoArchivos extends Model {}

RemitoArchivos.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    remito_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'RemitoArchivos',
    tableName: 'remito_archivos',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at',
  },
);

export default RemitoArchivos;