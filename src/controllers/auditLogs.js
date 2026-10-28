import { Op } from 'sequelize';
import AuditLogs from '../models/auditLogs.js';

const parseDate = (value) => {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z?)?$/.test(value)) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) && date.toISOString().slice(0, 10) !== value) return undefined;
  return date;
};

export const listAuditLogs = async (req, res) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) {
    return res.status(400).json({ ok: false, mensaje: 'Paginación inválida (page >= 1, limit entre 1 y 100)' });
  }
  const { user_id, module, action, entity_type, entity_id, status } = req.query;
  if (user_id !== undefined && (!/^\d{1,10}$/.test(user_id) || Number(user_id) > 2147483647)) return res.status(400).json({ ok: false, mensaje: 'user_id inválido' });
  for (const [field, value, pattern] of [['module', module, /^[a-z0-9_-]{1,32}$/i], ['action', action, /^[a-z0-9_-]{1,40}$/i], ['entity_type', entity_type, /^[a-z0-9_.-]{1,100}$/i], ['entity_id', entity_id, /^.{1,191}$/], ['status', status, /^(SUCCESS|FAILURE)$/i]]) {
    if (value !== undefined && (typeof value !== 'string' || !pattern.test(value))) return res.status(400).json({ ok: false, mensaje: `Filtro ${field} inválido` });
  }
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);
  if (from === undefined || to === undefined || (from && to && from > to)) return res.status(400).json({ ok: false, mensaje: 'Rango de fechas inválido' });
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to)) to.setUTCHours(23, 59, 59, 999);

  const where = {};
  if (user_id !== undefined) where.user_id = Number(user_id);
  if (module) where.module = module.toUpperCase();
  if (action) where.action = action.toUpperCase();
  if (entity_type) where.entity_type = entity_type;
  if (entity_id) where.entity_id = entity_id;
  if (status) where.status = status.toUpperCase();
  if (from || to) where.created_at = { ...(from && { [Op.gte]: from }), ...(to && { [Op.lte]: to }) };

  try {
    const { count, rows } = await AuditLogs.findAndCountAll({
      where, limit, offset: (page - 1) * limit,
      order: [['created_at', 'DESC'], ['id', 'DESC']],
    });
    return res.json({ ok: true, data: rows, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    console.error('No se pudo consultar el historial de auditoría:', error.message);
    return res.status(500).json({ ok: false, mensaje: 'No se pudo consultar el historial de auditoría' });
  }
};
