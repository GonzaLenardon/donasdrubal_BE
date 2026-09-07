import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Products extends Model {}

Products.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    product_presentation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Products',
    tableName: 'products',
    timestamps: true,
    paranoid: false,
  },
);

export default Products;
