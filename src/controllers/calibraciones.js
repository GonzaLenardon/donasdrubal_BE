import Calibraciones from '../models/calibraciones.js';

export const addCalibraciones = async (req, res) => {
  try {
    const {
      fecha,
      responsable,
      estado_maquina,
      estado_bomba,
      estado_agitador,
      estado_filtroPrimario,
      estado_filtroSecundario,
      estado_FiltroLinea,
      estado_manguerayconexiones,
      estado_antigoteo,
      estado_limpiezaTanque,
      estabilidadVerticalBotalon,
      estado_pastillas,
      Observaciones,
      maquina_id,
    } = req.body;

    const resp = await Calibraciones.create({
      fecha,
      responsable,
      estado_maquina,
      estado_bomba,
      estado_agitador,
      estado_filtroPrimario,
      estado_filtroSecundario,
      estado_FiltroLinea,
      estado_manguerayconexiones,
      estado_antigoteo,
      estado_limpiezaTanque,
      estabilidadVerticalBotalon,
      estado_pastillas,
      Observaciones,
      maquina_id,
    });

    res.status(201).json(resp);
  } catch (error) {
    console.error('Error al crear calibración:', error);
    res.status(500).json({ error: 'Error al crear calibración' });
  }
};

export const calibracionesMaquinas = async (req, res) => {
  try {
    const maquina = req.params.maquina;
    console.log('Maquinas', maquina);

    const calibracion = await Calibraciones.findAll({
      where: { maquina_id: maquina },
    });
    console.log('first', calibracion);
    res.status(201).json(calibracion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
