import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class RolePermissions extends Model {}

RolePermissions.init(
  {
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'RolePermissions',
    tableName: 'role_permissions',
    timestamps: false,     //Genera automaticamente los campos createdAt y updatedAt 
  }
);

export default RolePermissions;
