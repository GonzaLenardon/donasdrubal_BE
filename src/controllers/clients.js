
import ROLES from '../config/constants/roles.js';
import Cliente from '../models/clientes.js';
import Roles from '../models/roles.js';
import UserRoles from '../models/user_roles.js';  
import { createUser } from '../services/userService.js';
import db from '../config/database.js';

// const bcrypt = require('bcrypt');

const addClient = async (req, res) => {
  // Iniciar transacción
  const t = await db.transaction();

  try {
    const {
      categoria,
      razon_social,
      direccion_fiscal,
      cuil_cuit,
      email,
      iva_id,
      telefono,
      direccion,
      ciudad,
      provincia,
      pais,
      estado,
      modo_ingreso,
      ingeniero_id,
      notas,
    } = req.body;

    console.log('esto llega al body', req.body);

    // Validaciones

    if (!email || !razon_social || !cuil_cuit) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        error: 'Faltan datos del cliente ',
      });
    }

    // 1️⃣ Crear usuario dentro de la transacción
    
    const newUser = await User.create(
      {
        nombre: razon_social,
        email: email,
        password: '123456',
        telefono: telefono,
        // rol: 'cliente',
        active: true,
      },
      { transaction: t } // 👈 Usar transacción
    );

    // Busco el id del rol Cliente
    const role = await Roles.findOne(
      { where: { nombre: [ROLES.CLIENTE] } },
      { transaction: t }
    ); 
    if (!role) {
      throw new Error('Rol "Cliente" no existe');
    }
    await UserRoles.create(
      {
        user_id: newUser.id, //new user_id
        role_id: role.id,
      },
      { transaction: t }
    );

    console.log('✅ Usuario creado:', newUser.email);

    // 2️⃣ Crear cliente dentro de la transacción
    const newClient = await Cliente.create(
      {
        user_id: newUser.id,
        categoria: categoria || 'medio',
        razon_social,
        direccion_fiscal,
        cuil_cuit,
        iva_id,
        telefono,
        direccion,
        ciudad,
        provincia: provincia || 'Entre Ríos',
        pais: pais || 'Argentina',
        estado: estado || 'Nuevo',
        modo_ingreso: modo_ingreso || 'Web',
        ingeniero_id,
        notas,
        email,
      },
      { transaction: t } // 👈 Usar transacción
    );

    console.log('✅ Cliente creado:', newClient.razon_social);

    // ✅ Si todo salió bien, confirmar transacción
    await t.commit();

    res.status(201).json({
      ok: true,
      message: 'Cliente y usuario creados correctamente',
      cliente: {
        id: newClient.id,
        razon_social: newClient.razon_social,
        categoria: newClient.categoria,
      },
      usuario: {
        id: newUser.id,
        nombre: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    // ❌ Si hay error, revertir TODO
    await t.rollback();

    console.error('❌ Error al crear cliente:', error);

    res.status(500).json({
      ok: false,
      error: error.message,
      tipo: error.name,
    });
  }
};

// Listar clientes con usuario
const allClientes = async (req, res) => {
  try {
    /* const clients = await Cliente.findAll({
      include: [{ model: User, as: 'user' }],
    }); */

    const clients = await Cliente.findAll();
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
  console.log('📝 Actualizar cliente - Body:', req.body);
  console.log('📝 Actualizar cliente - Params:', req.params);

  try {
    // 1️⃣ Obtener ID de los parámetros
    const id = req.params.cliente_id; // 👈 Corregido: extraer id del objeto

    // Validar que exista el ID
    if (!id) {
      return res.status(400).json({
        ok: false,
        mensaje: 'ID del cliente es requerido',
      });
    }

    // 2️⃣ Buscar cliente
    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Cliente no encontrado',
      });
    }

    // 3️⃣ Actualizar cliente con los datos del body
    await cliente.update(req.body);

    console.log('✅ Cliente actualizado:', cliente.id);

    // 4️⃣ Responder
    res.json({
      ok: true,
      mensaje: 'Cliente actualizado exitosamente',
      cliente, // 👈 Corregido: devolver "cliente", no "client" ni "user"
    });
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
};
//  Eliminar cliente + usuario
const deleteClient = async (req, res) => {
  try {
    const client = await Cliente.findByPk(req.params.id);
    if (!client)
      return res.status(404).json({ message: 'Cliente no encontrado' });

    await User.destroy({ where: { id: client.user_id } });
    await Cliente.destroy({ where: { id: client.id } });

    res.json({ message: 'Cliente y usuario eliminados' });
  } catch (error) {
    console.error('❌ Error al eliminar cliente', error);
    res.status(500).json({ error: error.message });
  }
};

const getCliente = async (req, res) => {
  const id = req.params.cliente_id;

  try {
    const resp = await Cliente.findOne();

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

export { addClient, allClientes, upCliente, getCliente };
