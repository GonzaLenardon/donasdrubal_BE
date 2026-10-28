import AuditLogs from '../models/auditLogs.js';
import AuditLogService, { diffAuditValues, sanitizeAuditValues } from './AuditLogService.js';
import { getAuditContext } from './auditContext.js';
import { Op } from 'sequelize';

const toPlainValues = (instance) => instance?.get({ plain: true }) || {};
const registeredModels = new WeakSet();
const primaryKeys = (model) => {
  if (model.primaryKeyAttributes?.length) return model.primaryKeyAttributes;
  const declared = Object.keys(model.rawAttributes).filter((key) => model.rawAttributes[key].primaryKey);
  if (declared.length) return declared;
  if (model.tableName === 'role_permissions') return ['role_id', 'permission_id'];
  if (model.tableName === 'cliente_ingenieros') return ['cliente_id', 'user_id'];
  return [];
};
const entityId = (model, values) => {
  const keys = primaryKeys(model);
  if (!keys.length) return null;
  if (keys.length === 1) return values[keys[0]];
  return JSON.stringify(Object.fromEntries(keys.map((key) => [key, values[key]])));
};
const whereForRows = (model, rows) => primaryKeys(model).length ? ({
  [Op.or]: rows.map((row) => Object.fromEntries(primaryKeys(model).map((key) => [key, row[key]]))),
}) : null;

export const registerModelAuditHooks = (sequelize) => {
  for (const model of Object.values(sequelize.models)) {
    if (model === AuditLogs || model.options?.auditLogDisabled) continue;
    if (registeredModels.has(model)) continue;

    model.addHook('afterCreate', `audit-create-${model.name}`, async (instance, options) => {
      await AuditLogService.record({
        action: 'CREATE', entityType: model.tableName, entityId: entityId(model, toPlainValues(instance)),
        newValues: toPlainValues(instance), transaction: options.transaction,
      });
    });
    model.addHook('afterBulkCreate', `audit-bulk-create-${model.name}`, async (instances, options) => {
      if (options.individualHooks || !instances.length) return;
      await AuditLogService.recordMany(instances.map((instance) => ({
        action: 'CREATE', entityType: model.tableName, entityId: entityId(model, toPlainValues(instance)),
        newValues: toPlainValues(instance),
      })), options.transaction);
    });

    model.addHook('beforeUpdate', `audit-capture-update-${model.name}`, (instance, options) => {
      options.auditOldValues = sanitizeAuditValues(instance._previousDataValues || {});
    });
    model.addHook('afterUpdate', `audit-update-${model.name}`, async (instance, options) => {
      const { oldValues, newValues, changedFields } = diffAuditValues(options.auditOldValues || {}, toPlainValues(instance));
      if (!changedFields.length) return;
      await AuditLogService.record({
        action: 'UPDATE', entityType: model.tableName, entityId: entityId(model, toPlainValues(instance)),
        oldValues, newValues, changedFields, transaction: options.transaction,
      });
    });

    model.addHook('beforeDestroy', `audit-capture-delete-${model.name}`, (instance, options) => {
      options.auditOldValues = sanitizeAuditValues(toPlainValues(instance));
    });
    model.addHook('afterDestroy', `audit-delete-${model.name}`, async (instance, options) => {
      if (model.options.paranoid && !options.force) {
        const { oldValues, newValues, changedFields } = diffAuditValues(options.auditOldValues || {}, toPlainValues(instance));
        if (!changedFields.length) return;
        await AuditLogService.record({
          action: 'STATUS_CHANGE', entityType: model.tableName, entityId: entityId(model, toPlainValues(instance)),
          oldValues, newValues, changedFields, transaction: options.transaction,
        });
        return;
      }
      await AuditLogService.record({
        action: 'DELETE', entityType: model.tableName, entityId: entityId(model, toPlainValues(instance)),
        oldValues: options.auditOldValues || null, transaction: options.transaction,
      });
    });

    model.addHook('beforeBulkUpdate', `audit-capture-bulk-update-${model.name}`, async (options) => {
      if (options.individualHooks) return;
      options.auditOldRows = (await model.findAll({ where: options.where, transaction: options.transaction, paranoid: options.paranoid }))
        .map((instance) => toPlainValues(instance));
    });
    model.addHook('afterBulkUpdate', `audit-bulk-update-${model.name}`, async (options) => {
      if (options.individualHooks || !options.auditOldRows?.length) return;
      const keyWhere = whereForRows(model, options.auditOldRows);
      if (!keyWhere) return;
      const currentRows = await model.findAll({ where: keyWhere, transaction: options.transaction, paranoid: false });
      const currentByKey = new Map(currentRows.map((instance) => [String(entityId(model, toPlainValues(instance))), toPlainValues(instance)]));
      const events = [];
      for (const oldRow of options.auditOldRows) {
        const newRow = currentByKey.get(String(entityId(model, oldRow)));
        if (!newRow) continue;
        const diff = diffAuditValues(oldRow, newRow);
        if (diff.changedFields.length) events.push({ action: 'UPDATE', entityType: model.tableName, entityId: entityId(model, oldRow), ...diff });
      }
      await AuditLogService.recordMany(events, options.transaction);
    });

    model.addHook('beforeBulkDestroy', `audit-capture-bulk-delete-${model.name}`, async (options) => {
      if (options.individualHooks) return;
      options.auditOldRows = (await model.findAll({ where: options.where, transaction: options.transaction, paranoid: options.paranoid }))
        .map((instance) => sanitizeAuditValues(toPlainValues(instance)));
    });
    model.addHook('afterBulkDestroy', `audit-bulk-delete-${model.name}`, async (options) => {
      if (options.individualHooks || !options.auditOldRows?.length) return;
      const keyWhere = whereForRows(model, options.auditOldRows);
      if (!options.force && !keyWhere) return;
      const currentRows = options.force ? [] : await model.findAll({ where: keyWhere, transaction: options.transaction, paranoid: false });
      const currentByKey = new Map(currentRows.map((instance) => [String(entityId(model, toPlainValues(instance))), toPlainValues(instance)]));
      const events = options.auditOldRows.map((oldRow) => {
        const id = entityId(model, oldRow);
        const current = currentByKey.get(String(id));
        if (!current) return { action: 'DELETE', entityType: model.tableName, entityId: id, oldValues: oldRow };
        const diff = diffAuditValues(oldRow, current);
        return diff.changedFields.length ? { action: 'STATUS_CHANGE', entityType: model.tableName, entityId: id, ...diff } : null;
      }).filter(Boolean);
      await AuditLogService.recordMany(events, options.transaction);
    });
    registeredModels.add(model);
  }
};
