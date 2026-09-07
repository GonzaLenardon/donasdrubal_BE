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
      type: DataTypes.ENUM('PENDIENTE', 'DESPACHADO', 'RECIBIDO', 'ANULADO'),
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
    dispatched_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    received_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
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
