import express from 'express';
import { ROLES } from '../config/constants/roles.js';
import { verifyToken, verifyRole } from '../middlewares/auth.js';
import {
  addUser,
  allUsers,
  updateUser,
  getUser,
  login,
  verify,
  logout,
  allIngenieros,
} from '../controllers/users.js';
import {
  addRole,
  allRoles,
  updateRole,
  getRole,
  deleteRole,
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
  delMaquina,
} from '../controllers/maquinas.js';
// import {
//   addCalibraciones,
//   calibracionesMaquinas,
//   updateCalibraciones,
//   uploadArchivoCalibracion,
//   generarPDF,
//   previsualizarPDF,
//   enviarPDFPorEmail,
//   limpiarPDFsAntiguos,
// } from '../controllers/calibraciones.js';
import * as calibracionController from '../controllers/calibraciones.js';
import { allTipoClientes } from '../controllers/tipoClientes.js';

import { uploadCalibraciones } from '../middlewares/uploadCalibraciones.js';
import { uploadMuestrasAgua } from '../middlewares/uploadMuestras.js';

import * as maquinaTipoController from '../controllers/maquinas_tipos.js';
import * as pozoController from '../controllers/pozos.js';
import * as muestrasAguaController from '../controllers/muestras_agua.js';
import * as jornadaController from '../controllers/jornadas.js';
import controllersTipoServicios from '../controllers/tipoServicios.js';
import controllersAlertas from '../controllers/alertas.js';
import * as clientDashboardController from '../controllers/clienteDashboard.js';
import * as userDashboard from '../controllers/userDashboard.js';

import pdfMuetraAguaService from '../services/pdf/pdfMuestraAguaService.js';
import { uploadArchivo } from '../utils/files/uploadFiles.js';
import InformesPdf from '../controllers/informesPdf.js';
import * as notas from '../controllers/notas.js';

const router = express.Router();

// ========================================
// RUTAS PÚBLICAS (sin autenticación)
// ========================================

router.get('/', (req, res) => {
  res.json({
    ok: true,
    mensaje: '¡Hola DON ASDRUBAL! 🚀',
    version: '3.1.0',
  });
});

router.post('/login', login);
router.post('/user', addUser);

/**
 * @route   GET /api/calibraciones/:id/preview-pdf
 * @desc    Visualiza el PDF en el navegador
 * @access  Private
 */
router.get(
  '/calibraciones/:id/preview-pdf',
  // authMiddleware,
  calibracionController.previsualizarPDF,
);

// ========================================
// APLICAR MIDDLEWARE A TODAS LAS RUTAS SIGUIENTES
// ========================================

router.use(verifyToken); // 👈 A partir de aquí, todas requieren token

router.get('/auth/verify', verify);

// ========================================
// RUTAS PROTEGIDAS - USUARIOS
// ========================================

/* router.post('/user', verifyRole([ROLES.ADMIN]), addUser); */ // Solo admin puede crear usuarios
router.post('/user', addUser); // Solo admin puede crear usuarios
router.post('/user/logout', logout);
router.get('/user', allUsers);
router.get('/user/ingenieros', allIngenieros);
router.put('/user', updateUser);
router.get('/user/:user_id', getUser);
router.post('/user/role', verifyRole([ROLES.ADMIN]), assignRoleToUser);
router.get('/user/:user_id/roles', getUserRoles);

// ========================================
// RUTAS PROTEGIDAS - CLIENTES
// ========================================

router.post('/cliente', verifyRole([ROLES.ADMIN]), addClient);
router.get('/cliente', allClientes);
router.put('/cliente/:cliente_id', upCliente);
router.get('/cliente/:cliente_id', getCliente);

// ========================================
// RUTAS PROTEGIDAS - MÁQUINAS
// ========================================

router.get('/maquinas', allMaquinas);
router.delete('/maquinas/:id', verifyRole([ROLES.ADMIN]), delMaquina);

/* router.get('/cliente/:cliente_id/maquinas', maquinasUser); */
router.get('/cliente/:cliente_id/maquinas/', maquinasCliente);
router.post('/cliente/:cliente_id/maquinas', addMaquina);
router.put('/cliente/:cliente_id/maquinas/:maquina_id', updateMaquina);

