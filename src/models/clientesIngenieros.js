import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class ClienteIngenieros extends Model {}

ClienteIngenieros.init(
  {
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      // ingeniero (users)
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    es_principal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize: db,
    modelName: 'ClienteIngenieros',
    tableName: 'cliente_ingenieros',
    timestamps: false,
  },
);

export default ClienteIngenieros;
