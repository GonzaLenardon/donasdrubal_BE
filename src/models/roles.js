import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import db from '../config/database.js';

class Roles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

Roles.init(
    {

      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // unique: true
      },
      descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true
      },      
      deletedAt: {
          allowNull: true,
          type: DataTypes.DATE,
      },      
    },
    {
      sequelize: db,
      modelName: 'Roles',
      tableName: 'roles',
      timestamps: true,
      paranoid: true,
    }
  );

  export default Roles;