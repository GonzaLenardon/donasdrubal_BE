import Users from '../models/users.js';

const createUser = async (userData) => {
  const {
    nombre,
    cuit = userData.cuil_cuit || '00-00000000-0',
    domicilio = userData.direccion || 'Sin domicilio',
    email,
    telefono,
    datosImpositivos = 'monotributo',
    password = userData.password || '123456',
    rol = userData.rol || 'cliente'
  } = userData;

  const exist = await Users.findOne({ where: { email } });

  if (exist) {
    throw new Error('El usuario ya existe con ese email');
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

  return newUser;
};

export { createUser };  