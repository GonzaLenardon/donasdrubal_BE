import express from 'express';
import { addUser, allUsers, upUser} from '../controllers/users.js';
import { addRole, allRoles, upRole, getRole, downRole } from '../controllers/roles.js';
import { addPermission, allPermissions, downPermission, updatePermission, getPermissionById } from '../controllers/permissions.js';
import { allUserRoles, addUserRole, downUserRole, assignRoleToUser, getUserRoles} from '../controllers/user_roles.js';
import { allRolePermissions, addRolePermission, downRolePErmission } from '../controllers/role_permissions.js';

const router = express.Router();



// ⚠️ el orden correcto es (req, res)
router.get('/', (req, res) => {
  res.send('Hola DON ASDRUBAL 🚀');
});

/* router.get('/user', addUser); */
router.post('/user', addUser);
router.get('/user', allUsers);
router.put('/user', upUser);
router.post('/user/role', assignRoleToUser);        // Asignar un rol a un usuario
router.get('/user/:userId/roles', getUserRoles);    // Obtener los roles de un usuario

/* ****** Rutas Roles **********/
router.get('/role', getRole);
router.post('/role', addRole);
router.get('/role', allRoles);
router.put('/role', upRole);
router.delete('/role', downRole);

/* ****** Rutas Permisos **********/
router.get('/role', getPermissionById);
router.post('/role', addPermission);
router.get('/role', allPermissions);
router.put('/role', updatePermission);
router.delete('/role', downPermission);

/* ****** Rutas User_Roles **********/
router.get('/user_role', allUserRoles);
router.post('/user_role', addUserRole);
router.delete('/user_role', downUserRole);  


/* ****** Rutas Role_Permissions **********/
router.get('/role_permission', allRolePermissions);
router.post('/role_permission', addRolePermission);
router.delete('/role_permission', downRolePErmission);  

export { router };
