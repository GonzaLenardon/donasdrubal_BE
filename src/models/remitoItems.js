import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class RemitoItems extends Model {}

RemitoItems.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    remito_id: {
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
    quantity_requested: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    quantity_dispatched: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'RemitoItems',
    tableName: 'remito_items',
    timestamps: true,
    paranoid: false,
  },
);

export default RemitoItems;
