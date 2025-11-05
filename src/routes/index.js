import express from 'express';
import { addUser, allUsers, upUser } from '../controllers/users.js';

const router = express.Router();

// ⚠️ el orden correcto es (req, res)
router.get('/', (req, res) => {
  res.send('Hola DON ASDRUBAL 🚀');
});

/* router.get('/user', addUser); */
router.post('/user', addUser);
router.get('/user', allUsers);
router.put('/user', upUser);

export { router };
