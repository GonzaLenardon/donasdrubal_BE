import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class ProductRanking extends Model {}

ProductRanking.init(
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
      allowNull: false,
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
    modelName: 'ProductRanking',
    tableName: 'product_rankings',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['product_id', 'product_presentation_id'],
        name: 'product_rankings_unique',
      },
    ],
  },
);

export default ProductRanking;
