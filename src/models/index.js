import db from '../config/database.js';
import Users from './users.js';
import Roles from './roles.js';
import Permissions from './permissions.js';
import UserRoles from './user_roles.js';
import RolePermissions from './role_permissions.js';
import Maquinas from './maquinas.js';
import Calibraciones from './calibraciones.js';
import Clientes from './clientes.js';
import MaquinaTipo from './maquina_tipo.js';
import Pozo from './pozo.js';
import MuestraAgua from './muestra_agua.js';

// -------------------------------
// Relaciones entre los modelos
// -------------------------------

// Un usuario puede tener varios roles
Users.belongsToMany(Roles, { through: UserRoles, foreignKey: 'user_id', otherKey: 'role_id',});
Users.hasOne(Clientes, { foreignKey: 'user_id', as: 'clienteInfo'});
// Un usuario ingeniero puede tener muchos clientes asignados
Users.hasMany(Clientes, {foreignKey: 'ingeniero_id', as: 'clientesAsignados',});

// Un rol puede pertenecer a varios usuarios
Roles.belongsToMany(Users, { through: UserRoles, foreignKey: 'role_id',otherKey: 'user_id' });
// Un rol puede tener varios permisos
Roles.belongsToMany(Permissions, { through: RolePermissions,foreignKey: 'role_id', otherKey: 'permission_id',});

// Un permiso puede pertenecer a varios roles
Permissions.belongsToMany(Roles, {through: RolePermissions, foreignKey: 'permission_id', otherKey: 'role_id',});

Clientes.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });
// Un cliente tiene asignado UN ingeniero (usuario)
Clientes.belongsTo(Users, { foreignKey: 'ingeniero_id', as: 'ingenieroAsignado'});
Clientes.hasMany(Maquinas, { foreignKey: 'cliente_id', as: 'maquinas' });
Clientes.hasMany(Pozo, { foreignKey: 'cliente_id', as: 'pozos' });

Maquinas.belongsTo(Clientes, { foreignKey: 'cliente_id', as: 'cliente' });
Maquinas.hasMany(Calibraciones, { foreignKey: 'maquina_id', as: 'calibracionesmaquina',});
Maquinas.belongsTo(MaquinaTipo, { foreignKey: 'tipo_maquina', as: 'tipo' });

MaquinaTipo.hasMany(Maquinas, { foreignKey: 'tipo_maquina', as: 'maquinas' });

Calibraciones.belongsTo(Maquinas, {foreignKey: 'maquina_id',as: 'maquina',});

Pozo.belongsTo(Clientes, { foreignKey: 'cliente_id', as: 'cliente' });
Pozo.hasMany(MuestraAgua, { foreignKey: 'pozo_id', as: 'muestrasAgua' }); 

MuestraAgua.belongsTo(Pozo, { foreignKey: 'pozo_id', as: 'pozo' });

export { db };
export { Users, Maquinas, Calibraciones };
export { Roles };
export { Permissions };
export { UserRoles };
export { RolePermissions };
export { Clientes };
export { MaquinaTipo };
export { Pozo };
export { MuestraAgua }; 
