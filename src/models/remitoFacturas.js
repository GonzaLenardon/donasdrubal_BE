import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class RemitoFacturas extends Model {}

RemitoFacturas.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    factura_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    remito_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Cantidad facturada de este remito en esta factura, en unidades
    // base (litros). Permite facturación parcial: <= total del remito.
    cantidad_facturada: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: 'RemitoFacturas',
    tableName: 'remito_facturas',
    timestamps: true,
    paranoid: false,
  },
);

export default RemitoFacturas;
