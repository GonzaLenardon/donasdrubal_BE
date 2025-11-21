import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Clientes extends Model {}

Clientes.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },    
    user_id: {    // Relación con users
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    categoria: { 
        type: DataTypes.ENUM('alto', 'medio', 'bajo'),
        allowNull: false,
        defaultValue: 'medio'
    },  
    razon_social: { // Razon Social
      type: DataTypes.STRING,
      allowNull: false,
    },
    direccion_fiscal: { // Direccion Razon Social
      type: DataTypes.STRING,
      allowNull: true,
    },
    cuil_cuit: {   //CUIT
      type: DataTypes.STRING,
      allowNull: true,
    },
    iva_id: {   //Condición frente al IVA
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    direccion: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    ciudad: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    provincia: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    pais: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    estado: {      // estado de cliente:"Nuevo", "En Proceso", "Contactado", "Calificado", "Cliente", "Perdido"
      type: DataTypes.STRING,
      defaultValue: 'Nuevo',
    },

    modo_ingreso: {           // Cómo llegó el cliente: Web, campaña, referido, redes sociales, etc.
      type: DataTypes.STRING,
      allowNull: true,
    },

    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Cliente',
    tableName: 'clientes',
    timestamps: false,
  }
);

export default Clientes;
