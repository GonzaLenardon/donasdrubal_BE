import { randomUUID } from 'node:crypto';
import { runWithAuditContext } from '../services/auditContext.js';
import AuditLogService from '../services/AuditLogService.js';

export const auditContextMiddleware = (req, res, next) => {
  const suppliedId = req.get('x-request-id');
  const requestId = suppliedId && /^[\w.-]{1,64}$/.test(suppliedId) ? suppliedId : randomUUID();
  res.set('x-request-id', requestId);
  const store = {
    requestId,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.get('user-agent')?.slice(0, 500) || null,
    httpMethod: req.method,
    endpoint: req.originalUrl?.split('?')[0]?.slice(0, 500) || req.path,
    actor: null,
  };
  res.on('finish', () => {
    if (res.statusCode < 400) return;
    AuditLogService.recordFailure({
      action: req.method,
      entityType: 'http_request',
      description: `Request completed with HTTP ${res.statusCode}`,
      module: req.path?.startsWith('/stock/') ? 'ERM' : 'AUTH',
    }).catch((error) => console.error('No se pudo guardar el evento de fallo de auditoría:', error.message));
  });
  runWithAuditContext(store, next);
};
