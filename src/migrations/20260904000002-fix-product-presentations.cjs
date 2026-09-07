'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Eliminar FK existente de product_presentations → products
    await queryInterface.removeConstraint('product_presentations', 'product_presentations_ibfk_1');

    // 2. Eliminar columna product_id
    await queryInterface.removeColumn('product_presentations', 'product_id');

    // 3. Renombrar descripcion → nombre
    await queryInterface.renameColumn('product_presentations', 'descripcion', 'nombre');

    // 4. Eliminar columnas que ya no aplican
    await queryInterface.removeColumn('product_presentations', 'unidad_medida');
    await queryInterface.removeColumn('product_presentations', 'cantidad');

    // 5. Agregar unidad_base_id (FK self-referencing, nullable)
    await queryInterface.addColumn('product_presentations', 'unidad_base_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'product_presentations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 6. Agregar cantidad_base (nullable)
    await queryInterface.addColumn('product_presentations', 'cantidad_base', {
      allowNull: true,
      type: Sequelize.DECIMAL(15, 4),
    });

    // 7. Agregar product_presentation_id a products
    await queryInterface.addColumn('products', 'product_presentation_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'product_presentations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir cambios
    await queryInterface.removeColumn('products', 'product_presentation_id');

    await queryInterface.removeColumn('product_presentations', 'cantidad_base');
    await queryInterface.removeColumn('product_presentations', 'unidad_base_id');

    await queryInterface.addColumn('product_presentations', 'cantidad', {
      allowNull: true,
      type: Sequelize.DECIMAL(15, 4),
    });

    await queryInterface.addColumn('product_presentations', 'unidad_medida', {
      allowNull: true,
      type: Sequelize.STRING(50),
    });

    await queryInterface.renameColumn('product_presentations', 'nombre', 'descripcion');

    await queryInterface.addColumn('product_presentations', 'product_id', {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: { model: 'products', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },
};
