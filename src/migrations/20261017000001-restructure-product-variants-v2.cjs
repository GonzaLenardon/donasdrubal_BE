'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper: verificar si una tabla existe
    const tableExists = async (tableName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' LIMIT 1`
      );
      return result.length > 0;
    };

    // Helper: verificar si una columna existe
    const columnExists = async (tableName, columnName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}' LIMIT 1`
      );
      return result.length > 0;
    };

    // Helper: verificar si un índice existe
    const indexExists = async (tableName, indexName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND INDEX_NAME = '${indexName}' LIMIT 1`
      );
      return result.length > 0;
    };

    // =================================================================
    // 1. CREATE TABLE rubros
    // =================================================================
    if (!(await tableExists('rubros'))) {
      await queryInterface.createTable('rubros', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        nombre: { allowNull: false, type: Sequelize.STRING(255), unique: true },
        activo: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: true },
        deletedAt: { allowNull: true, type: Sequelize.DATE, field: 'deleted_at' },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }

    // =================================================================
    // 2. CREATE TABLE subrubros
    // =================================================================
    if (!(await tableExists('subrubros'))) {
      await queryInterface.createTable('subrubros', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        nombre: { allowNull: false, type: Sequelize.STRING(255) },
        rubro_id: {
          allowNull: false, type: Sequelize.INTEGER,
          references: { model: 'rubros', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        activo: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: true },
        deletedAt: { allowNull: true, type: Sequelize.DATE, field: 'deleted_at' },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });

      // Índices para subrubros
      if (!(await indexExists('subrubros', 'subrubros_unique_nombre_rubro'))) {
        await queryInterface.addIndex('subrubros', ['rubro_id', 'nombre'], {
          unique: true, name: 'subrubros_unique_nombre_rubro',
        });
      }
      // Índice compuesto para FK products(subrubro_id, rubro_id) → subrubros(id, rubro_id)
      if (!(await indexExists('subrubros', 'subrubros_id_rubro'))) {
        await queryInterface.addIndex('subrubros', ['id', 'rubro_id'], {
          unique: true, name: 'subrubros_id_rubro',
        });
      }
    }

    // =================================================================
    // 3. ALTER TABLE products — add rubro_id, subrubro_id, deleted_at
    // =================================================================
    if (!(await columnExists('products', 'rubro_id'))) {
      await queryInterface.addColumn('products', 'rubro_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'rubros', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      });
    }
    if (!(await columnExists('products', 'subrubro_id'))) {
      await queryInterface.addColumn('products', 'subrubro_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'subrubros', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      });
    }
    if (!(await columnExists('products', 'deleted_at'))) {
      await queryInterface.addColumn('products', 'deleted_at', {
        allowNull: true, type: Sequelize.DATE,
      });
    }

    // Si hay productos sin rubro/subrubro, crear rubro y subrubro por defecto
    const [productsWithoutRubro] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as cnt FROM products WHERE rubro_id IS NULL OR subrubro_id IS NULL`
    );
    if (productsWithoutRubro[0].cnt > 0) {
      // Crear rubro por defecto si no existe
      const [existingRubro] = await queryInterface.sequelize.query(
        `SELECT id FROM rubros WHERE nombre = 'Sin clasificar' LIMIT 1`
      );
      let defaultRubroId;
      if (existingRubro.length === 0) {
        await queryInterface.bulkInsert('rubros', [{
          nombre: 'Sin clasificar',
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]);
        const [newRubro] = await queryInterface.sequelize.query(`SELECT LAST_INSERT_ID() as id`);
        defaultRubroId = newRubro[0].id;
      } else {
        defaultRubroId = existingRubro[0].id;
      }

      // Crear subrubro por defecto si no existe
      const [existingSubrubro] = await queryInterface.sequelize.query(
        `SELECT id FROM subrubros WHERE nombre = 'Sin clasificar' AND rubro_id = ${defaultRubroId} LIMIT 1`
      );
      let defaultSubrubroId;
      if (existingSubrubro.length === 0) {
        await queryInterface.bulkInsert('subrubros', [{
          nombre: 'Sin clasificar',
          rubro_id: defaultRubroId,
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]);
        const [newSubrubro] = await queryInterface.sequelize.query(`SELECT LAST_INSERT_ID() as id`);
        defaultSubrubroId = newSubrubro[0].id;
      } else {
        defaultSubrubroId = existingSubrubro[0].id;
      }

      // Actualizar productos sin rubro/subrubro
      await queryInterface.sequelize.query(
        `UPDATE products SET rubro_id = ${defaultRubroId}, subrubro_id = ${defaultSubrubroId} WHERE rubro_id IS NULL OR subrubro_id IS NULL`
      );
    }

    // Ahora hacer NOT NULL
    await queryInterface.changeColumn('products', 'rubro_id', {
      allowNull: false, type: Sequelize.INTEGER,
    });
    await queryInterface.changeColumn('products', 'subrubro_id', {
      allowNull: false, type: Sequelize.INTEGER,
    });

    // =================================================================
    // 4. ALTER TABLE product_presentations — add deleted_at
    // =================================================================
    if (!(await columnExists('product_presentations', 'deleted_at'))) {
      await queryInterface.addColumn('product_presentations', 'deleted_at', {
        allowNull: true, type: Sequelize.DATE,
      });
    }

    // =================================================================
    // 5. CREATE TABLE product_variants
    // =================================================================
    if (!(await tableExists('product_variants'))) {
      await queryInterface.createTable('product_variants', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        product_id: {
          allowNull: false, type: Sequelize.INTEGER,
          references: { model: 'products', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        presentation_id: {
          allowNull: false, type: Sequelize.INTEGER,
          references: { model: 'product_presentations', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'RESTRICT',
        },
        codigo: { allowNull: false, type: Sequelize.STRING(255), unique: true },
        activo: { allowNull: false, type: Sequelize.BOOLEAN, defaultValue: true },
        ranking: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
        deletedAt: { allowNull: true, type: Sequelize.DATE, field: 'deleted_at' },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });

      // Índice único compuesto (product_id, presentation_id)
      const variantIndexCheck = await queryInterface.sequelize.query(
        `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants' 
         AND INDEX_NAME = 'product_variants_unique' LIMIT 1`
      );
      if (variantIndexCheck[0].length === 0) {
        await queryInterface.addIndex('product_variants', ['product_id', 'presentation_id'], {
          unique: true, name: 'product_variants_unique',
        });
      }
    }

    // =================================================================
    // 6. ALTER TABLE product_lots — add product_variant_id, remove product_id, product_presentation_id
    // =================================================================
    if (!(await columnExists('product_lots', 'product_variant_id'))) {
      await queryInterface.addColumn('product_lots', 'product_variant_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'product_variants', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      });
    }
    // Hacer NOT NULL (tabla vacía)
    await queryInterface.changeColumn('product_lots', 'product_variant_id', {
      allowNull: false, type: Sequelize.INTEGER,
    });
    // Eliminar columnas antiguas
    if (await columnExists('product_lots', 'product_id')) {
      await queryInterface.removeColumn('product_lots', 'product_id');
    }
    if (await columnExists('product_lots', 'product_presentation_id')) {
      await queryInterface.removeColumn('product_lots', 'product_presentation_id');
    }

    // =================================================================
    // 7. ALTER TABLE purchase_items — add product_variant_id, remove product_id, product_presentation_id
    // =================================================================
    if (!(await columnExists('purchase_items', 'product_variant_id'))) {
      await queryInterface.addColumn('purchase_items', 'product_variant_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'product_variants', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      });
    }
    await queryInterface.changeColumn('purchase_items', 'product_variant_id', {
      allowNull: false, type: Sequelize.INTEGER,
    });
    if (await columnExists('purchase_items', 'product_id')) {
      await queryInterface.removeColumn('purchase_items', 'product_id');
    }
    if (await columnExists('purchase_items', 'product_presentation_id')) {
      await queryInterface.removeColumn('purchase_items', 'product_presentation_id');
    }

    // =================================================================
    // 8. ALTER TABLE remito_items — add product_variant_id, remove product_id, product_presentation_id
    // =================================================================
    if (!(await columnExists('remito_items', 'product_variant_id'))) {
      await queryInterface.addColumn('remito_items', 'product_variant_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'product_variants', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT',
      });
    }
    await queryInterface.changeColumn('remito_items', 'product_variant_id', {
      allowNull: false, type: Sequelize.INTEGER,
    });
    if (await columnExists('remito_items', 'product_id')) {
      await queryInterface.removeColumn('remito_items', 'product_id');
    }
    if (await columnExists('remito_items', 'product_presentation_id')) {
      await queryInterface.removeColumn('remito_items', 'product_presentation_id');
    }

    // =================================================================
    // 9. ALTER TABLE warehouse_stock — remove product_id, update index
    // =================================================================
    if (await indexExists('warehouse_stock', 'warehouse_stock_unique')) {
      await queryInterface.removeIndex('warehouse_stock', 'warehouse_stock_unique');
    }
    if (await columnExists('warehouse_stock', 'product_id')) {
      await queryInterface.removeColumn('warehouse_stock', 'product_id');
    }
    // Nuevo índice único: (warehouse_id, product_lot_id)
    if (!(await indexExists('warehouse_stock', 'warehouse_stock_unique'))) {
      await queryInterface.addIndex('warehouse_stock', ['warehouse_id', 'product_lot_id'], {
        unique: true, name: 'warehouse_stock_unique',
      });
    }

    // =================================================================
    // 10. ALTER TABLE stock_movements — remove product_id, update index
    // =================================================================
    if (await indexExists('stock_movements', 'stock_movements_warehouse_product')) {
      await queryInterface.removeIndex('stock_movements', 'stock_movements_warehouse_product');
    }
    if (await columnExists('stock_movements', 'product_id')) {
      await queryInterface.removeColumn('stock_movements', 'product_id');
    }
    // Nuevo índice: (warehouse_id, product_lot_id)
    if (!(await indexExists('stock_movements', 'stock_movements_warehouse_lot'))) {
      await queryInterface.addIndex('stock_movements', ['warehouse_id', 'product_lot_id'], {
        name: 'stock_movements_warehouse_lot',
      });
    }

    // =================================================================
    // 11. DROP TABLE product_rankings
    // =================================================================
    if (await tableExists('product_rankings')) {
      await queryInterface.dropTable('product_rankings');
    }
  },

  async down(queryInterface, Sequelize) {
    // Helper: verificar si una tabla existe
    const tableExists = async (tableName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' LIMIT 1`
      );
      return result.length > 0;
    };

    // Helper: verificar si una columna existe
    const columnExists = async (tableName, columnName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}' LIMIT 1`
      );
      return result.length > 0;
    };

    // Helper: verificar si un índice existe
    const indexExists = async (tableName, indexName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND INDEX_NAME = '${indexName}' LIMIT 1`
      );
      return result.length > 0;
    };

    // 1. Recrear product_rankings
    if (!(await tableExists('product_rankings'))) {
      await queryInterface.createTable('product_rankings', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        product_id: {
          allowNull: false, type: Sequelize.INTEGER,
          references: { model: 'products', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'CASCADE',
        },
        product_presentation_id: {
          allowNull: false, type: Sequelize.INTEGER,
          references: { model: 'product_presentations', key: 'id' },
          onUpdate: 'CASCADE', onDelete: 'CASCADE',
        },
        ranking: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 0 },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }

    // 2. Restaurar product_id en stock_movements
    if (!(await columnExists('stock_movements', 'product_id'))) {
      await queryInterface.addColumn('stock_movements', 'product_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      });
      await queryInterface.changeColumn('stock_movements', 'product_id', {
        allowNull: false, type: Sequelize.INTEGER,
      });
    }
    if (await indexExists('stock_movements', 'stock_movements_warehouse_lot')) {
      await queryInterface.removeIndex('stock_movements', 'stock_movements_warehouse_lot');
    }
    if (!(await indexExists('stock_movements', 'stock_movements_warehouse_product'))) {
      await queryInterface.addIndex('stock_movements', ['warehouse_id', 'product_id'], {
        name: 'stock_movements_warehouse_product',
      });
    }

    // 3. Restaurar product_id en warehouse_stock
    if (!(await columnExists('warehouse_stock', 'product_id'))) {
      await queryInterface.addColumn('warehouse_stock', 'product_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      });
      await queryInterface.changeColumn('warehouse_stock', 'product_id', {
        allowNull: false, type: Sequelize.INTEGER,
      });
    }
    if (await indexExists('warehouse_stock', 'warehouse_stock_unique')) {
      await queryInterface.removeIndex('warehouse_stock', 'warehouse_stock_unique');
    }
    await queryInterface.addIndex('warehouse_stock', ['warehouse_id', 'product_id', 'product_lot_id'], {
      unique: true, name: 'warehouse_stock_unique',
    });

    // 4. Restaurar columnas en remito_items
    if (!(await columnExists('remito_items', 'product_presentation_id'))) {
      await queryInterface.addColumn('remito_items', 'product_presentation_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'product_presentations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('remito_items', 'product_id'))) {
      await queryInterface.addColumn('remito_items', 'product_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      });
      await queryInterface.changeColumn('remito_items', 'product_id', {
        allowNull: false, type: Sequelize.INTEGER,
      });
    }
    if (await columnExists('remito_items', 'product_variant_id')) {
      await queryInterface.removeColumn('remito_items', 'product_variant_id');
    }

    // 5. Restaurar columnas en purchase_items
    if (!(await columnExists('purchase_items', 'product_presentation_id'))) {
      await queryInterface.addColumn('purchase_items', 'product_presentation_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'product_presentations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('purchase_items', 'product_id'))) {
      await queryInterface.addColumn('purchase_items', 'product_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      });
      await queryInterface.changeColumn('purchase_items', 'product_id', {
        allowNull: false, type: Sequelize.INTEGER,
      });
    }
    if (await columnExists('purchase_items', 'product_variant_id')) {
      await queryInterface.removeColumn('purchase_items', 'product_variant_id');
    }

    // 6. Restaurar columnas en product_lots
    if (!(await columnExists('product_lots', 'product_presentation_id'))) {
      await queryInterface.addColumn('product_lots', 'product_presentation_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'product_presentations', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      });
    }
    if (!(await columnExists('product_lots', 'product_id'))) {
      await queryInterface.addColumn('product_lots', 'product_id', {
        allowNull: true, type: Sequelize.INTEGER,
        references: { model: 'products', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      });
      await queryInterface.changeColumn('product_lots', 'product_id', {
        allowNull: false, type: Sequelize.INTEGER,
      });
    }
    if (await columnExists('product_lots', 'product_variant_id')) {
      await queryInterface.removeColumn('product_lots', 'product_variant_id');
    }

    // 7. Eliminar product_variants
    if (await tableExists('product_variants')) {
      await queryInterface.dropTable('product_variants');
    }

    // 8. Eliminar deleted_at de product_presentations
    if (await columnExists('product_presentations', 'deleted_at')) {
      await queryInterface.removeColumn('product_presentations', 'deleted_at');
    }

    // 9. Eliminar columnas de products
    if (await columnExists('products', 'deleted_at')) {
      await queryInterface.removeColumn('products', 'deleted_at');
    }
    if (await columnExists('products', 'subrubro_id')) {
      await queryInterface.removeColumn('products', 'subrubro_id');
    }
    if (await columnExists('products', 'rubro_id')) {
      await queryInterface.removeColumn('products', 'rubro_id');
    }

    // 10. Eliminar subrubros y rubros
    if (await tableExists('subrubros')) {
      await queryInterface.dropTable('subrubros');
    }
    if (await tableExists('rubros')) {
      await queryInterface.dropTable('rubros');
    }
  },
};