// ========================================
// RUTAS PROTEGIDAS - CALIBRACIONES
// ========================================

router.post('/calibraciones', calibracionController.addCalibraciones);
router.get(
  '/cliente/:cliente_id/maquinas/:maquina_id/calibraciones/',
  calibracionController.calibracionesMaquinas,
);
router.put(
  '/calibraciones/:calibracion_id',
  calibracionController.updateCalibraciones,
);

router.put(
  '/calibraciones/close/:id',
  calibracionController.closeCalibraciones,
);

router.put('/calibraciones/open/:id', calibracionController.openCalibraciones);
router.delete(
  '/calibraciones',
  verifyRole([ROLES.ADMIN]),
  calibracionController.delCalibraciones,
);

/*router.post(
  '/calibraciones/upload',
  (req, res, next) => {
    console.log('Request de upload recibida');
    next();
  },
  uploadCalibraciones.single('file'),
  uploadArchivoCalibracion,
); */

router.post(
  '/calibraciones/upload',
  uploadCalibraciones.single('file'),
  uploadArchivo,
);

router.post(
  '/muestrasAgua/upload',
  uploadMuestrasAgua.single('file'),
  uploadArchivo,
);

// ========================================
// RUTAS PROTEGIDAS - ROLES (Solo Admin)
// ========================================

router.get('/roles/:role_id', verifyRole([ROLES.ADMIN]), getRole);
router.post('/roles', verifyRole([ROLES.ADMIN]), addRole);
router.get('/roles', verifyRole([ROLES.ADMIN]), allRoles);
router.put('/roles/:role_id', verifyRole([ROLES.ADMIN]), updateRole);
router.delete('/roles/:role_id', verifyRole([ROLES.ADMIN]), deleteRole);
// ========================================
// RUTAS PROTEGIDAS - PERMISOS (Solo Admin)
// ========================================

router.get(
  '/permissions/:permission_id',
  verifyRole([ROLES.ADMIN]),
  getPermissionById,
);
router.post('/permissions', verifyRole([ROLES.ADMIN]), addPermission);
router.get('/permissions', verifyRole([ROLES.ADMIN]), allPermissions);
router.put(
  '/permissions/:permission_id',
  verifyRole([ROLES.ADMIN]),
  updatePermission,
);
router.delete(
  '/permissions/:permission_id',
  verifyRole([ROLES.ADMIN]),
  downPermission,
);

// ========================================
// RUTAS PROTEGIDAS - USER_ROLES (Solo Admin)
// ========================================

// router.get('/user_roles', verifyRole([ROLES.ADMIN]), allUserRoles);
// router.get('/user_roles/:user_id', verifyRole([ROLES.ADMIN]), getUserRoles);
// router.post('/user_roles', verifyRole([ROLES.ADMIN]), addUserRole);
// router.delete('/user_roles/:user_id', verifyRole([ROLES.ADMIN]), downUserRole);

// ========================================
// RUTAS PROTEGIDAS - ROLE_PERMISSIONS (Solo Admin)
// ========================================

// router.get('/role_permissions', verifyRole([ROLES.ADMIN]), allRolePermissions);
// router.post('/role_permissions', verifyRole([ROLES.ADMIN]), addRolePermission);
// router.delete('/role_permissions', verifyRole([ROLES.ADMIN]), downRolePErmission);

// // ========================================
// // RUTAS PROTEGIDAS - ROLE_PERMISSIONS (Solo Admin)
// // ========================================

// router.get('/role_permission', verifyRole([ROLES.ADMIN]), allRolePermissions);
// router.post('/role_permission', verifyRole([ROLES.ADMIN]), addRolePermission);
// router.delete('/role_permission', verifyRole([ROLES.ADMIN]), downRolePErmission);

// ========================================
// RUTAS PROTEGIDAS - MAQUINAS TIPOS (Solo Admin)
// ========================================

