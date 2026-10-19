'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Los registros que ya existen representan clientes. El default temporal
    // permite agregarlos sin convertirlos accidentalmente en prospectos.
    await queryInterface.addColumn('clientes', 'tipo_registro', {
      type: Sequelize.ENUM('prospecto', 'cliente'),
      allowNull: false,
      defaultValue: 'cliente',
    });

    await queryInterface.sequelize.query(`
      UPDATE clientes
      SET tipo_registro = 'cliente'
    `);

    // Los nuevos registros creados directamente en la tabla quedan como prospectos.
    await queryInterface.changeColumn('clientes', 'tipo_registro', {
      type: Sequelize.ENUM('prospecto', 'cliente'),
      allowNull: false,
      defaultValue: 'prospecto',
    });

    await queryInterface.createTable('cliente_invitaciones', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      creado_por: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      usado_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'usado', 'expirado'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('cliente_invitaciones', ['cliente_id']);
    await queryInterface.addIndex('cliente_invitaciones', ['creado_por']);
    await queryInterface.addIndex('cliente_invitaciones', ['estado', 'expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cliente_invitaciones');
    await queryInterface.removeColumn('clientes', 'tipo_registro');
  },
};
