'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE remitos MODIFY COLUMN destination_client_id INTEGER NULL',
    );
  },

  async down(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) AS total FROM remitos WHERE destination_warehouse_id IS NOT NULL',
    );

    if (Number(rows[0]?.total ?? 0) > 0) {
      throw new Error('No se puede volver a NOT NULL: existen remitos internos.');
    }

    await queryInterface.sequelize.query(
      'ALTER TABLE remitos MODIFY COLUMN destination_client_id INTEGER NOT NULL',
    );
  },
};
