import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class PurchaseItems extends Model {}

PurchaseItems.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    purchase_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_presentation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'PurchaseItems',
    tableName: 'purchase_items',
    timestamps: true,
    paranoid: false,
  },
);

export default PurchaseItems;
