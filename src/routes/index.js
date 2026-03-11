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
import * as dashboardController from '../controllers/clienteDashboard.js';
import pdfMuetraAguaService from '../services/pdfMuestraAguaService.js';
import { uploadArchivo } from '../utils/uploadFiles.js';

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
router.put('/calibraciones/:calibracion_id', calibracionController.updateCalibraciones);
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

router.get(
  '/maquinas_tipos',
  verifyRole([ROLES.ADMIN]),
  maquinaTipoController.allMaquinaTipo,
);
router.post(
  '/maquina_tipo',
  verifyRole([ROLES.ADMIN]),
  maquinaTipoController.addMaquinaTipo,
);
router.put(
  '/maquina_tipo/:maquina_tipo_id',
  verifyRole([ROLES.ADMIN]),
  maquinaTipoController.updateMaquinaTipo,
);
router.delete(
  '/maquina_tipo',
  verifyRole([ROLES.ADMIN]),
  maquinaTipoController.downMaquinaTipo,
);
router.get(
  '/maquina_tipo/:maquina_tipo_id',
  verifyRole([ROLES.ADMIN]),
  maquinaTipoController.getMaquinaTipo,
);

// ========================================
// RUTAS PROTEGIDAS - POZOS
// ========================================

router.get('/pozos', pozoController.allPozos);
router.get('/pozos/:pozo_id', pozoController.getPozo);
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

router.post('/alertaservicios', controllersAlertas.add);

router.post('/alertas', controllersAlertas.addAllService);
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

router.post('/informes/pozos', async (req, res) => {

  try {
    console.log('Request recibido para generar informe de pozos', req.body);
    const { cliente_id, pozos_ids } = req.body;

    if (!cliente_id) {
      return res.status(400).json({
        error: 'cliente_id requerido'
      });
    }

    if (!Array.isArray(pozos_ids) || pozos_ids.length === 0) {
      return res.status(400).json({
        error: 'Debe enviar un array de pozos_ids'
      });
    }

    const { pdfBytes, filename } =
      await pdfMuetraAguaService.generarInformeCalidadAgua(
        cliente_id,
        pozos_ids
      );

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    res.send(Buffer.from(pdfBytes));

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 'Error generando el PDF'
    });

  }

});

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

router.get('/cliente/:cliente_id/stats', dashboardController.getClienteStats);

router.get(
  '/cliente/:cliente_id/services-chart',
  dashboardController.getClienteServicesChart,
);

router.get(
  '/cliente/:cliente_id/machines-chart',
  dashboardController.getClienteMachinesChart,
);

router.get(
  '/cliente/:cliente_id/upcoming-services',
  dashboardController.getClienteUpcomingServices,
);

router.post('/informes/pozos', pozoController.multiInformesPozos);

/*=========================================
  FIN RUTAS PROTEGIDAS - DASHBOARD CLIENTE
=========================================*/
export { router };
