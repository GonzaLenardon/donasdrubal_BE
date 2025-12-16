import express from 'express';

import {
  addUser,
  allUsers,
  upUser,
  getUser,
  login,
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

const router = express.Router();

// ⚠️ el orden correcto es (req, res)
router.get('/', (req, res) => {
  res.send('Hola DON ASDRUBAL 🚀');
});

/* router.get('/user', addUser); */
router.post('/user', addUser);
router.get('/user', allUsers);
router.put('/user', upUser);
router.get('/user/:id', getUser);
router.post('/user/role', assignRoleToUser); // Asignar un rol a un usuario
router.get('/user/:userId/roles', getUserRoles); // Obtener los roles de un usuario

/* ****** Rutas Cliente **********/

router.get('/maquinas', allMaquinas);
router.get('/maquinas/:user', maquinasUser);
// router.get('/cliente/:user/maquinas/', maquinasCliente);
router.get('/cliente/:cliente_id/maquinas/', maquinasCliente);
router.post('/maquinas', addMaquina);
router.put('/maquinas', updateMaquina);

router.post('/calibraciones', addCalibraciones);
router.get('/calibraciones/:maquina', calibracionesMaquinas);
router.put('/calibraciones/:id', updateCalibraciones);

/* ****** Rutas Cliente **********/
router.post('/cliente', addClient);
router.get('/cliente', allClientes);
router.put('/cliente', upCliente);
router.get('/cliente/:id', getCliente);



/* ****** Rutas Roles **********/
router.get('/role', getRole);
router.post('/role', addRole);
router.get('/roles', allRoles);
router.put('/role', upRole);
router.delete('/role', downRole);

/* ****** Rutas Permisos **********/
router.get('/permission', getPermissionById);
router.post('/permission', addPermission);
router.get('/permissions', allPermissions);
router.put('/permission', updatePermission);
router.delete('/Permission', downPermission);

/* ****** Rutas User_Roles **********/
router.get('/user_role', allUserRoles);
router.post('/user_role', addUserRole);
router.delete('/user_role', downUserRole);
router.post('/login', login);

/* ****** Rutas Role_Permissions **********/
router.get('/role_permission', allRolePermissions);
router.post('/role_permission', addRolePermission);
router.delete('/role_permission', downRolePErmission);

export { router };
