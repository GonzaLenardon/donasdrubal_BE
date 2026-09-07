'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // =====================================================================
    // 1. PRODUCTS
    // =====================================================================
    await queryInterface.createTable('products', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        allowNull: false,
        type: Sequelize.STRING(255),
      },
      codigo: {
        allowNull: false,
        type: Sequelize.STRING(255),
        unique: true,
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

    // =====================================================================
    // 2. PRODUCT_PRESENTATIONS
    // =====================================================================
    await queryInterface.createTable('product_presentations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      descripcion: {
        allowNull: true,
        type: Sequelize.STRING(255),
      },
      unidad_medida: {
        allowNull: true,
        type: Sequelize.STRING(50),
      },
      cantidad: {
        allowNull: true,
        type: Sequelize.DECIMAL(15, 4),
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

    // =====================================================================
    // 3. PRODUCT_LOTS
    // =====================================================================
    await queryInterface.createTable('product_lots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_presentation_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'product_presentations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      lot_number: {
        allowNull: false,
        type: Sequelize.STRING(255),
      },
      manufacturing_date: {
        allowNull: true,
        type: Sequelize.DATEONLY,
      },
      expiration_date: {
        allowNull: true,
        type: Sequelize.DATEONLY,
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

    // =====================================================================
    // 4. WAREHOUSES
    // =====================================================================
    await queryInterface.createTable('warehouses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      company_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      nombre: {
        allowNull: false,
        type: Sequelize.STRING(255),
      },
      codigo: {
        allowNull: false,
        type: Sequelize.STRING(10),
      },
      direccion: {
        allowNull: true,
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

    // =====================================================================
    // 5. PROVIDERS
    // =====================================================================
    await queryInterface.createTable('providers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      nombre: {
        allowNull: false,
        type: Sequelize.STRING(255),
      },
      cuit: {
        allowNull: true,
        type: Sequelize.STRING(20),
      },
      email: {
        allowNull: true,
        type: Sequelize.STRING(255),
      },
      telefono: {
        allowNull: true,
        type: Sequelize.STRING(50),
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

    // =====================================================================
    // 6. WAREHOUSE_STOCK
    // =====================================================================
    await queryInterface.createTable('warehouse_stock', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      warehouse_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_lot_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'product_lots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 4),
        defaultValue: 0,
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

    await queryInterface.addIndex('warehouse_stock', ['warehouse_id', 'product_id', 'product_lot_id'], {
      unique: true,
      name: 'warehouse_stock_unique',
    });

    // =====================================================================
    // 7. PURCHASES
    // =====================================================================
    await queryInterface.createTable('purchases', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      provider_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'providers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      warehouse_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      purchase_date: {
        allowNull: false,
        type: Sequelize.DATEONLY,
      },
      notes: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      created_by: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    // =====================================================================
    // 8. PURCHASE_ITEMS
    // =====================================================================
    await queryInterface.createTable('purchase_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      purchase_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'purchases', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_presentation_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'product_presentations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      quantity: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 4),
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

    // =====================================================================
    // 9. PURCHASE_ITEM_LOTS
    // =====================================================================
    await queryInterface.createTable('purchase_item_lots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      purchase_item_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'purchase_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_lot_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'product_lots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 4),
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

    // =====================================================================
    // 10. REMITOS
    // =====================================================================
    await queryInterface.createTable('remitos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      company_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      remito_number: {
        allowNull: false,
        type: Sequelize.STRING(20),
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM('OFICIAL', 'NO_OFICIAL'),
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('PENDIENTE', 'DESPACHADO', 'RECIBIDO', 'ANULADO'),
        defaultValue: 'PENDIENTE',
      },
      origin_warehouse_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      destination_client_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'clientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      issued_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      dispatched_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      received_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      created_by: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      received_by: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        allowNull: true,
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('remitos', ['company_id', 'origin_warehouse_id', 'remito_number'], {
      unique: true,
      name: 'remitos_unique_number',
    });

    // =====================================================================
    // 11. REMITO_ITEMS
    // =====================================================================
    await queryInterface.createTable('remito_items', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      remito_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'remitos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_presentation_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'product_presentations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      quantity_requested: {
        allowNull: true,
        type: Sequelize.DECIMAL(15, 4),
      },
      quantity_dispatched: {
        allowNull: true,
        type: Sequelize.DECIMAL(15, 4),
      },
      description: {
        allowNull: true,
        type: Sequelize.STRING(255),
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

    // =====================================================================
    // 12. REMITO_ITEM_LOTS (FIFO)
    // =====================================================================
    await queryInterface.createTable('remito_item_lots', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      remito_item_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'remito_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_lot_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'product_lots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantity_dispatched: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 4),
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

    // =====================================================================
    // 13. STOCK_MOVEMENTS
    // =====================================================================
    await queryInterface.createTable('stock_movements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      company_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      warehouse_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'warehouses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_lot_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: 'product_lots', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      movement_type: {
        allowNull: false,
        type: Sequelize.ENUM('ENTRADA', 'SALIDA'),
      },
      quantity: {
        allowNull: false,
        type: Sequelize.DECIMAL(15, 4),
      },
      reference_type: {
        allowNull: true,
        type: Sequelize.STRING(50),
      },
      reference_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      remito_id: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'remitos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      movement_date: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      created_by: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      notes: {
        allowNull: true,
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('stock_movements', ['warehouse_id', 'product_id'], {
      name: 'stock_movements_warehouse_product',
    });
    await queryInterface.addIndex('stock_movements', ['movement_type'], {
      name: 'stock_movements_type',
    });
    await queryInterface.addIndex('stock_movements', ['remito_id'], {
      name: 'stock_movements_remito',
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar en orden inverso (respetando FK)
    await queryInterface.dropTable('stock_movements');
    await queryInterface.dropTable('remito_item_lots');
    await queryInterface.dropTable('remito_items');
    await queryInterface.dropTable('remitos');
    await queryInterface.dropTable('purchase_item_lots');
    await queryInterface.dropTable('purchase_items');
    await queryInterface.dropTable('purchases');
    await queryInterface.dropTable('warehouse_stock');
    await queryInterface.dropTable('providers');
    await queryInterface.dropTable('warehouses');
    await queryInterface.dropTable('product_lots');
    await queryInterface.dropTable('product_presentations');
    await queryInterface.dropTable('products');
  },
};
