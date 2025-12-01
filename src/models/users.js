import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import db from '../config/database.js';

class Users extends Model {
  // Método para crear hash
  static async createHash(pass, salt) {
    return await bcrypt.hash(pass, salt);
  }

  // Método para validar contraseña
  async validatePass(pass) {
    const newHash = await bcrypt.hash(pass, this.salt);
    return newHash === this.password;
  }
}

Users.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    /* 
    cuit: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    domicilio: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    datosImpositivos: {
      type: DataTypes.STRING,
      allowNull: false,
    }, */
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // is_active:
    // { type: DataTypes.BOOLEAN,
    //   defaultValue: true,
    // },
    salt: {
      type: DataTypes.STRING,
    },

    rol: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize: db,
    modelName: 'users',
    tableName: 'users',
    timestamps: false,
  }
);

// Hook para encriptar antes de crear
Users.beforeCreate(async (user) => {
  const salt = await bcrypt.genSalt();
  user.salt = salt;
  user.password = await Users.createHash(user.password, salt);
});

export default Users;
