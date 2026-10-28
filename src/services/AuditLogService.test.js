import test from 'node:test';
import assert from 'node:assert/strict';
import { diffAuditValues, sanitizeAuditValues } from './AuditLogService.js';

test('elimina campos sensibles también en objetos anidados', () => {
  assert.deepEqual(sanitizeAuditValues({ email: 'a@b.test', password: 'hash', meta: { refreshToken: 'secret', active: true } }), {
    email: 'a@b.test', meta: { active: true },
  });
});

test('preserva null, fechas y reemplaza datos binarios', () => {
  assert.deepEqual(sanitizeAuditValues({ empty: null, at: new Date('2025-01-01T00:00:00Z'), file: Buffer.from('x') }), {
    empty: null, at: '2025-01-01T00:00:00.000Z', file: '[BINARY_OMITTED]',
  });
});

test('compara valores y devuelve únicamente los campos modificados', () => {
  const result = diffAuditValues({ nombre: 'Antes', password: 'secret', activo: true }, { nombre: 'Después', password: 'other', activo: true });
  assert.deepEqual(result.changedFields, ['nombre']);
  assert.deepEqual(result.oldValues, { nombre: 'Antes', activo: true });
  assert.deepEqual(result.newValues, { nombre: 'Después', activo: true });
});

test('no reporta campos modificados cuando los valores son idénticos', () => {
  assert.deepEqual(diffAuditValues({ activo: true, nombre: 'A' }, { activo: true, nombre: 'A' }).changedFields, []);
});
