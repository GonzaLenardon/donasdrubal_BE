'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('paises', {
      pais_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      pais_iso: {
        type: Sequelize.CHAR(6),
        allowNull: true,
      },
      pais_nombre: {
        type: Sequelize.STRING(240),
        allowNull: true,
      },
      pais_nombre_en: {
        type: Sequelize.STRING(240),
        allowNull: true,
      },
      pais_codigo_telefono: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('paises');
  },
};
