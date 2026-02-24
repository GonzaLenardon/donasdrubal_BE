import { ROLES } from '../config/constants/roles.js';

import Roles from '../models/roles.js';
import UserRoles from '../models/user_roles.js';
import { createUser } from '../services/userService.js';
import db from '../config/database.js';
import TipoClientes from '../models/tipoClientes.js';
import ClienteIngenieros from '../models/clientesIngenieros.js';
import Users from '../models/users.js';
import Clientes from '../models/clientes.js';

// const bcrypt = require('bcrypt');

const addClient = async (req, res) => {
  console.log('📝 Crear cliente - Body:', req.body);

  const { ingenieros, tipoCliente, ...clienteData } = req.body;

  try {
    // Validaciones
    if (!Array.isArray(ingenieros) || ingenieros.length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Debe asignar al menos un ingeniero',
      });
    }

    if (ingenieros.length > 1) {
      const tienePrincipal = ingenieros.some((ing) => ing.es_principal);
      if (!tienePrincipal) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Debe seleccionar un ingeniero principal',
        });
      }
    }

    // Crear cliente
    const nuevoCliente = await Clientes.create(clienteData);

    // Crear relaciones con ingenieros
    const relacionesIngenieros = ingenieros.map((ing) => ({
      cliente_id: nuevoCliente.id,
      user_id: parseInt(ing.user_id),
      es_principal: !!ing.es_principal,
    }));

    await ClienteIngenieros.bulkCreate(relacionesIngenieros);

    // Cargar cliente con ingenieros
    const clienteCompleto = await Clientes.findByPk(nuevoCliente.id, {
      include: [
        {
          model: Users,
          as: 'ingenieros',
          through: {
            attributes: ['es_principal'],
          },
          attributes: ['id', 'nombre', 'email'],
        },
        {
          model: TipoClientes,
          as: 'tipoCliente',
          attributes: ['id', 'tipoClientes'],
        },
      ],
    });

    return res.status(201).json({
      ok: true,
      mensaje: 'Cliente creado exitosamente',
      cliente: clienteCompleto,
    });
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al crear cliente',
      error: error.message,
    });
  }
};

// Listar clientes con usuario
const allClientes = async (req, res) => {
  try {
    const clientes = await Clientes.findAll({
      include: [
        {
          model: Users,
          as: 'ingenieros',
          through: {
            attributes: ['es_principal'],
          },
          attributes: ['id', 'nombre', 'email'],
        },
        {
          model: TipoClientes,
          as: 'tipoCliente',
          attributes: ['id', 'tipoClientes'],
        },
      ],
      order: [['razon_social', 'ASC']],
    });

    // Formatear respuesta para incluir es_principal en cada ingeniero
    const clientesFormateados = clientes.map((cliente) => {
      const clienteJSON = cliente.toJSON();

      if (clienteJSON.ingenieros) {
        clienteJSON.ingenieros = clienteJSON.ingenieros.map((ing) => ({
          user_id: ing.id,
          nombre: ing.nombre,
          email: ing.email,
          es_principal: ing.ClienteIngenieros?.es_principal || false,
        }));
      }

      return clienteJSON;
    });

    return res.json({
      ok: true,
      data: clientesFormateados,
    });
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
};

// Actualizar cliente + usuario
/* const upCliente = async (req, res) => {
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
}; */

const upCliente = async (req, res) => {
  console.log('📝 Actualizar cliente - Body:', req.body);
  console.log('📝 Actualizar cliente - Params:', req.params);

  const { ingenieros, ...clienteData } = req.body;
  const { cliente_id } = req.params;

  try {
    if (!cliente_id) {
      return res.status(400).json({
        ok: false,
        mensaje: 'ID del cliente es requerido',
      });
    }

    // Buscar cliente
    const cliente = await Clientes.findByPk(cliente_id);

    if (!cliente) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Cliente no encontrado',
      });
    }

    // Validar ingenieros
    if (Array.isArray(ingenieros)) {
      if (ingenieros.length === 0) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Debe asignar al menos un ingeniero',
        });
      }

      if (ingenieros.length > 1) {
        const tienePrincipal = ingenieros.some((ing) => ing.es_principal);
        if (!tienePrincipal) {
          return res.status(400).json({
            ok: false,
            mensaje: 'Debe seleccionar un ingeniero principal',
          });
        }
      }
    }

    // Actualizar datos del cliente
    await cliente.update(clienteData);

    // Actualizar ingenieros
    if (Array.isArray(ingenieros)) {
      // Eliminar relaciones anteriores
      await ClienteIngenieros.destroy({
        where: { cliente_id },
      });

      // Crear nuevas relaciones
      const relacionesIngenieros = ingenieros.map((ing) => ({
        cliente_id: parseInt(cliente_id),
        user_id: parseInt(ing.user_id),
        es_principal: !!ing.es_principal,
      }));

      await ClienteIngenieros.bulkCreate(relacionesIngenieros);
    }

    // Cargar cliente actualizado con ingenieros
    const clienteActualizado = await Clientes.findByPk(cliente_id, {
      include: [
        {
          model: Users,
          as: 'ingenieros',
          through: {
            attributes: ['es_principal'],
          },
          attributes: ['id', 'nombre', 'email'],
        },
        {
          model: TipoClientes,
          as: 'tipoCliente',
          attributes: ['id', 'tipoClientes'],
        },
      ],
    });

    return res.json({
      ok: true,
      mensaje: 'Cliente actualizado exitosamente',
      cliente: clienteActualizado,
    });
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar cliente',
      error: error.message,
    });
  }
};

//  Eliminar cliente + usuario
const deleteClient = async (req, res) => {
  try {
    const client = await Clientes.findByPk(req.params.id);
    if (!client)
      return res.status(404).json({ message: 'Cliente no encontrado' });

    await User.destroy({ where: { id: client.user_id } });
    await Clientes.destroy({ where: { id: client.id } });

    res.json({ message: 'Cliente y usuario eliminados' });
  } catch (error) {
    console.error('❌ Error al eliminar cliente', error);
    res.status(500).json({ error: error.message });
  }
};

const getCliente = async (req, res) => {
  const id = req.params.cliente_id;

  try {
    const resp = await Clientes.findOne({ where: { id } });

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
