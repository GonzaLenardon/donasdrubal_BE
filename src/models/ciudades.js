import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Ciudad extends Model {}

Ciudad.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
    provincia_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    provincia_nombre: {
      type: DataTypes.STRING(765),
      allowNull: true,
    },
    nombre: {
      type: DataTypes.STRING(765),
      allowNull: true,
    },
    departamento: {
      type: DataTypes.STRING(765),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.STRING(765),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.STRING(765),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Ciudad',
    tableName: 'ciudades',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
);

export default Ciudad;
