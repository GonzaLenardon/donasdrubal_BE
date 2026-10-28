import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class AuditLogs extends Model {}

AuditLogs.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  actor_type: { type: DataTypes.STRING(24), allowNull: false, defaultValue: 'system' },
  module: { type: DataTypes.STRING(32), allowNull: false },
  action: { type: DataTypes.STRING(40), allowNull: false },
  entity_type: { type: DataTypes.STRING(100), allowNull: false },
  entity_id: { type: DataTypes.STRING(191), allowNull: true },
  old_values: { type: DataTypes.JSON, allowNull: true },
  new_values: { type: DataTypes.JSON, allowNull: true },
  changed_fields: { type: DataTypes.JSON, allowNull: true },
  description: { type: DataTypes.STRING(500), allowNull: true },
  request_id: { type: DataTypes.STRING(64), allowNull: true },
  ip_address: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.STRING(500), allowNull: true },
  http_method: { type: DataTypes.STRING(10), allowNull: true },
  endpoint: { type: DataTypes.STRING(500), allowNull: true },
  status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'SUCCESS' },
  created_at: { type: DataTypes.DATE(3), allowNull: false, defaultValue: DataTypes.NOW },
}, {
  sequelize: db,
  modelName: 'AuditLogs',
  tableName: 'audit_logs',
  timestamps: false,
  indexes: [
    { name: 'audit_user_date', fields: ['user_id', 'created_at'] },
    { name: 'audit_entity_date', fields: ['entity_type', 'entity_id', 'created_at'] },
    { name: 'audit_module_date', fields: ['module', 'created_at'] },
    { name: 'audit_action_date', fields: ['action', 'created_at'] },
    { name: 'audit_request_id', fields: ['request_id'] },
  ],
});

export default AuditLogs;
