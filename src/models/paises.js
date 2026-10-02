import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Pais extends Model {}

Pais.init(
  {
    pais_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    pais_iso: {
      type: DataTypes.CHAR(6),
      allowNull: true,
    },
    pais_nombre: {
      type: DataTypes.STRING(240),
      allowNull: true,
    },
    pais_nombre_en: {
      type: DataTypes.STRING(240),
      allowNull: true,
    },
    pais_codigo_telefono: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Pais',
    tableName: 'paises',
    timestamps: false,
  },
);

export default Pais;
