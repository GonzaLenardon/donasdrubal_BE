import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Jornada extends Model {}

Jornada.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    motivo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Otro',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },    
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fecha_jornada: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
    },         
  },
  {
    sequelize: db,
    modelName: 'jornada',
    tableName: 'jornadas',
    timestamps: true,   // Necesario para paranoid
    paranoid: true      // Activa soft delete    
  }
);

export default Jornada;
