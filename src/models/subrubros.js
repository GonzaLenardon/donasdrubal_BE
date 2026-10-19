import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Subrubros extends Model {}

Subrubros.init(
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
    rubro_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Subrubros',
    tableName: 'subrubros',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        fields: ['rubro_id', 'nombre'],
        name: 'subrubros_unique_nombre_rubro',
      },
    ],
  },
);

export default Subrubros;