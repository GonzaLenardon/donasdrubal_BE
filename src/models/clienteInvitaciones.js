import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class ClienteInvitaciones extends Model {}

ClienteInvitaciones.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cliente_id: { type: DataTypes.INTEGER, allowNull: false },
    token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    creado_por: { type: DataTypes.INTEGER, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    usado_at: { type: DataTypes.DATE, allowNull: true },
    estado: {
      type: DataTypes.ENUM('pendiente', 'usado', 'expirado'),
      allowNull: false,
      defaultValue: 'pendiente',
    },
  },
  {
    sequelize: db,
    modelName: 'ClienteInvitaciones',
    tableName: 'cliente_invitaciones',
    timestamps: true,
    underscored: true,
  },
);

export default ClienteInvitaciones;
