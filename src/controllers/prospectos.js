import crypto from 'crypto';
import { Op } from 'sequelize';
import db from '../config/database.js';
import Clientes from '../models/clientes.js';
import ClienteIngenieros from '../models/clientesIngenieros.js';
import ClienteInvitaciones from '../models/clienteInvitaciones.js';
import { ROLES } from '../config/constants/roles.js';

const PUBLIC_FIELDS = [
  'razon_social', 'direccion_fiscal', 'cuil_cuit', 'iva_id', 'telefono',
  'email', 'direccion', 'ciudad', 'provincia', 'pais', 'notas',
];
const LIST_FIELDS = [
  'id', 'razon_social', 'cuil_cuit', 'telefono', 'email', 'ciudad',
  'provincia', 'estado', 'modo_ingreso', 'createdAt', 'updatedAt',
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMMERCIAL_STATES = ['Nuevo', 'Contactado', 'Interesado', 'En negociación', 'Datos recibidos', 'Activo', 'No interesado', 'Descartado'];
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const normalizeBody = (body, allowed) => Object.fromEntries(
  Object.entries(body || {}).filter(([key]) => allowed.includes(key)),
);
const hasUnknownFields = (body, allowed) => !body || typeof body !== 'object' || Array.isArray(body)
  || Object.keys(body).some((key) => !allowed.includes(key));
const validationError = (data, { creation = false } = {}) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return 'El cuerpo debe ser un objeto';
  if (creation && (!String(data.razon_social || '').trim() || !Number.isInteger(Number(data.iva_id)) || !EMAIL_RE.test(String(data.email || '')))) {
    return 'razon_social, iva_id y un email válido son obligatorios';
  }
  if ('razon_social' in data && !String(data.razon_social || '').trim()) return 'razon_social no puede estar vacío';
  if ('iva_id' in data && (!Number.isInteger(Number(data.iva_id)) || Number(data.iva_id) < 1)) return 'iva_id debe ser un entero positivo';
  if ('email' in data && !EMAIL_RE.test(String(data.email || ''))) return 'email no es válido';
  for (const field of ['razon_social', 'direccion_fiscal', 'cuil_cuit', 'telefono', 'email', 'direccion', 'ciudad', 'provincia', 'pais']) {
    if (field in data && data[field] != null && (typeof data[field] !== 'string' || data[field].length > 255)) return `${field} debe ser texto de hasta 255 caracteres`;
  }
  if ('categoria' in data && !['alto', 'medio', 'bajo'].includes(data.categoria)) return 'categoria no es válida';
  if ('estado' in data && !COMMERCIAL_STATES.includes(data.estado)) return 'estado no es válido';
  for (const field of ['tipo_cliente_id']) {
    if (field in data && data[field] != null && (!Number.isInteger(Number(data[field])) || Number(data[field]) < 1)) return `${field} debe ser un entero positivo`;
  }
  if ('litros_estimados' in data && data.litros_estimados != null && (!Number.isFinite(Number(data.litros_estimados)) || Number(data.litros_estimados) < 0)) return 'litros_estimados debe ser un número no negativo';
  if ('comodato' in data && typeof data.comodato !== 'boolean' && ![0, 1, '0', '1'].includes(data.comodato)) return 'comodato debe ser booleano';
  if ('notas' in data && data.notas != null && typeof data.notas !== 'string') return 'notas debe ser texto';
  return null;
};
const dataFromBody = (body, allowed) => {
  const data = normalizeBody(body, allowed);
  if ('iva_id' in data) data.iva_id = Number(data.iva_id);
  if ('razon_social' in data) data.razon_social = String(data.razon_social).trim();
  if ('email' in data) data.email = String(data.email).trim();
  return data;
};
const isAdmin = (req) => req.user?.rol === ROLES.ADMIN;
const isIngeniero = (req) => req.user?.rol === 'Ingeniero';
const roleAllowed = (req) => isAdmin(req) || isIngeniero(req);
const scopeFor = async (req, transaction) => {
  if (isAdmin(req)) return {};
  const assignments = await ClienteIngenieros.findAll({
    where: { user_id: req.user.id },
    attributes: ['cliente_id'],
    raw: true,
    transaction,
  });
  return { [Op.or]: [
    { user_id: req.user.id },
    { id: { [Op.in]: assignments.map(({ cliente_id }) => cliente_id) } },
  ] };
};
const findScoped = async (req, id, options = {}) => Clientes.findOne({
  where: { id, tipo_registro: 'prospecto', ...(await scopeFor(req, options.transaction)) }, ...options,
});
const requireAllowedRole = (req, res) => roleAllowed(req)
  ? null
  : res.status(403).json({ ok: false, mensaje: 'No tienes permisos para gestionar prospectos' });
