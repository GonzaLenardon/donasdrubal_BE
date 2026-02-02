import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Clientes extends Model {}

Clientes.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    categoria: {
      type: DataTypes.ENUM('alto', 'medio', 'bajo'),
      allowNull: false,
      defaultValue: 'medio',
    },

    razon_social: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    direccion_fiscal: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    cuil_cuit: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    iva_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    direccion: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    ciudad: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    provincia: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    pais: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    estado: {
      type: DataTypes.STRING,
      defaultValue: 'Nuevo',
    },

    modo_ingreso: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // ✅ FK lógica (sin references)
    tipo_cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Clientes',
    tableName: 'clientes',
    timestamps: false,
  },
);

export default Clientes;
