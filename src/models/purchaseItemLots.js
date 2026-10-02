import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class PurchaseItemLots extends Model {}

PurchaseItemLots.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    purchase_item_id: {
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
    },
  },
  {
    sequelize: db,
    modelName: 'PurchaseItemLots',
    tableName: 'purchase_item_lots',
    timestamps: true,
    paranoid: false,
  },
);

export default PurchaseItemLots;
