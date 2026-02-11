import { TipoServicios } from '../models/index.js';

const controllersTipoServicios = {
  add: async (req, res) => {
    try {
      const data = req.body;
      console.log('data', data);

      const tipoServicio = await TipoServicios.create(data);

      return res.status(201).json(tipoServicio);
    } catch (error) {
      console.error('Error al crear TipoServicio:', error);
      return res.status(500).json({
        message: 'Error al crear tipo de servicio',
      });
    }
  },

  getAll: async (req, res) => {
    try {
      const tipos = await TipoServicios.findAll();
      return res.status(200).json(tipos);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al obtener servicios' });
    }
  },
};

export default controllersTipoServicios;
