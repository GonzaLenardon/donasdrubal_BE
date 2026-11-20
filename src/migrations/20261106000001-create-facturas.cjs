'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ---------------------------------------------------------------
    // Helpers de existencia (idempotentes).
    // Ojo: el backend corre con nodemon + db.sync({ alter: false }),
    // que puede crear las tablas desde los modelos ANTES de que corra
    // esta migración. Por eso cada objeto se verifica por separado:
    // tabla, columna, índice y constraint.
    // ---------------------------------------------------------------
    const tableExists = async (tableName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' LIMIT 1`
      );
      return result.length > 0;
    };

    const columnaExiste = async (tableName, columnName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}' LIMIT 1`
      );
      return result.length > 0;
    };

    const indiceExiste = async (tableName, indexName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' AND INDEX_NAME = '${indexName}' LIMIT 1`
      );
      return result.length > 0;
    };

    const fkExiste = async (tableName, columnName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' 
           AND COLUMN_NAME = '${columnName}' AND REFERENCED_TABLE_NAME IS NOT NULL LIMIT 1`
      );
      return result.length > 0;
    };

    // =================================================================
    // 1. TABLE facturas
    //    Cabecera de facturación (simulada en esta etapa, real en la
    //    próxima). Soporta facturas con N remitos, facturación parcial
    //    y anticipos sin remitos asociados.
    // =================================================================
    if (!(await tableExists('facturas'))) {
      await queryInterface.createTable('facturas', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        company_id: { allowNull: false, type: Sequelize.INTEGER, defaultValue: 1 },
        cliente_id: { allowNull: false, type: Sequelize.INTEGER },
        tipo: {
          allowNull: false, type: Sequelize.ENUM('FACTURA', 'ANTICIPO'),
          defaultValue: 'FACTURA',
        },
        fecha: { allowNull: false, type: Sequelize.DATEONLY },
        numero: { allowNull: true, type: Sequelize.STRING(20) },
        estado: {
          allowNull: false, type: Sequelize.ENUM('SIMULADA', 'EMITIDA', 'ANULADA'),
          defaultValue: 'SIMULADA',
        },
        notas: { allowNull: true, type: Sequelize.TEXT },
        created_by: { allowNull: true, type: Sequelize.INTEGER },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }

    // =================================================================
    // 2. numero_activo: columna generada que expone `numero` solo
    //    cuando la factura NO está anulada. El índice único sobre esta
    //    columna garantiza N° de factura único por empresa entre las
    //    facturas vigentes, permitiendo reutilizar el número luego de
    //    anular (los NULL no colisionan en MySQL/MariaDB).
    // =================================================================
    if (!(await columnaExiste('facturas', 'numero_activo'))) {
      await queryInterface.sequelize.query(
        `ALTER TABLE facturas
           ADD COLUMN numero_activo VARCHAR(20)
             GENERATED ALWAYS AS (CASE WHEN estado <> 'ANULADA' THEN numero ELSE NULL END) STORED`
      );
    }
    if (!(await indiceExiste('facturas', 'facturas_numero_activo_unique'))) {
      await queryInterface.sequelize.query(
        `ALTER TABLE facturas ADD UNIQUE INDEX facturas_numero_activo_unique (company_id, numero_activo)`
      );
    }

    if (!(await indiceExiste('facturas', 'facturas_cliente_id'))) {
      await queryInterface.addIndex('facturas', ['cliente_id'], { name: 'facturas_cliente_id' });
    }
    if (!(await indiceExiste('facturas', 'facturas_estado'))) {
      await queryInterface.addIndex('facturas', ['estado'], { name: 'facturas_estado' });
    }

    // FKs (si la tabla la creó db.sync desde los modelos, puede venir sin ellas)
    if (!(await fkExiste('facturas', 'cliente_id'))) {
      await queryInterface.addConstraint('facturas', {
        fields: ['cliente_id'],
        type: 'foreign key',
        name: 'facturas_cliente_id_fk',
        references: { table: 'clientes', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }
    if (!(await fkExiste('facturas', 'created_by'))) {
      await queryInterface.addConstraint('facturas', {
        fields: ['created_by'],
        type: 'foreign key',
        name: 'facturas_created_by_fk',
        references: { table: 'users', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    // =================================================================
    // 3. TABLE remito_facturas
    //    Detalle factura <-> remito. Una factura puede tener N remitos,
    //    un remito puede aparecer en N facturas (facturación parcial
    //    repartida), y `cantidad_facturada` permite facturar menos del
    //    total del remito (unidades base / litros).
    // =================================================================
    if (!(await tableExists('remito_facturas'))) {
      await queryInterface.createTable('remito_facturas', {
        id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
        factura_id: { allowNull: false, type: Sequelize.INTEGER },
        remito_id: { allowNull: false, type: Sequelize.INTEGER },
        cantidad_facturada: { allowNull: false, type: Sequelize.DECIMAL(15, 4) },
        createdAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { allowNull: false, type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      });
    }

    if (!(await indiceExiste('remito_facturas', 'remito_facturas_unico'))) {
      await queryInterface.addIndex('remito_facturas', ['factura_id', 'remito_id'], {
        name: 'remito_facturas_unico',
        unique: true,
      });
    }
    if (!(await indiceExiste('remito_facturas', 'remito_facturas_remito'))) {
      await queryInterface.addIndex('remito_facturas', ['remito_id'], {
        name: 'remito_facturas_remito',
      });
    }

    if (!(await fkExiste('remito_facturas', 'factura_id'))) {
      await queryInterface.addConstraint('remito_facturas', {
        fields: ['factura_id'],
        type: 'foreign key',
        name: 'remito_facturas_factura_fk',
        references: { table: 'facturas', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
    if (!(await fkExiste('remito_facturas', 'remito_id'))) {
      await queryInterface.addConstraint('remito_facturas', {
        fields: ['remito_id'],
        type: 'foreign key',
        name: 'remito_facturas_remito_fk',
        references: { table: 'remitos', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }
  },

  async down(queryInterface) {
    const tableExists = async (tableName) => {
      const [result] = await queryInterface.sequelize.query(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${tableName}' LIMIT 1`
      );
      return result.length > 0;
    };

    if (await tableExists('remito_facturas')) {
      await queryInterface.dropTable('remito_facturas');
    }
    if (await tableExists('facturas')) {
      await queryInterface.dropTable('facturas');
    }
  },
};
