import { DataTypes, Model } from 'sequelize';
import db from '../config/database.js';

class Notas extends Model {}

Notas.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id',
      },
    },
    /*   deletedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    }, */
  },
  {
    sequelize: db,
    modelName: 'Notas',
    tableName: 'notas',
    timestamps: true, // Necesario para paranoid
    paranoid: true, // Activa soft delete
  },
);

export default Notas;
