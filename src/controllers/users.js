import Users from '../models/users.js';

const pruebaUser = async (req, res) => {
  console.log('haber que nos llega', req);
  res.send('hola USUARIO QUERIDO');
};

const addUser = async (req, res) => {
  console.log('paso x aca', req.body);
  try {
    const { nombre, rol } = req.body;
    const password = req.body.password || '123456'; // 👈 default

    const user = await Users.findOne({ where: { nombre } });

    if (user) {
      return res.status(400).json({ message: '¡Usuario ya existente!' });
    }

    const newUser = await Users.create({
      nombre,
      password,
      rol,
    });
    res.status(201).json({ message: 'Usuario creado exitosamente', newUser });
  } catch (error) {
    console.error('Error al agregar usuario:', error);
    res
      .status(500)
      .json({ error: 'Error en el servidor', details: error.message });
  }
};

const allUsers = async (req, res) => {
  try {
    const users = await Users.findAll();
    res.status(200).json(users);
  } catch {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export { addUser, allUsers };
