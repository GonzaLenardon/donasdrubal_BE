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
        unique: true
      },
      descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true
      },      
      // createdAt: {
      //   allowNull: false,
      //   type: DataTypes.DATE,
      //   defaultValue: DataTypes.NOW
      // },
      // updatedAt: {
      //   allowNull: false,
      //   type: DataTypes.DATE,
      //   defaultValue: DataTypes.NOW
      // },
    },
    {
      sequelize: db,
      modelName: 'Roles',
      tableName: 'roles',
      timestamps: false
    }
  );

  export default Roles;