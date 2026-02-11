import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class TipoServicios extends Model {}

TipoServicios.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    descripcion: {
      type: DataTypes.CHAR,
      allowNull: true,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      DEFAULT: true,
    },
  },
  {
    sequelize: db,
    modelName: 'TipoServicios',
    tableName: 'tipoServicios',
    timestamps: true, // Necesario para paranoid
    paranoid: true, // Activa soft delete
  },
);

export default TipoServicios;
