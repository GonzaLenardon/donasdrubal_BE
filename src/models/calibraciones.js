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

const estadoJSONBomba = () => ({
  estado: ESTADOS_CALIDAD.NO_APLICA,
  observacion: '',
  modelo: '',
  materiales: '',
  nombre_archivo: '',
  path: '',
});

// 👇 NUEVO: default para campos de presión
const presionJSON = () => ({
  valor: '',
  nombreArchivo: '',
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
      allowNull: true,
    },
    responsable: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 👇 NUEVO: imagen del informe
    imagen: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },

    estado_maquina: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estado_bomba: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSONBomba,
    },
    estado_agitador: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estado_filtroPrimario: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estado_filtroSecundario: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estado_filtroLinea: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estado_manguerayconexiones: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estado_antigoteo: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estado_limpiezaTanque: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estado_pastillas: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    estabilidadVerticalBotalon: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },
    mixer: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: estadoJSON,
    },

    // 👇 CAMBIO: de FLOAT a JSON para soportar { valor, nombreArchivo }
    presion_unimap: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: presionJSON,
    },
    presion_computadora: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: presionJSON,
    },
    presion_manometro: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: presionJSON,
    },

    secciones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    observaciones_acronex: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Observaciones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    id_alerta_origen: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'alertas_servicios',
        key: 'id_alerta',
      },
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'PENDIENTE',
      validate: {
        isIn: [['PENDIENTE', 'ALERTADO', 'VENCIDO', 'COMPLETADO', 'CANCELADO']],
      },
    },
  },
  {
    sequelize: db,
    modelName: 'Calibraciones',
    tableName: 'calibraciones',
    timestamps: true,
    paranoid: true,
  },
);

export default Calibraciones;
