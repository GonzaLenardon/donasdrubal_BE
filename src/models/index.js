import sequelize from '../config/database.js';
import Users from './users.js';
import Roles from './roles.js';
import Permissions from './permissions.js';
import UserRoles from './user_roles.js';
import RolePermissions from './role_permissions.js'; 

// -------------------------------
// Relaciones entre los modelos
// -------------------------------

// Un usuario puede tener varios roles
Users.belongsToMany(Roles, {
  through: UserRoles,
  foreignKey: 'user_id',
  otherKey: 'role_id',
});

// Un rol puede pertenecer a varios usuarios
Roles.belongsToMany(Users, {
  through: UserRoles,
  foreignKey: 'role_id',
  otherKey: 'user_id',
});

// Un rol puede tener varios permisos
Roles.belongsToMany(Permissions, {
  through: RolePermissions,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
});

// Un permiso puede pertenecer a varios roles
Permissions.belongsToMany(Roles, {
  through: RolePermissions,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
});

export { sequelize };
export { Users };
export { Roles };
export { Permissions };
export { UserRoles };
export { RolePermissions};
