import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Facturas extends Model {}

Facturas.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },

    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    tipo: {
      type: DataTypes.ENUM('FACTURA', 'ANTICIPO'),
      allowNull: false,
      defaultValue: 'FACTURA',
    },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // Número de factura física. Vacío hasta cargar el comprobante real.
    // La unicidad por empresa (solo facturas no anuladas) la garantiza la
    // columna generada numero_activo + índice único en la migración.
    numero: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    // SIMULADA: etapa actual (marca remitos como facturados).
    // EMITIDA: etapa futura de facturación real.
    // ANULADA: libera los remitos asociados.
    estado: {
      type: DataTypes.ENUM('SIMULADA', 'EMITIDA', 'ANULADA'),
      allowNull: false,
      defaultValue: 'SIMULADA',
    },

    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Facturas',
    tableName: 'facturas',
    timestamps: true,
    paranoid: false,
  },
);

export default Facturas;
