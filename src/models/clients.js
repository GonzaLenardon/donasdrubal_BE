import { Model, DataTypes } from 'sequelize';
import db from '../config/database.js';

class Clients extends Model {}

Clients.init(
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
    rating: { 
        type: DataTypes.ENUM('alto', 'medio', 'bajo'),
        allowNull: false,
        defaultValue: 'medio'
    },  
    company_name: { // Razon Social
      type: DataTypes.STRING,
      allowNull: false,
    },
    company_address: { // Direccion Razon Social
      type: DataTypes.STRING,
      allowNull: true,
    },
    tax_id: {   //CUIT
      type: DataTypes.STRING,
      allowNull: true,
    },
    iva_id: {   //Condición frente al IVA
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    lead_status: {      // estado de cliente:"Nuevo", "En Proceso", "Contactado", "Calificado", "Cliente", "Perdido"
      type: DataTypes.STRING,
      defaultValue: 'Nuevo',
    },

    source: {           // Cómo llegó el cliente: Web, campaña, referido, redes sociales, etc.
      type: DataTypes.STRING,
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    modelName: 'Client',
    tableName: 'clients',
    timestamps: false,
  }
);

export default Clients;
