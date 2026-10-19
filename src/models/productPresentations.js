import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class ProductPresentations extends Model {}

ProductPresentations.init(
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
    unidad_base_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cantidad_base: {
      type: DataTypes.DECIMAL(15, 4),
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
    modelName: 'ProductPresentations',
    tableName: 'product_presentations',
    timestamps: true,
    paranoid: false,
  },
);

export default ProductPresentations;
