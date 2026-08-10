'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clientes', 'createdAt', {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.addColumn('clientes', 'updatedAt', {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.addColumn('clientes', 'deletedAt', {
      allowNull: true,
      type: Sequelize.DATE,
    });

    await queryInterface.sequelize.query(`
      UPDATE clientes
      SET createdAt = COALESCE(createdAt, NOW()),
          updatedAt = COALESCE(updatedAt, NOW())
      WHERE createdAt IS NULL OR updatedAt IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clientes', 'deletedAt');
    await queryInterface.removeColumn('clientes', 'updatedAt');
    await queryInterface.removeColumn('clientes', 'createdAt');
  },
};
