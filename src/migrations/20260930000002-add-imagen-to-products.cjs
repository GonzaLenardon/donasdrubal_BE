'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('products', 'imagen', {
      allowNull: true,
      type: Sequelize.STRING(500),
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'imagen');
  },
};
