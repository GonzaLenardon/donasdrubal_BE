import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Remitos extends Model {}

Remitos.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    remito_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('OFICIAL', 'NO_OFICIAL'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDIENTE', 'REVISION', 'COMPLETADO', 'ANULADO'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    origin_warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    destination_client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    photo_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    photo_uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    confirmed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelled_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Remitos',
    tableName: 'remitos',
    timestamps: true,
    paranoid: false,
  },
);

export default Remitos;
