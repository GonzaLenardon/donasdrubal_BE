import pdfMuestraAguaService from '../services/pdfMuestraAguaService.js';

const Informes = {
  muestraAgua: async (req, res) => {
    try {
      const muestra_id = parseInt(req.params.muestra_id, 10);

      if (!muestra_id || isNaN(muestra_id)) {
        return res.status(400).json({
          error: 'muestra_id debe ser un número válido',
        });
      }

      const { pdfBytes, filename } =
        await pdfMuestraAguaService.generarInformeMuestraAgua(muestra_id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error('Error generando informe de muestra:', error);

      if (error.message?.includes('No se encontró la muestra')) {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({
        error: 'Error generando el PDF',
        detail: error.message,
      });
    }
  },

  muestraPozos: async (req, res) => {
    try {
      console.log('Request recibido para generar informe de pozos', req.body);
      const { cliente_id, pozos_ids, conclusion } = req.body;

      if (!cliente_id) {
        return res.status(400).json({
          error: 'cliente_id requerido',
        });
      }

      if (!Array.isArray(pozos_ids) || pozos_ids.length === 0) {
        return res.status(400).json({
          error: 'Debe enviar un array de pozos_ids',
        });
      }

      const { pdfBytes, filename } =
        await pdfMuestraAguaService.generarInformeCalidadAgua(
          cliente_id,
          pozos_ids,
          conclusion,
        );

      res.setHeader('Content-Type', 'application/pdf');

      /*    res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      ); */
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: 'Error generando el PDF',
      });
    }
  },
};

export default Informes;
