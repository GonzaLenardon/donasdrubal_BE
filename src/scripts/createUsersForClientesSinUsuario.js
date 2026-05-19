import db from '../config/database.js';
import Clientes from '../models/clientes.js';
import Users from '../models/users.js';
import Roles from '../models/roles.js';
import UserRoles from '../models/user_roles.js';
import { Op } from 'sequelize';

const DEFAULT_PASSWORD = '123456';
const DEFAULT_PHONE = '0';

const normalizeEmailName = (value) =>
  String(value || 'cliente')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'cliente';

const normalizeEmail = (value) => {
  const email = String(value || '').trim().toLowerCase();
  return email.includes('@') ? email : null;
};

const buildFallbackEmail = (cliente, suffix = '') =>
  `cliente_${cliente.id}_${normalizeEmailName(cliente.razon_social)}${suffix}@donasdrubal.local`;

const getAvailableEmail = async (cliente, transaction) => {
  const preferredEmail = normalizeEmail(cliente.email);
  let candidateEmail = preferredEmail || buildFallbackEmail(cliente);
  let suffixNumber = 1;

  while (true) {
    const existingUser = await Users.findOne({
      where: { email: candidateEmail },
      transaction,
    });

    if (!existingUser) return candidateEmail;

    candidateEmail = buildFallbackEmail(cliente, `_${suffixNumber}`);
    suffixNumber += 1;
  }
};

const createUsersForClientesSinUsuario = async () => {
  try {
    await db.authenticate();
    console.log('✅ Conectado a la base de datos');

    const role = await Roles.findOne({
      where: { nombre: { [Op.like]: '%Cliente%' } },
    });

    if (!role) {
      throw new Error('No se encontró un rol con nombre Cliente');
    }

    const clientes = await Clientes.findAll({
      where: { user_id: null },
      order: [['id', 'ASC']],
    });

    if (clientes.length === 0) {
      console.log('No hay clientes sin user_id para procesar.');
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const cliente of clientes) {
      await db.transaction(async (transaction) => {
        const clienteActual = await Clientes.findByPk(cliente.id, { transaction });

        if (!clienteActual || clienteActual.user_id !== null) {
          console.log(`⚠️ Cliente ${cliente.id}: ya tiene user_id, se omite`);
          skippedCount += 1;
          return;
        }

        const email = await getAvailableEmail(clienteActual, transaction);
        const usuarioCliente = await Users.create(
          {
            nombre: clienteActual.razon_social || `Cliente ${clienteActual.id}`,
            email,
            password: DEFAULT_PASSWORD,
            telefono: clienteActual.telefono || DEFAULT_PHONE,
          },
          { transaction },
        );

        await UserRoles.findOrCreate({
          where: {
            user_id: usuarioCliente.id,
            role_id: role.id,
          },
          defaults: {
            user_id: usuarioCliente.id,
            role_id: role.id,
          },
          transaction,
        });

        await clienteActual.update({ user_id: usuarioCliente.id }, { transaction });

        console.log(
          `✅ Cliente ${clienteActual.id} "${clienteActual.razon_social}" vinculado al usuario ${usuarioCliente.id} (${email})`,
        );
        createdCount += 1;
      });
    }

    console.log(
      `\nProceso finalizado: ${createdCount} usuarios creados, ${skippedCount} clientes omitidos.`,
    );
  } catch (error) {
    console.error('❌ Error al crear usuarios para clientes:', error.message);
    process.exitCode = 1;
  } finally {
    await db.close();
  }
};

createUsersForClientesSinUsuario();
