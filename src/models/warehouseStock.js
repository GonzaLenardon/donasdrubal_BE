import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class WarehouseStock extends Model {}

WarehouseStock.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize: db,
    modelName: 'WarehouseStock',
    tableName: 'warehouse_stock',
    timestamps: true,
    paranoid: false,
  },
);

export default WarehouseStock;
