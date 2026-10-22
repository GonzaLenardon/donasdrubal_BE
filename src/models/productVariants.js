import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class ProductVariants extends Model {}

ProductVariants.init(
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
    presentation_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    codigo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ranking: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
    },
  },
  {
    sequelize: db,
    modelName: 'ProductVariants',
    tableName: 'product_variants',
    timestamps: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'presentation_id'],
        name: 'product_variants_unique',
      },
    ],
  },
);

export default ProductVariants;