'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_brands', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(255),
      },
      activo: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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

    const now = new Date();
    await queryInterface.bulkInsert('product_brands', [
      { nombre: 'Generica', activo: true, createdAt: now, updatedAt: now },
    ]);

    const [genericBrand] = await queryInterface.sequelize.query(
      "SELECT id FROM product_brands WHERE nombre = 'Generica' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT },
    );

    await queryInterface.addColumn('products', 'brand_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'product_brands', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });

    await queryInterface.bulkUpdate(
      'products',
      { brand_id: genericBrand.id },
      { brand_id: null },
    );

    await queryInterface.changeColumn('products', 'brand_id', {
      allowNull: false,
      type: Sequelize.INTEGER,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'brand_id');
    await queryInterface.dropTable('product_brands');
  },
};
