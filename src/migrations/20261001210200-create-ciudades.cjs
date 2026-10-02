'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ciudades', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
      },
      provincia_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      provincia_nombre: {
        type: Sequelize.STRING(765),
        allowNull: true,
      },
      nombre: {
        type: Sequelize.STRING(765),
        allowNull: true,
      },
      departamento: {
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
    await queryInterface.addIndex('ciudades', ['provincia_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ciudades');
  },
};
