import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class RemitoItemLots extends Model {}

RemitoItemLots.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    remito_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_lot_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity_dispatched: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'RemitoItemLots',
    tableName: 'remito_item_lots',
    timestamps: true,
    paranoid: false,
  },
);

export default RemitoItemLots;
