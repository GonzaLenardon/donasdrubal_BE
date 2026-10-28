'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.some((name) => String(name).toLowerCase() === 'audit_logs')) {
      await queryInterface.createTable('audit_logs', {
        id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
        user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
        actor_type: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'system' },
        module: { type: Sequelize.STRING(32), allowNull: false },
        action: { type: Sequelize.STRING(40), allowNull: false },
        entity_type: { type: Sequelize.STRING(100), allowNull: false },
        entity_id: { type: Sequelize.STRING(191), allowNull: true },
        old_values: { type: Sequelize.JSON, allowNull: true },
        new_values: { type: Sequelize.JSON, allowNull: true },
        changed_fields: { type: Sequelize.JSON, allowNull: true },
        description: { type: Sequelize.STRING(500), allowNull: true },
        request_id: { type: Sequelize.STRING(64), allowNull: true },
        ip_address: { type: Sequelize.STRING(45), allowNull: true },
        user_agent: { type: Sequelize.STRING(500), allowNull: true },
        http_method: { type: Sequelize.STRING(10), allowNull: true },
        endpoint: { type: Sequelize.STRING(500), allowNull: true },
        status: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'SUCCESS' },
        created_at: { type: Sequelize.DATE(3), allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP(3)') },
      });
    }
    for (const [name, fields] of [
      ['audit_user_date', ['user_id', 'created_at']], ['audit_entity_date', ['entity_type', 'entity_id', 'created_at']],
      ['audit_module_date', ['module', 'created_at']], ['audit_action_date', ['action', 'created_at']], ['audit_request_id', ['request_id']],
    ]) {
      const indexes = await queryInterface.showIndex('audit_logs');
      if (!indexes.some((index) => index.name === name)) await queryInterface.addIndex('audit_logs', fields, { name });
    }

    const [permissions] = await queryInterface.sequelize.query("SELECT id FROM permissions WHERE nombre = 'AUDIT_READ' LIMIT 1");
    let permissionId = permissions[0]?.id;
    if (!permissionId) {
      await queryInterface.bulkInsert('permissions', [{ nombre: 'AUDIT_READ', descripcion: 'Consultar el historial de auditoría', createdAt: new Date(), updatedAt: new Date() }]);
      const [created] = await queryInterface.sequelize.query("SELECT id FROM permissions WHERE nombre = 'AUDIT_READ' ORDER BY id DESC LIMIT 1");
      permissionId = created[0]?.id;
    }
    if (permissionId) {
      const [admins] = await queryInterface.sequelize.query("SELECT id FROM roles WHERE nombre = 'Administrador' AND deletedAt IS NULL");
      for (const role of admins) {
        const [links] = await queryInterface.sequelize.query('SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?', { replacements: [role.id, permissionId] });
        if (!links.length) await queryInterface.bulkInsert('role_permissions', [{ role_id: role.id, permission_id: permissionId }]);
      }
    }
  },

  async down(queryInterface) {
    // Keep the permission seed on rollback: the permission may have existed before this migration.
    const tables = await queryInterface.showAllTables();
    if (tables.some((name) => String(name).toLowerCase() === 'audit_logs')) await queryInterface.dropTable('audit_logs');
  },
};
