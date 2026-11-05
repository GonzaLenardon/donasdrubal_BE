import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class ProductBrands extends Model {}

ProductBrands.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: db,
    modelName: 'ProductBrands',
    tableName: 'product_brands',
    timestamps: true,
  },
);

export default ProductBrands;
