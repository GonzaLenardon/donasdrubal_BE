import User from '../models/users.js';
import Cliente from '../models/clientes.js';
import { createUser } from '../services/userService.js';


// const bcrypt = require('bcrypt');

const addClient = async (req, res) => {
  try {
    // const {
    //   nombre,
    //   email,
    //   password,
    //   categoria = 'medio',
    //   razon_social,
    //   direccion_fiscal,
    //   cuil_cuit,
    //   iva_id,
    //   telefono,
    //   direccion,
    //   ciudad,
    //   provincia = 'Entre Ríos',
    //   pais = 'Argentina',
    //   estado = 'Nuevo',
    //   modo_ingreso = 'Web',
    //   notas, 
    //   rol = 'cliente'

    // } = req.body;

    // 1. Crear usuario

        // Crear usuario usando el servicio que ya tenés
    const newUser = await createUser({
      ...req.body,
      rol: 'cliente',
    });
   
    // 2. Crear cliente asociado
    const newClient = await Cliente.create({
      ...req.body,
      user_id: newUser.id,

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
export const listClients = async (req, res) => {
  try {
    const clients = await Cliente.findAll({
      include: [{ model: Users, as: 'user' }],
    });

    res.json(clients);
  } catch (error) {
    console.error('Error al listar clientes', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar cliente + usuario
export const updateClient = async (req, res) => {
  try {
    const client = await Cliente.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    const user = await Users.findByPk(client.user_id);

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
export const deleteClient = async (req, res) => {
  try {
    const client = await Cliente.findByPk(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado' });

    await Users.destroy({ where: { id: client.user_id } });
    await Cliente.destroy({ where: { id: client.id } });

    res.json({ message: 'Cliente y usuario eliminados' });
  } catch (error) {
    console.error('❌ Error al eliminar cliente', error);
    res.status(500).json({ error: error.message });
  }
};


export { addClient };