router.get('/maquinas_tipos', maquinaTipoController.allMaquinaTipo);
router.post('/maquina_tipo', maquinaTipoController.addMaquinaTipo);
router.put(
  '/maquina_tipo/:maquina_tipo_id',
  maquinaTipoController.updateMaquinaTipo,
);
router.delete(
  '/maquina_tipo',
  verifyRole([ROLES.ADMIN]),
  maquinaTipoController.downMaquinaTipo,
);
router.get(
  '/maquina_tipo/:maquina_tipo_id',
  maquinaTipoController.getMaquinaTipo,
);

// ========================================
// RUTAS PROTEGIDAS - POZOS
// ========================================

router.get('/pozos', pozoController.allPozos);
router.get('/pozos/:pozo_id', pozoController.getPozo);
router.delete('/pozos/:id', verifyRole([ROLES.ADMIN]), pozoController.delPozo);
router.get('/cliente/:cliente_id/pozos', pozoController.pozosCliente);
router.post('/cliente/:cliente_id/pozos', pozoController.addPozo);
router.put('/cliente/:cliente_id/pozos/:pozo_id', pozoController.updatePozo);

// ========================================
// RUTAS PROTEGIDAS - MUESTRAS AGUA
// ========================================

router.get('/muestras_agua', muestrasAguaController.allMuestrasAgua);
router.get(
  '/muestras_agua/:muestra_agua_id',
  muestrasAguaController.getMuestrasAgua,
);
router.post('/muestras_agua', muestrasAguaController.addMuestraAgua);
router.put(
  '/muestras_agua/:muestra_agua_id',
  muestrasAguaController.updateMuestraAgua,
);

router.put(
  '/muestras_agua/close/:muestra_agua_id',
  muestrasAguaController.closeMuestraAgua,
);

router.put(
  '/muestras_agua/open/:muestra_agua_id',
  muestrasAguaController.openMuestraAgua,
);

router.delete(
  '/muestras_agua',
  verifyRole([ROLES.ADMIN]),
  muestrasAguaController.delMuestrasAgua,
);

router.get(
  '/pozos/:pozo_id/muestras_agua',
  muestrasAguaController.getMuestrasAguaPozo,
);
router.get(
  '/pozos/:pozo_id/muestras_agua/:muestra_agua_id',
  muestrasAguaController.getMuestraAguaPozo,
);
router.get(
  '/cliente/:cliente_id/pozos/:pozo_id/muestras_agua',
  muestrasAguaController.getMuestrasAguaPozoCliente,
);
router.get(
  '/cliente/:cliente_id/pozos/:pozo_id/muestras_agua/:muestra_agua_id',
  muestrasAguaController.getMuestraAguaPozoCliente,
);

// ========================================
// RUTAS PROTEGIDAS - JORNADAS
// ========================================

router.get('/jornadas', jornadaController.allJornadas);
router.get('/jornadas/:jornada_id', jornadaController.getJornada);
router.get('/cliente/:cliente_id/jornadas', jornadaController.jornadasCliente);
router.post('/cliente/:cliente_id/jornadas', jornadaController.addJornada);
router.put('/jornadas/close/:id', jornadaController.closeJornada);
router.put('/jornadas/open/:id', jornadaController.openJornada);
router.delete(
  '/jornadas/:id',
  verifyRole([ROLES.ADMIN]),
  jornadaController.delJornada,
);

router.put(
  '/cliente/:cliente_id/jornadas/:jornada_id',
  jornadaController.updateJornada,
);

// ========================================
// RUTAS PROTEGIDAS - TIPO CLIENTES
// ========================================

router.get('/tipoclientes', allTipoClientes);

// ========================================
// RUTAS PROTEGIDAS - TIPOS DE SERVICIOS
// ========================================

router.post('/tiposervicios', controllersTipoServicios.add);

// ========================================
// RUTAS PROTEGIDAS - ALERTAS SERVICIOS
// ========================================

router.post('/alertas', controllersAlertas.add);
router.put('/alertas/:alerta_id', controllersAlertas.update);
router.delete('/alertas/:alerta_id', controllersAlertas.deleteAlerta);
router.post('/alertaservicios', controllersAlertas.addAllService);
router.get('/alertas/to_user/:to_user_id', controllersAlertas.getByUserToId);
router.get(
  '/alertas/from_user/:from_user_id',
  controllersAlertas.getByUserFromId,
);
// =============================================================
// RUTAS PROTEGIDAS - GENERACION INFORMES PDF MUESTRAS DE AGUA
// =============================================================
/**
 * @route   POST /informes/pozos
 * @desc    Genera y descarga el PDF de una calibración
 * @access  Private
 * @query   download=true (opcional) - fuerza descarga vs retornar info
 */
