// models/index.js
import db from '../config/database.js';
import Users from './users.js';
import Roles from './roles.js';
import Permissions from './permissions.js';
import UserRoles from './user_roles.js';
import RolePermissions from './role_permissions.js';
import Maquinas from './maquinas.js';
import Calibraciones from './calibraciones.js';
import Clientes from './clientes.js';
import ClienteIngenieros from './clientesIngenieros.js';
import MaquinaTipo from './maquina_tipo.js';
import Pozo from './pozo.js';
import MuestraAgua from './muestra_agua.js';
import Jornada from './jornada.js';
import TipoClientes from './tipoClientes.js';
import AlertasServicios from './alertasServicios.js';
import TipoServicios from './tiposServicios.js';

// ============================================================================
// ASOCIACIONES USERS - ROLES - PERMISSIONS
// ============================================================================

Users.belongsToMany(Roles, {
  through: UserRoles,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles',
  constraints: false, // ✅ AGREGAR
});

Roles.belongsToMany(Users, {
  through: UserRoles,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'usuarios',
  constraints: false, // ✅ AGREGAR
});

Roles.belongsToMany(Permissions, {
  through: RolePermissions,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permisos',
  constraints: false, // ✅ AGREGAR
});

Permissions.belongsToMany(Roles, {
  through: RolePermissions,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
  constraints: false, // ✅ AGREGAR
});

// ============================================================================
// ASOCIACIONES USERS - CLIENTES
// ============================================================================

// User → Cliente (One-to-One)
Users.hasOne(Clientes, {
  foreignKey: 'user_id',
  as: 'clienteInfo',
  constraints: false, // ✅ AGREGAR
});

Clientes.belongsTo(Users, {
  foreignKey: 'user_id',
  as: 'user',
  constraints: false, // ✅ AGREGAR
});

// Clientes ↔ Ingenieros (Many-to-Many)
Clientes.belongsToMany(Users, {
  through: ClienteIngenieros,
  foreignKey: 'cliente_id',
  otherKey: 'user_id',
  as: 'ingenieros',
  constraints: false, // ✅ AGREGAR
});

Users.belongsToMany(Clientes, {
  through: ClienteIngenieros,
  foreignKey: 'user_id',
  otherKey: 'cliente_id',
  as: 'clientesAsignados',
  constraints: false, // ✅ AGREGAR
});

// ============================================================================
// ASOCIACIONES CLIENTES - TIPO CLIENTES
// ============================================================================

Clientes.belongsTo(TipoClientes, {
  foreignKey: 'tipo_cliente_id',
  as: 'tipoCliente',
  constraints: false, // ✅ AGREGAR
});

TipoClientes.hasMany(Clientes, {
  foreignKey: 'tipo_cliente_id',
  as: 'clientes',
  constraints: false, // ✅ AGREGAR
});

// ============================================================================
// ASOCIACIONES CLIENTES - ENTIDADES RELACIONADAS
// ============================================================================

Clientes.hasMany(Maquinas, {
  foreignKey: 'cliente_id',
  as: 'maquinas',
  constraints: false, // ✅ AGREGAR
});

Maquinas.belongsTo(Clientes, {
  foreignKey: 'cliente_id',
  as: 'cliente',
  constraints: false, // ✅ AGREGAR
});

Clientes.hasMany(Pozo, {
  foreignKey: 'cliente_id',
  as: 'pozos',
  constraints: false, // ✅ AGREGAR
});

Pozo.belongsTo(Clientes, {
  foreignKey: 'cliente_id',
  as: 'cliente',
  constraints: false, // ✅ AGREGAR
});

Clientes.hasMany(Jornada, {
  foreignKey: 'cliente_id',
  as: 'jornadas',
  constraints: false, // ✅ AGREGAR
});

Jornada.belongsTo(Clientes, {
  foreignKey: 'cliente_id',
  as: 'cliente',
  constraints: false, // ✅ AGREGAR
});

