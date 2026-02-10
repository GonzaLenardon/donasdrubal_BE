import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Pozo extends Model {}

Pozo.init(
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
    establecimiento: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitud: {
      type: DataTypes.DECIMAL(10, 8), // de -90.00000000 a 90.00000000
      allowNull: true,
    },
    longitud: {
      type: DataTypes.DECIMAL(11, 8), // de -180.00000000 a 180.00000000
      allowNull: true,
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    deletedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    },
  },
  {
    sequelize: db,
    modelName: 'Pozo',
    tableName: 'pozos',
    timestamps: true, // Necesario para paranoid
    paranoid: true, // Activa soft delete
  },
);

export default Pozo;
