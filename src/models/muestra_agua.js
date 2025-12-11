import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class MuestraAgua extends Model {}

MuestraAgua.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha_muestra: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_analisis: {
      type: DataTypes.DATE,
      allowNull: false,
    },    
    pozo_id: {
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
    modelName: 'muestra_agua',
    tableName: 'muestras_aguas',
    timestamps: true,   // Necesario para paranoid
    paranoid: true      // Activa soft delete    
  }
);

export default MuestraAgua;
