'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // =================================================================
    // 1. PRODUCT_RANKINGS (nueva tabla)
    // =================================================================
    await queryInterface.createTable('product_rankings', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      product_id: {
        allowNull: false, type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      product_presentation_id: {
        allowNull: false, type: Sequelize.INTEGER,
        references: { model: 'product_presentations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      ranking: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // =================================================================
    // 2. MODIFICAR REMITOS
    // =================================================================

    // 2a. Cambiar el ENUM de status
    // MySQL no permite modificar ENUM directamente, entonces:
    // 1. Cambiar a texto
    // 2. Update los valores existentes
    // 3. Cambiar a nuevo ENUM
    await queryInterface.changeColumn('remitos', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    });

    // Actualizar valores antiguos a nuevos
    await queryInterface.bulkUpdate('remitos', { status: 'PENDIENTE' }, { status: 'PENDIENTE' });
    await queryInterface.bulkUpdate('remitos', { status: 'PENDIENTE' }, { status: 'DESPACHADO' });
    await queryInterface.bulkUpdate('remitos', { status: 'PENDIENTE' }, { status: 'RECIBIDO' });

    // Ahora cambiar a nuevo ENUM
    await queryInterface.changeColumn('remitos', 'status', {
      type: Sequelize.ENUM('PENDIENTE', 'REVISION', 'COMPLETADO', 'ANULADO'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    });

    // 2b. Agregar nuevos campos
    await queryInterface.addColumn('remitos', 'photo_path', {
      allowNull: true,
      type: Sequelize.STRING(500),
    });
    await queryInterface.addColumn('remitos', 'photo_uploaded_at', {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.addColumn('remitos', 'confirmed_at', {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.addColumn('remitos', 'confirmed_by', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('remitos', 'cancelled_at', {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.addColumn('remitos', 'cancelled_by', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 2c. Eliminar campos antigos
    await queryInterface.removeColumn('remitos', 'dispatched_at');
    await queryInterface.removeColumn('remitos', 'received_at');
    await queryInterface.removeColumn('remitos', 'received_by');
  },

  async down(queryInterface) {
    // Revertir: agregar columnas viejas y quitar nuevas
    await queryInterface.addColumn('remitos', 'dispatched_at', {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.addColumn('remitos', 'received_at', {
      allowNull: true,
      type: Sequelize.DATE,
    });
    await queryInterface.addColumn('remitos', 'received_by', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.removeColumn('remitos', 'cancelled_by');
    await queryInterface.removeColumn('remitos', 'cancelled_at');
    await queryInterface.removeColumn('remitos', 'confirmed_by');
    await queryInterface.removeColumn('remitos', 'confirmed_at');
    await queryInterface.removeColumn('remitos', 'photo_uploaded_at');
    await queryInterface.removeColumn('remitos', 'photo_path');

    // Cambiar ENUM de vuelta
    await queryInterface.changeColumn('remitos', 'status', {
      type: Sequelize.ENUM('PENDIENTE', 'DESPACHADO', 'RECIBIDO', 'ANULADO'),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    });

    await queryInterface.dropTable('product_rankings');
  },
};
