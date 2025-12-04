import express from 'express';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import { checkRole } from '../middlewares/checkRoles.js';
import {
  addUser,
  allUsers,
  upUser,
  getUser,
  login,
  verify,
  logout,
} from '../controllers/users.js';
import {
  addRole,
  allRoles,
  upRole,
  getRole,
  downRole,
} from '../controllers/roles.js';
import {
  addPermission,
  allPermissions,
  downPermission,
  updatePermission,
  getPermissionById,
} from '../controllers/permissions.js';
import {
  allUserRoles,
  addUserRole,
  downUserRole,
  assignRoleToUser,
  getUserRoles,
} from '../controllers/user_roles.js';
import {
  allRolePermissions,
  addRolePermission,
  downRolePErmission,
} from '../controllers/role_permissions.js';
import {
  addClient,
  allClientes,
  upCliente,
  getCliente,
} from '../controllers/clients.js';
import {
  allMaquinas,
  addMaquina,
  maquinasUser,
  updateMaquina,
  maquinasCliente,
} from '../controllers/maquinas.js';
import {
  addCalibraciones,
  calibracionesMaquinas,
  updateCalibraciones,
} from '../controllers/calibraciones.js';

import * as maquinaTipoController from '../controllers/maquinas_tipos.js';

const router = express.Router();

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

router.get('/', (req, res) => {
  res.json({
    ok: true,
    mensaje: '¡Hola DON ASDRUBAL! 🚀',
    version: '1.0.0',
  });
});

router.post('/login', login);
router.post('/user', addUser);

// ========================================
// APLICAR MIDDLEWARE A TODAS LAS RUTAS SIGUIENTES
// ========================================

router.use(verifyToken); // 👈 A partir de aquí, todas requieren token

router.get('/auth/verify', verify);

// ========================================
// RUTAS PROTEGIDAS - USUARIOS
// ========================================

/* router.post('/user', verifyRole(['admin']), addUser); */ // Solo admin puede crear usuarios
router.post('/user', addUser); // Solo admin puede crear usuarios
router.post('/user/logout', logout);
router.get('/user', allUsers);
router.put('/user', upUser);
router.get('/user/:id', getUser);
router.post('/user/role', verifyRole(['admin']), assignRoleToUser);
router.get('/user/:userId/roles', getUserRoles);

// ========================================
// RUTAS PROTEGIDAS - CLIENTES
// ========================================

router.post('/cliente', verifyRole(['admin']), addClient);
router.get('/cliente', allClientes);
router.put('/cliente/:cliente_id', upCliente);
router.get('/cliente/:cliene_id', getCliente);

// ========================================
// RUTAS PROTEGIDAS - MÁQUINAS
// ========================================

router.get('/maquinas', allMaquinas);
router.get('/cliente/:cliente_id/maquinas', maquinasUser);
router.get('/cliente/:cliente_id/maquinas/', maquinasCliente);
router.post('/cliente/:cliente_id/maquinas', addMaquina);
router.put('/cliente/:cliente_id/maquinas/:id', updateMaquina);

// ========================================
// RUTAS PROTEGIDAS - CALIBRACIONES
// ========================================

router.post('/calibraciones', addCalibraciones);
router.get(
  '/cliente/:cliente_id/maquinas/:maquina_id/calibraciones/',
  calibracionesMaquinas
);
router.put('/calibraciones/:id', updateCalibraciones);

// ========================================
// RUTAS PROTEGIDAS - ROLES (Solo Admin)
// ========================================

router.get('/role', verifyRole(['admin']), getRole);
router.post('/role', verifyRole(['admin']), addRole);
router.get('/roles', verifyRole(['admin']), allRoles);
router.put('/role', verifyRole(['admin']), upRole);
router.delete('/role', verifyRole(['admin']), downRole);

// ========================================
// RUTAS PROTEGIDAS - PERMISOS (Solo Admin)
// ========================================

router.get('/permission', verifyRole(['admin']), getPermissionById);
router.post('/permission', verifyRole(['admin']), addPermission);
router.get('/permissions', verifyRole(['admin']), allPermissions);
router.put('/permission', verifyRole(['admin']), updatePermission);
router.delete('/Permission', verifyRole(['admin']), downPermission);

// ========================================
// RUTAS PROTEGIDAS - USER_ROLES (Solo Admin)
// ========================================

router.get('/user_role', verifyRole(['admin']), allUserRoles);
router.post('/user_role', verifyRole(['admin']), addUserRole);
router.delete('/user_role', verifyRole(['admin']), downUserRole);

// ========================================
// RUTAS PROTEGIDAS - ROLE_PERMISSIONS (Solo Admin)
// ========================================

router.get('/role_permission', verifyRole(['admin']), allRolePermissions);
router.post('/role_permission', verifyRole(['admin']), addRolePermission);
router.delete('/role_permission', verifyRole(['admin']), downRolePErmission);

// ========================================
// RUTAS PROTEGIDAS - ROLE_PERMISSIONS (Solo Admin)
// ========================================

router.get('/role_permission', verifyRole(['admin']), allRolePermissions);
router.post('/role_permission', verifyRole(['admin']), addRolePermission);
router.delete('/role_permission', verifyRole(['admin']), downRolePErmission);

// ========================================
// RUTAS PROTEGIDAS - MAQUINAS TIPOS (Solo Admin)
// ========================================

router.get('/maquinas_tipos', verifyRole(['admin']), maquinaTipoController.allMaquinaTipo);
router.post('/maquina_tipo', verifyRole(['admin']), maquinaTipoController.addMaquinaTipo);
router.put('/maquina_tipo', verifyRole(['admin']), maquinaTipoController.updateMaquinaTipo);
router.delete('/maquina_tipo', verifyRole(['admin']), maquinaTipoController.downMaquinaTipo);
router.get('/maquina_tipo/:maquina_tipo_id', verifyRole(['admin']), maquinaTipoController.getMaquinaTipo);





export { router };
