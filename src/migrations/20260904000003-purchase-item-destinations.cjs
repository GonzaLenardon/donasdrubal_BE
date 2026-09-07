'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear tabla purchase_item_destinations
    await queryInterface.createTable('purchase_item_destinations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      purchase_item_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'purchase_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      warehouse_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 4),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 2. Hacer warehouse_id nullable en purchases
    await queryInterface.changeColumn('purchases', 'warehouse_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'warehouses', key: 'id' },
    });
  },

  async down(queryInterface) {
    await queryInterface.changeColumn('purchases', 'warehouse_id', {
      allowNull: false,
      type: Sequelize.INTEGER,
    });
    await queryInterface.dropTable('purchase_item_destinations');
  },
};