// ============================================================================
// ASOCIACIONES MAQUINAS
// ============================================================================

Maquinas.belongsTo(MaquinaTipo, {
  foreignKey: 'tipo_maquina',
  as: 'tipo',
  constraints: false, // ✅ AGREGAR
});

MaquinaTipo.hasMany(Maquinas, {
  foreignKey: 'tipo_maquina',
  as: 'maquinas',
  constraints: false, // ✅ AGREGAR
});

Maquinas.hasMany(Calibraciones, {
  foreignKey: 'maquina_id',
  as: 'calibracionesmaquina',
  constraints: false, // ✅ AGREGAR
});

Calibraciones.belongsTo(Maquinas, {
  foreignKey: 'maquina_id',
  as: 'maquina',
  constraints: false, // ✅ AGREGAR
});

// ============================================================================
// ASOCIACIONES POZOS - MUESTRAS DE AGUA
// ============================================================================

Pozo.hasMany(MuestraAgua, {
  foreignKey: 'pozo_id',
  as: 'muestrasAgua',
  constraints: false, // ✅ AGREGAR
});

MuestraAgua.belongsTo(Pozo, {
  foreignKey: 'pozo_id',
  as: 'pozo',
  constraints: false, // ✅ AGREGAR
});

// ============================================================================
// ASOCIACIONES Alertas  <==> TiposAlertas
// ============================================================================

// Cliente -> Alertas
Clientes.hasMany(AlertasServicios, {
  foreignKey: 'cliente_id',
  as: 'alertas',
});

AlertasServicios.belongsTo(Clientes, {
  foreignKey: 'cliente_id',
  as: 'cliente',
});

// TipoServicio -> Alertas
TipoServicios.hasMany(AlertasServicios, {
  foreignKey: 'tipo_servicio_id',
  as: 'alertas',
});

AlertasServicios.belongsTo(TipoServicios, {
  foreignKey: 'tipo_servicio_id',
  as: 'tipoServicio',
});

// ===============================================
// ASOCIACIONES Alertas  <==> MUESTRAS DE AGUA
// ===============================================

// 🔹 UNA alerta puede generar MUCHAS muestras
AlertasServicios.hasMany(MuestraAgua, {
  foreignKey: 'id_alerta_origen',
  as: 'alertaMuestras',
});

// 🔹 UNA muestra pertenece a UNA alerta (opcional)
MuestraAgua.belongsTo(AlertasServicios, {
  foreignKey: 'id_alerta_origen',
  as: 'muestrasAlerta',
});

// ===============================================
// ASOCIACIONES Alertas  <==> CALIBRACIONES
// ===============================================

// 🔹 UNA alerta puede generar MUCHAS muestras
AlertasServicios.hasMany(Calibraciones, {
  foreignKey: 'id_alerta_origen',
  as: 'calibracionesAlerta',
});

// 🔹 UNA muestra pertenece a UNA alerta (opcional)
Calibraciones.belongsTo(AlertasServicios, {
  foreignKey: 'id_alerta_origen',
  as: 'alertaCalibraciones',
});

// ===============================================
// ASOCIACIONES Alertas  <==> JORNADAS
// ===============================================

// 🔹 UNA alerta puede generar MUCHAS muestras
AlertasServicios.hasMany(Jornada, {
  foreignKey: 'id_alerta_origen',
  as: 'jornadaAlerta',
});

// 🔹 UNA muestra pertenece a UNA alerta (opcional)
Jornada.belongsTo(AlertasServicios, {
  foreignKey: 'id_alerta_origen',
  as: 'alertaJornada',
});

// ============================================================================
// EXPORTAR TODO
// ============================================================================
export { db };
export {
  Users,
  Roles,
  Permissions,
  UserRoles,
  RolePermissions,
  Clientes,
  ClienteIngenieros,
  Maquinas,
  Calibraciones,
  MaquinaTipo,
  Pozo,
  MuestraAgua,
  Jornada,
  TipoClientes,
  TipoServicios,
  AlertasServicios,
};
