import AuditLogs from '../models/auditLogs.js';
import { getAuditContext } from './auditContext.js';

const SECRET_KEY = /password|passwd|salt|token|secret|api.?key|authorization|cookie|credential|private.?key/i;

export const sanitizeAuditValues = (value, depth = 0) => {
  if (value === null || value === undefined) return value ?? null;
  if (depth > 8) return '[DEPTH_LIMIT]';
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) return '[BINARY_OMITTED]';
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 500).map((item) => sanitizeAuditValues(item, depth + 1));
  if (typeof value !== 'object') return typeof value === 'bigint' ? value.toString() : value;
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) continue;
    const safe = sanitizeAuditValues(item, depth + 1);
    result[key] = safe;
  }
  return result;
};

export const diffAuditValues = (oldValues, newValues) => {
  const oldSafe = sanitizeAuditValues(oldValues || {});
  const newSafe = sanitizeAuditValues(newValues || {});
  const keys = new Set([...Object.keys(oldSafe), ...Object.keys(newSafe)]);
  const changedFields = [...keys].filter((key) => JSON.stringify(oldSafe[key]) !== JSON.stringify(newSafe[key]));
  return { oldValues: oldSafe, newValues: newSafe, changedFields };
};

const moduleFor = (entityType) => /^(products|product_|warehouses|providers|warehouse_|purchases|purchase_|remitos|remito_|stock_|rubros|subrubros)/i.test(entityType) ? 'ERM' : 'CRM';

class AuditLogService {
  static toRecord({ actor, module, action, entityType, entityId, oldValues = null, newValues = null, changedFields = null, description = null, requestContext, status = 'SUCCESS' }) {
    const context = requestContext || getAuditContext() || {};
    const resolvedActor = actor || context.actor || null;
    return {
      user_id: resolvedActor?.id ?? null,
      actor_type: resolvedActor?.type || (resolvedActor?.id ? 'user' : 'system'),
      module: String(module || moduleFor(entityType)).toUpperCase().slice(0, 32),
      action: String(action).toUpperCase().slice(0, 40),
      entity_type: String(entityType).slice(0, 100),
      entity_id: entityId == null ? null : String(entityId).slice(0, 191),
      old_values: oldValues == null ? null : sanitizeAuditValues(oldValues),
      new_values: newValues == null ? null : sanitizeAuditValues(newValues),
      changed_fields: changedFields == null ? null : [...new Set(changedFields)],
      description: description?.slice(0, 500) ?? null,
      request_id: context.requestId ?? null,
      ip_address: context.ipAddress?.slice(0, 45) ?? null,
      user_agent: context.userAgent?.slice(0, 500) ?? null,
      http_method: context.httpMethod?.slice(0, 10) ?? null,
      endpoint: context.endpoint?.slice(0, 500) ?? null,
      status,
    };
  }

  static async record(event) {
    const { transaction = null } = event;
    return AuditLogs.create(this.toRecord(event), { transaction: transaction || undefined });
  }

  static async recordMany(events, transaction = null) {
    if (!events.length) return [];
    return AuditLogs.bulkCreate(events.map((event) => this.toRecord(event)), { transaction: transaction || undefined });
  }

  static async recordFailure({ actor, module, action, entityType, entityId, description, transaction = null }) {
    return this.record({ actor, module, action, entityType, entityId, description, status: 'FAILURE', transaction });
  }

  static moduleFor(entityType) { return moduleFor(entityType); }
}

export default AuditLogService;