router.post(
  '/informes/pozos_ok',
  // authMiddleware, // Descomentar si usas autenticación
  muestrasAguaController.previssualizarPdf,
);

router.post('/informes/pozos', InformesPdf.muestraPozos);

router.get('/informes/muestra/:muestra_id', InformesPdf.muestraAgua);

// =============================================================
// RUTAS PROTEGIDAS - GENERACION INFORMES PDF CALIBRACIONES
// =============================================================

/**
 * @route   GET /api/calibraciones/:id/pdf
 * @desc    Genera y descarga el PDF de una calibración
 * @access  Private
 * @query   download=true (opcional) - fuerza descarga vs retornar info
 */
router.get(
  '/calibraciones/:id/pdf',
  // authMiddleware, // Descomentar si usas autenticación
  calibracionController.generarPDF,
);

/**
 * @route   GET /api/calibraciones/:id/preview-pdf
 * @desc    Visualiza el PDF en el navegador
 * @access  Private
 */

// router.get(
//   '/calibraciones/:id/preview-pdf',
//   // authMiddleware,
//   previsualizarPDF
// );

/**
 * @route   POST /api/calibraciones/:id/email-pdf
 * @desc    Genera y envía el PDF por email
 * @access  Private
 * @body    { email: string }
 */
router.post(
  '/calibraciones/:id/email-pdf',
  // authMiddleware,
  calibracionController.enviarPDFPorEmail,
);

/**
 * @route   DELETE /api/calibraciones/pdfs/cleanup
 * @desc    Limpia PDFs antiguos del servidor
 * @access  Admin only
 * @query   dias=30 (opcional) - días de retención
 */
router.delete(
  '/calibraciones/pdfs/cleanup',
  // authMiddleware,
  // adminMiddleware, // Solo administradores
  calibracionController.limpiarPDFsAntiguos,
);

/*=========================================
  RUTAS PROTEGIDAS - DASHBOARD CLIENTE
=========================================*/

router.get(
  '/cliente/:cliente_id/stats',
  clientDashboardController.getClienteStats,
);

router.get(
  '/cliente/:cliente_id/analisis-chart',
  clientDashboardController.getClienteAnalisisChart,
);
router.get(
  '/cliente/:cliente_id/calibraciones-chart',
  clientDashboardController.getClienteCalibracionesChart,
);
router.get(
  '/cliente/:cliente_id/jornadas-chart',
  clientDashboardController.getClienteJornadasChart,
);

router.get(
  '/cliente/:cliente_id/services-chart',
  clientDashboardController.getClienteServicesChart,
);

router.get(
  '/cliente/:cliente_id/machines-chart',
  clientDashboardController.getClienteMachinesChart,
);

router.get(
  '/cliente/:cliente_id/upcoming-services',
  clientDashboardController.getClienteUpcomingServices,
);

// router.post('/informes/pozos', pozoController.multiInformesPozos);

router.post('/dashboard/user/services', userDashboard.getUserServices);

router.post('/dashboard/user/machines', userDashboard.getUserMachine);

/* router.post('/dashboard/user/all', userDashboard.allServicesToClients); */

router.get(
  '/dashboard/user/servicesToClients',
  userDashboard.allServicesToClients,
);
router.get('/dashboard/services/totales', userDashboard.getDashboardTotals);

router.get('/clientes/:cliente_id/notas', notas.allNotas);
router.post('/clientes/:cliente_id/notas', notas.addNotas);
router.delete('/clientes/:cliente_id/notas/:id', notas.deleteNota);
router.put(`/clientes/:cliente_id/notas/:id`, notas.updateNota);
router.get('/user/:usuario_id/notas', notas.allNotasUser);

/*=========================================
  FIN RUTAS PROTEGIDAS - DASHBOARD CLIENTE
=========================================*/
export { router };