const validTokenFormat = (token) => typeof token === 'string' && /^[a-f0-9]{64}$/i.test(token);
const getActiveInvitation = async (token, transaction) => {
  if (!validTokenFormat(token)) return { error: 'not_found' };
  const invitation = await ClienteInvitaciones.findOne({
    where: { token_hash: hashToken(token) },
    include: [{ model: Clientes, as: 'prospecto', required: true, where: { tipo_registro: 'prospecto' } }],
    transaction,
    ...(transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!invitation) return { error: 'not_found' };
  if (invitation.usado_at || invitation.estado === 'usado') return { error: 'gone' };
  if (new Date(invitation.expires_at) <= new Date() || invitation.estado === 'expirado') return { error: 'gone' };
  return { invitation };
};
const sendTokenError = (res, error) => error === 'gone'
  ? res.status(410).json({ ok: false, mensaje: 'La invitación venció o ya fue utilizada' })
  : res.status(404).json({ ok: false, mensaje: 'Invitación no encontrada' });

export const crearProspecto = async (req, res) => {
  const data = dataFromBody(req.body, [...PUBLIC_FIELDS, 'categoria', 'tipo_cliente_id', 'litros_estimados', 'comodato']);
  const invalid = validationError(data, { creation: true });
  if (invalid) return res.status(400).json({ ok: false, mensaje: invalid });
  try {
    const conditions = [];
    if (data.cuil_cuit) conditions.push({ cuil_cuit: data.cuil_cuit });
    if (data.email) conditions.push({ email: data.email });
    if (conditions.length) {
      const coincidencias = await Clientes.findAll({ where: { [Op.or]: conditions }, attributes: ['id', 'razon_social', 'cuil_cuit', 'email', 'tipo_registro'], limit: 10 });
      if (coincidencias.length) return res.status(409).json({ ok: false, mensaje: 'Se encontraron posibles registros duplicados', coincidencias });
    }
    const prospecto = await Clientes.create({ ...data, user_id: req.user.id, tipo_registro: 'prospecto', estado: 'Nuevo', modo_ingreso: 'interno' });
    return res.status(201).json({ ok: true, mensaje: 'Prospecto creado', prospecto });
  } catch (error) {
    console.error('Error al crear prospecto:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear prospecto' });
  }
};

export const listarProspectos = async (req, res) => {
  const forbidden = requireAllowedRole(req, res);
  if (forbidden) return forbidden;
  try {
    const prospectos = await Clientes.findAll({ where: { tipo_registro: 'prospecto', ...(await scopeFor(req)) }, attributes: LIST_FIELDS, order: [['createdAt', 'DESC']] });
    return res.json({ ok: true, prospectos });
  } catch (error) {
    console.error('Error al listar prospectos:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al listar prospectos' });
  }
};

export const obtenerProspecto = async (req, res) => {
  const forbidden = requireAllowedRole(req, res);
  if (forbidden) return forbidden;
  try {
    const prospecto = await findScoped(req, req.params.id);
    return prospecto ? res.json({ ok: true, prospecto }) : res.status(404).json({ ok: false, mensaje: 'Prospecto no encontrado' });
  } catch (error) {
    console.error('Error al obtener prospecto:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener prospecto' });
  }
};

export const actualizarProspecto = async (req, res) => {
  const forbidden = requireAllowedRole(req, res);
  if (forbidden) return forbidden;
  const data = dataFromBody(req.body, PUBLIC_FIELDS.concat(['categoria', 'estado', 'modo_ingreso', 'tipo_cliente_id', 'litros_estimados', 'comodato']));
  const invalid = validationError(data);
  if (invalid) return res.status(400).json({ ok: false, mensaje: invalid });
  try {
    const prospecto = await findScoped(req, req.params.id);
    if (!prospecto) return res.status(404).json({ ok: false, mensaje: 'Prospecto no encontrado' });
    await prospecto.update(data);
    return res.json({ ok: true, prospecto });
  } catch (error) {
    console.error('Error al actualizar prospecto:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar prospecto' });
  }
};

