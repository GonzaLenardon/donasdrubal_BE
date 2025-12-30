import { DataTypes, Model } from 'sequelize';
import { ESTADOS_CALIDAD } from '../config/constants/calibracion.js';
import db from '../config/database.js';

class Calibraciones extends Model {}

const estadoJSON = () => ({
  estado: ESTADOS_CALIDAD.NO_APLICA,
  observacion: '',
  nombre_archivo: '',
  path: '',
});

Calibraciones.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    maquina_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },    
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_maquina: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_bomba: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_agitador: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_filtroPrimario: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_filtroSecundario: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_filtroLinea: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_manguerayconexiones: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_antigoteo: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_limpiezaTanque: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estado_pastillas: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    estabilidadVerticalBotalon: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: estadoJSON,
    },

    presion_unimap: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    presion_computadora: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    presion_manometro: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },  

    observaciones_acronex: {
      type: DataTypes.STRING,
      allowNull: true,
    },    

    Observaciones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deletedAt: {
      allowNull: true,
      type: DataTypes.DATE,
    },
  },
  {
    sequelize: db,
    modelName: 'Calibraciones',
    tableName: 'calibraciones',
    timestamps: false,
    paranoid: true, // Activa soft delete
  }
);

export default Calibraciones;
