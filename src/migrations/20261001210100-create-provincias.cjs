'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('provincias', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      pais_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      nombre: {
        type: Sequelize.STRING(765),
        allowNull: true,
      },
      latitude: {
        type: Sequelize.STRING(765),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.STRING(765),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
    await queryInterface.addIndex('provincias', ['pais_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provincias');
  },
};
