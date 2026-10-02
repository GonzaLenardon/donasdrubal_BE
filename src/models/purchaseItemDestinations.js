import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class PurchaseItemDestinations extends Model {}

PurchaseItemDestinations.init(
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
    warehouse_id: {
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
    modelName: 'PurchaseItemDestinations',
    tableName: 'purchase_item_destinations',
    timestamps: true,
    paranoid: false,
  },
);

export default PurchaseItemDestinations;
