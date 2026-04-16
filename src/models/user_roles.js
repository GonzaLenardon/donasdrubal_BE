import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class UserRoles extends Model {}

UserRoles.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    sequelize: db,
    modelName: 'UserRoles',
    tableName: 'user_roles',
    timestamps: false,
  },
);

export default UserRoles;
