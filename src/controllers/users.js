import Users from '../models/users.js';
import { createUser } from '../services/userService.js';
import jwt from 'jsonwebtoken';

const pruebaUser = async (req, res) => {
  console.log('haber que nos llega', req);
  return res.status(200).send('hola USUARIO QUERIDO');
};

// const addUser = async (req, res) => {
//   console.log('paso x aca', req.body);
//   try {
//     const { nombre, cuit, domicilio, email, telefono, datosImpositivos, rol } =
//       req.body;
//     const password = req.body.password || '123456'; // 👈 default

//     const user = await Users.findOne({ where: { nombre } });

//     if (user) {
//       return res.status(400).json({ message: '¡Usuario ya existente!' });
//     }

//     const newUser = await Users.create({
//       nombre,
//       cuit,
//       domicilio,
//       email,
//       telefono,
//       datosImpositivos,
//       password,
//       rol,
//     });
//     res.status(201).json({ message: 'Usuario creado exitosamente', newUser });
//   } catch (error) {
//     console.error('Error al agregar usuario:', error);
//     res
//       .status(500)
//       .json({ error: 'Error en el servidor', details: error.message });
//   }
// };

const addUser = async (req, res) => {
  console.log('paso x aca', req.body);

  try {
    const { nombre, cuit, domicilio, email, telefono, datosImpositivos, rol } =
      req.body;
    const password = req.body.password || '123456';

    const user = await Users.findOne({ where: { nombre } });

    if (user) {
      return res.status(400).json({ error: 'Usuario ya existente' });
    }

    const resp = await Users.create({
      nombre,
      cuit,
      domicilio,
      email,
      telefono,
      datosImpositivos,
      password,
      rol,
    });

    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      data: resp,
    });
  } catch (error) {
    console.error('Error al agregar usuario:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
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

    if (!user) {
      return res.status(400).json({ error: 'Usuario no registrado' });
    }

    await Users.update(
      { nombre, rol, email, telefono, datosImpositivos, cuit, domicilio },
      { where: { id } }
    );

    return res
      .status(200)
      .json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

const allUsers = async (req, res) => {
  console.log('Usuario que hace la petición:', req.user.email);

  try {
    const resp = await Users.findAll();

    return res.status(200).json({
      message: 'Usuarios obtenidos correctamente',
      data: resp,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const resp = await Users.findOne({ where: { id } });

    if (!resp) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      message: 'Usuario obtenido correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });
    if (!user)
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });

    const isValid = await user.validatePass(password);

    if (!isValid)
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    const payload = {
      id: user.id,
      user: user.email,
      rol: user.rol,
    };

    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '8h' });

    /*
    console.log(
      'sameSite',
      process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
    ); */

    res
      .cookie('Token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax', // 👈 Funciona en localhost sin HTTPS
        maxAge: 4 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        ok: true,
        user: user.name,
        id: user.id,
        email: user.email,
        rol: user.rol,
        mensaje: 'Autorizado',
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

export { addUser, upUser, allUsers, getUser, pruebaUser, login };
