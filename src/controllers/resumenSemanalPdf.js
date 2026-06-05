// controllers/resumenSemanalPdf.js

import PdfResumenService from '../services/pdf/pdfResumenService.js';
import ReporteSemanalService from '../services/reportes/reporteSemanalService.js';

// ─────────────────────────────────────────────────────────────
// Genera datos + PDF
// ─────────────────────────────────────────────────────────────
async function generarPdf(params) {
  const reporteService = new ReporteSemanalService();

  const reporteData = await reporteService.generarReporte(params);

  const pdfService = new PdfResumenService();

  const { pdfBytes, filename } =
    await pdfService.generarReporteSemanal(reporteData);

  return {
    pdfBytes,
    filename,
    reporteData,
  };
}

// ─────────────────────────────────────────────────────────────
// Envía PDF al navegador
// ─────────────────────────────────────────────────────────────
function sendPdf(res, pdfBytes, filename) {
  res.setHeader('Content-Type', 'application/pdf');

  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

  res.send(Buffer.from(pdfBytes));
}

const ResumenSemanalPdf = {
  /**
   * GET /informes/resumen?semana=YYYY-MM-DD
   */
  reporteSemanal: async (req, res) => {
    try {
      const { semana } = req.query;

      const { pdfBytes, filename } = await generarPdf({
        semana,
      });

      sendPdf(res, pdfBytes, filename);
    } catch (error) {
      console.error('❌ Error generando PDF semanal:', error);

      res.status(500).json({
        ok: false,
        error: 'Error generando PDF semanal',
        details: error.message,
      });
    }
  },

  /**
   * POST /informes/resumen/rango
   *
   * {
   *   fechaInicio: 'YYYY-MM-DD',
   *   fechaFin: 'YYYY-MM-DD'
   * }
   */
  reportePorRango: async (req, res) => {
    try {
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

      console.log('📄 filename:', filename);

      sendPdf(res, pdfBytes, filename);
    } catch (error) {
      console.error('❌ Error generando PDF por rango:', error);

      res.status(500).json({
        ok: false,
        error: 'Error generando PDF por rango',
        details: error.message,
      });
    }
  },
};

export default ResumenSemanalPdf;
