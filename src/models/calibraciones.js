import { DataTypes, Model } from 'sequelize';
import { ESTADOS_CALIDAD } from '../config/constants/calibracion.js';
import db from '../config/database.js';

class Calibraciones extends Model {}

Calibraciones.init(
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
    responsable: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    estado_maquina: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,
    },

    observaciones_estado_maquina: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_bomba: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,
    },
    observaciones_estado_bomba: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_agitador: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,  
    },

    observaciones_estado_agitador: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_filtroPrimario: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,  
    },

    observarciones_estado_filtroPrimario: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_filtroSecundario: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,
    },

    observaciones_filtroSecundario: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_FiltroLinea: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,  
    },

    observaciones_estado_FiltroLinea: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_manguerayconexiones: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,  
    },

    observaciones_estado_manguerayconexiones: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_antigoteo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,  
    },

    observaciones_estado_antigoteo: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_limpiezaTanque: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,  
    },

    observaciones_estado_limpiezaTanque: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estado_pastillas: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,  
    },

    observaciones_estado_pastillas: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    estabilidadVerticalBotalon: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ESTADOS_CALIDAD.NO_APLICA,  
    },

    observaciones_estabilidadVerticalBotalon: {
      type: DataTypes.STRING,
      allowNull: false,
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
    maquina_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
