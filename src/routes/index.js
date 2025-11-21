import express from 'express';
import { addUser, allUsers, upUser} from '../controllers/users.js';
import { addRole, allRoles, upRole, getRole, downRole } from '../controllers/roles.js';
import { addPermission, allPermissions, downPermission, updatePermission, getPermissionById } from '../controllers/permissions.js';
import { allUserRoles, addUserRole, downUserRole, assignRoleToUser, getUserRoles} from '../controllers/user_roles.js';
import { allRolePermissions, addRolePermission, downRolePErmission } from '../controllers/role_permissions.js';
import { addClient } from '../controllers/clients.js';
import {
  allMaquinas,
  addMaquina,
  maquinasUser,
  updateMaquina,
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

router.get('/maquinas', allMaquinas);
router.get('/maquinas/:user', maquinasUser);
router.post('/maquinas', addMaquina);
router.put('/maquinas', updateMaquina);

/* ****** Rutas Calibraciones **********/
router.post('/calibraciones', addCalibraciones);
router.get('/calibraciones/:maquina', calibracionesMaquinas);
router.put('/calibraciones/:id', updateCalibraciones);

export { router };
