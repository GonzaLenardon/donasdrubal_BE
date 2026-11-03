'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('remitos', 'destination_client_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'clientes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    await queryInterface.addColumn('remitos', 'destination_warehouse_id', {
      allowNull: true,
      type: Sequelize.INTEGER,
      references: { model: 'warehouses', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
    await queryInterface.addIndex('remitos', ['destination_warehouse_id'], {
      name: 'remitos_destination_warehouse_id',
    });
  },

  async down(queryInterface, Sequelize) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS total FROM remitos WHERE destination_warehouse_id IS NOT NULL',
    );

    if (Number(rows[0]?.total ?? 0) > 0) {
      throw new Error('No se puede revertir: existen remitos internos con stock transferido.');
    }

    await queryInterface.removeIndex('remitos', 'remitos_destination_warehouse_id');
    await queryInterface.removeColumn('remitos', 'destination_warehouse_id');
    await queryInterface.changeColumn('remitos', 'destination_client_id', {
      allowNull: false,
      type: Sequelize.INTEGER,
      references: { model: 'clientes', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },
};
