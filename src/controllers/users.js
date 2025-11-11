import Users from '../models/users.js';

const pruebaUser = async (req, res) => {
  console.log('haber que nos llega', req);
  res.send('hola USUARIO QUERIDO');
};

const addUser = async (req, res) => {
  console.log('paso x aca', req.body);
  try {
    const { nombre, cuit, domicilio, email, telefono, datosImpositivos, rol } =
      req.body;
    const password = req.body.password || '123456'; // 👈 default

    const user = await Users.findOne({ where: { nombre } });

    if (user) {
      return res.status(400).json({ message: '¡Usuario ya existente!' });
    }

    const newUser = await Users.create({
      nombre,
      cuit,
      domicilio,
      email,
      telefono,
      datosImpositivos,
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

const upUser = async (req, res) => {
  try {
    const {
      id,
      nombre,
      rol,
      email,
      telefono,
      datosImpositivos,
      cuit,
      domicilio,
    } = req.body;
    const user = await Users.findOne({ where: { id } });
    /*   console.log('usuario', user); */

    if (!user) {
      return res.status(400).json({ message: '¡Usuario NO está registrado!' });
    }

    await Users.update(
      { nombre, rol, email, telefono, datosImpositivos, cuit, domicilio },
      { where: { id } }
    );

    res.status(201).json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res
      .status(500)
      .json({ error: 'Error en el servidor', details: error.message });
  }
};

const allUsers = async (req, res) => {
  try {
    const users = await Users.findAll();
    console.log('Usuario', users);
    res.status(200).json(users);
  } catch (error) {
    console.log('Error ', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export { addUser, upUser, allUsers };