export const convertirProspecto = async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ ok: false, mensaje: 'Solo un administrador puede convertir prospectos en clientes' });
  }
  const transaction = await db.transaction();
  try {
    const prospecto = await findScoped(req, req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!prospecto) { await transaction.rollback(); return res.status(404).json({ ok: false, mensaje: 'Prospecto no encontrado' }); }
    await prospecto.update({ tipo_registro: 'cliente', estado: 'Activo' }, { transaction });
    await ClienteInvitaciones.update({ estado: 'expirado' }, { where: { cliente_id: prospecto.id, estado: 'pendiente', usado_at: null }, transaction });
    await transaction.commit();
    return res.json({ ok: true, mensaje: 'Prospecto convertido en cliente', cliente: prospecto });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al convertir prospecto:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al convertir prospecto' });
  }
};

export const crearInvitacion = async (req, res) => {
  const forbidden = requireAllowedRole(req, res);
  if (forbidden) return forbidden;
  const expirationHours = Number(process.env.PROSPECT_INVITATION_EXPIRATION_HOURS || 48);
  if (!Number.isFinite(expirationHours) || expirationHours <= 0) return res.status(500).json({ ok: false, mensaje: 'Configuración de expiración inválida' });
  const baseUrl = (process.env.PROSPECT_INVITATION_BASE_URL || process.env.FRONTEND_URL || process.env.BASE_URL || '').trim().replace(/\/$/, '');
  if (!baseUrl) return res.status(500).json({ ok: false, mensaje: 'Falta configurar PROSPECT_INVITATION_BASE_URL' });
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    const transaction = await db.transaction();
    try {
      const prospecto = await findScoped(req, req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!prospecto) {
        await transaction.rollback();
        return res.status(404).json({ ok: false, mensaje: 'Prospecto no encontrado' });
      }
      await ClienteInvitaciones.update({ estado: 'expirado' }, { where: { cliente_id: prospecto.id, estado: 'pendiente', usado_at: null }, transaction });
      await ClienteInvitaciones.create({ cliente_id: prospecto.id, token_hash: hashToken(token), creado_por: req.user.id, expires_at: expiresAt }, { transaction });
      await transaction.commit();
    } catch (error) { await transaction.rollback(); throw error; }
    return res.status(201).json({ ok: true, url: `${baseUrl}/registro-prospecto/${token}`, expires_at: expiresAt.toISOString() });
  } catch (error) {
    console.error('Error al crear invitación:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear invitación' });
  }
};

export const consultarInvitacion = async (req, res) => {
  try {
    const result = await getActiveInvitation(req.params.token);
    if (result.error) return sendTokenError(res, result.error);
    const { prospecto } = result.invitation;
    const fieldsToPreload = ['id', ...PUBLIC_FIELDS];
    return res.json({
      ok: true,
      valido: true,
      prospecto: Object.fromEntries(fieldsToPreload.map((key) => [key, prospecto[key]])),
    });
  } catch (error) {
    console.error('Error al consultar invitación:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al consultar invitación' });
  }
};

export const completarProspecto = async (req, res) => {
  if (hasUnknownFields(req.body, PUBLIC_FIELDS)) {
    return res.status(400).json({ ok: false, mensaje: 'El formulario contiene campos no permitidos' });
  }
  const data = dataFromBody(req.body, PUBLIC_FIELDS);
  if (!Object.keys(data).length) return res.status(400).json({ ok: false, mensaje: 'No se recibieron campos permitidos' });
  const invalid = validationError(data);
  if (invalid) return res.status(400).json({ ok: false, mensaje: invalid });
  const transaction = await db.transaction();
  try {
    const result = await getActiveInvitation(req.params.token, transaction);
    if (result.error) { await transaction.rollback(); return sendTokenError(res, result.error); }
    const { invitation, invitation: { prospecto } } = result;
    await prospecto.update({ ...data, estado: 'Datos recibidos' }, { transaction });
    invitation.usado_at = new Date();
    invitation.estado = 'usado';
    await invitation.save({ transaction });
    await transaction.commit();
    return res.json({ ok: true, mensaje: 'Datos recibidos correctamente' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al completar prospecto:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al guardar los datos' });
  }
};
