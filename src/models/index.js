import db from '../config/database.js';
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

Users.hasOne(Clients, { 
  foreignKey: 'user_id' 
});
Clients.belongsTo(Users, {
   foreignKey: 'user_id' 
  });
import Maquinas from './maquinas.js';
import Calibraciones from './calibraciones.js';

Users.hasMany(Maquinas, { foreignKey: 'user_id', as: 'maquinas' });
Maquinas.belongsTo(Users, { foreignKey: 'user_id', as: 'cliente' });

Maquinas.hasMany(Calibraciones, {
  foreignKey: 'maquina_id',
  as: 'calibracionesmaquina',
});
Calibraciones.belongsTo(Maquinas, {
  foreignKey: 'maquina_id',
  as: 'calibraciones',
});

export { db };
export { Users, Maquinas, Calibraciones };
export { Roles };
export { Permissions };
export { UserRoles };
export { RolePermissions};
