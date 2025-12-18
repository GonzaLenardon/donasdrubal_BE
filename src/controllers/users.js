// import Users from '../models/users.js';
import { createUser } from '../services/userService.js';
import { Users, Roles, UserRoles, db } from '../models/index.js';
import jwt from 'jsonwebtoken';

const pruebaUser = async (req, res) => {
  console.log('haber que nos llega', req);
  return res.status(200).send('hola USUARIO QUERIDO');
};

const addUser = async (req, res) => {
  console.log('userController: body->', req.body);

  try {
    const t = await db.transaction();
    const { nombre, email, telefono, rol, role_id } = req.body;
    const password = req.body.password || '123456';

    if (!role_id) {
      return res.status(400).json({
        error: 'Debe indicar un role_id para el usuario',
      });
    }

    const userExist = await Users.findOne({ where: { email },transaction: t,});

    if (userExist) {
      return res.status(400).json({ error: 'Usuario ya existente' });
    }

    const resp = await Users.create({
      nombre,
      email,
      telefono,
      password,
    },
      { transaction: t }
    );


    // Crear relación user_roles
    await UserRoles.create(
      {
        user_id: resp.id, //new user_id
        role_id: role_id,
      },
      { transaction: t }
    );

    //Confirmar transacción
    await t.commit();
    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      data: resp,
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al agregar usuario:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

const updateUser = async (req, res) => {
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
    const resp = await Users.findAll({
      include: {
        model: Roles,
        as: 'roles',
        attributes: ['id', 'nombre'],
        through: { attributes: [] },
      },
    });

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

const allIngenieros = async (req, res) => {
  console.log('Usuario que hace la petición:', req.user.email);

  try {
    const ingenieros = await Users.findAll({
      where: { rol: 'ingeniero' },
      attributes: ['id', 'nombre'], // opcional
    });

    return res.status(200).json({
      message: 'Usuarios ingenieros obtenidos correctamente',
      data: ingenieros,
    });
  } catch (error) {
    console.error('Error al obtener usuarios ingenieros:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

const getUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const resp = await Users.findOne({ where: { user_id } });

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

  console.log('llego a Login', email, password);

  try {
    const user = await Users.findOne({
      where: { email },
      include: {
        model: Roles,
        as: 'roles', 
        attributes: ['id', 'nombre'],
        through: { attributes: [] }, // oculta user_roles
      },
    });
    if (!user)
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });

    const isValid = await user.validatePass(password);

    if (!isValid)
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    

    const payload = {
      id: user.id,
      email: user.email,
      rol: user.roles[0]?.nombre,
    };
    console.log('Payload JWT:', payload);
    console.log('Payload JWT:', user.roles);

    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '1h' });

    /*
    console.log(
      'sameSite',
      process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
    ); */

    res
      .cookie('Token', token, {
        /*  httpOnly: true, */
        httpOnly: true, // 🔥 Permite que document.cookie lo lea
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
        rol: user.roles[0]?.nombre,
        mensaje: 'Autorizado',
        token: token,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

const verify = async (req, res) => {
  const token = req.cookies.Token;
  if (!token) return res.sendStatus(401);

  try {
    jwt.verify(token, process.env.SECRET);
    res.sendStatus(200); // válido
  } catch {
    res.sendStatus(401); // token inválido / expirado
  }
};

const logout = (req, res) => {
  try {
    // Limpiar la cookie
    res.clearCookie('Token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo secure en producción

      sameSite: 'None',
      path: '/',
    });

    // Si usas sesiones, también destruirlas
    // req.session?.destroy();

    return res.status(200).json({
      message: 'Sesión cerrada correctamente',
      success: true,
    });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({
      message: 'Error al cerrar sesión',
      success: false,
    });
  }
};

export {
  addUser,
  updateUser,
  allUsers,
  allIngenieros,
  getUser,
  pruebaUser,
  login,
  verify,
  logout,
};
