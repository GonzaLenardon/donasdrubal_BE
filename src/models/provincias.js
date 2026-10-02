import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Provincia extends Model {}

Provincia.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
    },
    pais_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    nombre: {
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
    modelName: 'Provincia',
    tableName: 'provincias',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  },
);

export default Provincia;
