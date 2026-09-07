import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class ProductLots extends Model {}

ProductLots.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    product_presentation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lot_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    manufacturing_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    expiration_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'ProductLots',
    tableName: 'product_lots',
    timestamps: true,
    paranoid: false,
  },
);

export default ProductLots;
