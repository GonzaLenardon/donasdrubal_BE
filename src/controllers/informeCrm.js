import InformeCrmService, {
  FiltroInvalidoError,
  RecursoNoEncontradoError,
} from '../services/reportes/informeCrmService.js';

const informeCrm = {
  generar: async (req, res) => {
    try {
      // Este endpoint recibe filtros exclusivamente en el body JSON.
      const filtros = req.body ?? {};
      if (!filtros || typeof filtros !== 'object' || Array.isArray(filtros)) {
        return res.status(400).json({ ok: false, error: 'El body debe ser un objeto JSON' });
      }
      const servicio = new InformeCrmService();
      const data = await servicio.generar(filtros);
      return res.status(200).json({ ok: true, data });
    } catch (error) {
      if (error instanceof FiltroInvalidoError) {
        return res.status(400).json({ ok: false, error: error.message });
      }
      if (error instanceof RecursoNoEncontradoError) {
        return res.status(404).json({ ok: false, error: error.message });
      }
      console.error('Error generando informe configurable CRM:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error generando informe configurable CRM',
        ...(process.env.NODE_ENV === 'production' ? {} : { details: error.message }),
      });
    }
  },
};

export default informeCrm;
