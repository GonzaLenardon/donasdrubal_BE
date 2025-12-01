import Calibraciones from '../models/calibraciones.js';
import Clientes from '../models/clientes.js';
import Maquinas from '../models/maquinas.js';

export const addCalibraciones = async (req, res) => {
  try {
    const data = req.body;

    const resp = await Calibraciones.create(data);

    return res.status(201).json({
      message: 'Calibración creada correctamente',
      data: resp,
    });
  } catch (error) {
    console.error('Error al crear calibración:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const updateCalibraciones = async (req, res) => {
  try {
    const { id } = req.params;

    const calibracion = await Calibraciones.findByPk(id);

    if (!calibracion) {
      return res.status(404).json({ error: 'Calibración no encontrada' });
    }

    const resp = await calibracion.update(req.body);

    return res.status(200).json({
      message: 'Calibración actualizada correctamente',
      data: resp,
    });
  } catch (error) {
    console.error('Error al actualizar calibración:', error);
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};

export const calibracionesMaquinas = async (req, res) => {
  try {
    const { maquina_id } = req.params;

    const resp = await Maquinas.findOne({
      where: { id: maquina_id },
      attributes: ['id', 'marca', 'modelo', 'tipo_maquina'],
      include: [
        {
          model: Clientes,
          as: 'cliente',
          attributes: [
            'id',
            'razon_social',
            'telefono',
            'email',
            'cuil_cuit',
            'ciudad',
            'provincia',
          ],
        },
        {
          model: Calibraciones,
          as: 'calibracionesmaquina',
        },
      ],
    });

    if (!resp) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    return res.status(200).json({
      message: 'Calibraciones obtenidas correctamente',
      data: {
        id_maquina: resp.id,
        tipo: resp.tipo_maquina,
        modelo: resp.modelo,
        marca: resp.marca,
        cliente: resp.cliente,
        calibraciones: resp.calibracionesmaquina,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error en el servidor',
      details: error.message,
    });
  }
};
