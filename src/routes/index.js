import express from 'express';
import { addUser, allUsers, upUser } from '../controllers/users.js';
import {
  allMaquinas,
  addMaquina,
  maquinasUser,
} from '../controllers/maquinas.js';
import {
  addCalibraciones,
  calibracionesMaquinas,
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

router.post('/calibraciones', addCalibraciones);
router.get('/calibraciones/:maquina', calibracionesMaquinas);

export { router };
