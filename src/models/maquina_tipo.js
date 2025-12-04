import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class MaquinaTipo extends Model {}

MaquinaTipo.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    marca: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha_fabricacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'MaquinaTipo',
    tableName: 'maquina_tipos',
    timestamps: false,          //no agrega automáticamente los campos createdAt y updatedAt
  }
);

export default MaquinaTipo;
