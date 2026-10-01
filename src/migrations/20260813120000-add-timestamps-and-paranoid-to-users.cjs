'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'createdAt', {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.addColumn('users', 'updatedAt', {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.addColumn('users', 'deletedAt', {
      allowNull: true,
      type: Sequelize.DATE,
    });

    await queryInterface.sequelize.query(`
      UPDATE users
      SET createdAt = COALESCE(createdAt, NOW()),
          updatedAt = COALESCE(updatedAt, NOW())
      WHERE createdAt IS NULL OR updatedAt IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'deletedAt');
    await queryInterface.removeColumn('users', 'updatedAt');
    await queryInterface.removeColumn('users', 'createdAt');
  },
};
