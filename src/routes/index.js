import express from 'express';
import { addUser, allUsers, getUser, upUser } from '../controllers/users.js';
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
router.get('/user/:id', getUser);

router.get('/maquinas', allMaquinas);
router.get('/maquinas/:user', maquinasUser);
router.post('/maquinas', addMaquina);
router.put('/maquinas', updateMaquina);

router.post('/calibraciones', addCalibraciones);
router.get('/calibraciones/:maquina', calibracionesMaquinas);
router.put('/calibraciones/:id', updateCalibraciones);

export { router };
