import User from '../models/users.js';
import Cliente from '../models/clientes.js';
import { createUser } from '../services/userService.js';


// const bcrypt = require('bcrypt');

const addClient = async (req, res) => {
  try {
    const {
      user_nombre,
      user_email,
      user_password,
      categoria = 'medio',
      razon_social,
      direccion_fiscal,
      cuil_cuit,
      iva_id,
      telefono,
      direccion,
      ciudad,
      provincia = 'Entre Ríos',
      pais = 'Argentina',
      estado = 'Nuevo',
      modo_ingreso = 'Web',
      notas, 
      rol = 'cliente'

    } = req.body;

    // 1. Crear usuario

        // Crear usuario usando el servicio que ya tenés
    const newUser = await createUser({
      nombre : user_nombre,
      telefono : telefono,  
      email : user_email,
      password : user_password,

    });
   
    // 2. Crear cliente asociado
    const newClient = await Cliente.create({
      user_id: newUser.id,
      categoria,
      razon_social,
      direccion_fiscal,
      cuil_cuit,
      iva_id,
      telefono,
      direccion,
      ciudad,
      provincia,
      pais,
      estado,
      modo_ingreso,
      notas,     

    });


    res.status(201).json({
      message: 'Cliente y usuario creados correctamente',
      newClient,
      newUser
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


// Listar clientes con usuario
const allClientes = async (req, res) => {
  try {
    const clients = await Cliente.findAll({
      include: [{ model: User, as: 'user' }],
    });

     return res.status(200).json({
      message: 'Clientes obtenidos correctamente',
      data: clients,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

// Actualizar cliente + usuario
const upCliente = async (req, res) => {
  try {
    const client = await Cliente.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    const user = await User.findByPk(client.user_id);

    // Actualizar usuario
    await user.update({
      nombre: req.body.nombre,
      email: req.body.email,
      telefono: req.body.telefono,
    });

    // Actualizar cliente
    await client.update({
      razon_social: req.body.razon_social,
      domicilio: req.body.domicilio,
      telefono: req.body.telefono,
      email: req.body.email,
    });

    res.json({ message: 'Cliente actualizado', client, user });
  } catch (error) {
    console.error('Error al actualizar cliente', error);
    res.status(500).json({ error: error.message });
  }
};

//  Eliminar cliente + usuario
const deleteClient = async (req, res) => {
  try {
    const client = await Cliente.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    await User.destroy({ where: { id: client.user_id } });
    await Cliente.destroy({ where: { id: client.id } });

    res.json({ message: 'Cliente y usuario eliminados' });
  } catch (error) {
    console.error('❌ Error al eliminar cliente', error);
    res.status(500).json({ error: error.message });
  }
};

const getCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const resp = await Cliente.findOne({
      include: [{ model: User, as: 'user' }],
    }, { where: { id } });

    if (!resp) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.status(200).json({
      message: 'Cliente obtenido correctamente',
      data: resp,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};


export { addClient, allClientes, upCliente, getCliente} ;