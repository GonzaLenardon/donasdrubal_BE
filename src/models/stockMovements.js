import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class StockMovements extends Model {}

StockMovements.init(
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
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_lot_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    movement_type: {
      type: DataTypes.ENUM('ENTRADA', 'SALIDA'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    remito_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    movement_date: {
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
  },
  {
    sequelize: db,
    modelName: 'StockMovements',
    tableName: 'stock_movements',
    timestamps: true,
    paranoid: false,
  },
);

export default StockMovements;
