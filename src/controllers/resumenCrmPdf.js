import PdfResumenCrmService from '../services/pdf/pdfResumenCrmService.js';
import ResumenCrmService from '../services/reportes/resumenCrmService.js';

async function generarPdf(params) {
  const reporteService = new ResumenCrmService();
  const reporteData = await reporteService.generarResumenV2(params);

  const pdfService = new PdfResumenCrmService();
  const { pdfBytes, filename } =
    await pdfService.generarReporteCrm(reporteData);

  return {
    pdfBytes,
    filename,
    reporteData,
  };
}

function sendPdf(res, pdfBytes, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.send(Buffer.from(pdfBytes));
}

const ResumenCrmPdf = {
  reporteCrm: async (req, res) => {
    try {
      const { semana } = req.query;
      const { pdfBytes, filename } = await generarPdf({ semana });
      sendPdf(res, pdfBytes, filename);
    } catch (error) {
      console.error('❌ Error generando PDF Resumen CRM:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error generando PDF Resumen CRM',
        details: error.message,
      });
    }
  },

  reportePorRango: async (req, res) => {
    try {
      console.log('QUE LLEGAR', req.body);
      const { fechaInicio, fechaFin } = req.body;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          ok: false,
          error: 'fechaInicio y fechaFin son requeridos',
        });
      }

      if (fechaInicio > fechaFin) {
        return res.status(400).json({
          ok: false,
          error: 'fechaInicio no puede ser mayor que fechaFin',
        });
      }

      const { pdfBytes, filename } = await generarPdf({
        fechaInicio,
        fechaFin,
      });
      sendPdf(res, pdfBytes, filename);
    } catch (error) {
      console.error('❌ Error generando PDF Resumen CRM por rango:', error);
      return res.status(500).json({
        ok: false,
        error: 'Error generando PDF Resumen CRM por rango',
        details: error.message,
      });
    }
  },
};

export default ResumenCrmPdf;
