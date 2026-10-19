'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = async (tableName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' LIMIT 1`
      );
      return result.length > 0;
    };

    // =================================================================
    // 1. CREATE TABLE remito_archivos
    // =================================================================
    if (!(await tableExists('remito_archivos'))) {
      await queryInterface.createTable('remito_archivos', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        remito_id: {
          allowNull: false, type: Sequelize.INTEGER,
          references: { model: 'remitos', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        path: { allowNull: false, type: Sequelize.STRING(500) },
        mime_type: { allowNull: false, type: Sequelize.STRING(100) },
        original_name: { allowNull: false, type: Sequelize.STRING(255) },
        size: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
        uploaded_by: {
          allowNull: true, type: Sequelize.INTEGER,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'SET NULL',
        },
        uploaded_at: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        deletedAt: { allowNull: true, type: Sequelize.DATE, field: 'deleted_at' },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });

      await queryInterface.addIndex('remito_archivos', ['remito_id'], {
        name: 'remito_archivos_remito',
      });
    }

    // =================================================================
    // 2. Migrar photo_path existente a remito_archivos
    // =================================================================
    const [remitosConFoto] = await queryInterface.sequelize.query(
      `SELECT id, photo_path, photo_uploaded_at, created_by FROM remitos WHERE photo_path IS NOT NULL AND photo_path != ''`
    );

    for (const remito of remitosConFoto) {
      const ext = remito.photo_path.split('.').pop().toLowerCase();
      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
      const mime_type = mimeMap[ext] || 'application/octet-stream';
      const original_name = remito.photo_path.split('/').pop();

      await queryInterface.bulkInsert('remito_archivos', [{
        remito_id: remito.id,
        path: remito.photo_path,
        mime_type,
        original_name,
        size: 0,
        uploaded_by: remito.created_by,
        uploaded_at: remito.photo_uploaded_at || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableExists = async (tableName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' LIMIT 1`
      );
      return result.length > 0;
    };

    if (await tableExists('remito_archivos')) {
      await queryInterface.dropTable('remito_archivos');
    }
  },
};