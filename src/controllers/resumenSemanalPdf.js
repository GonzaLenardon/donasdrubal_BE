import PdfResumenService from '../services/pdf/pdfResumenService.js';
import ReporteSemanalService from '../services/reportes/reporteSemanalService.js';

const ResumenSemanalPdf = {
  reporteSemanal: async (req, res) => {
    try {
      const { semana } = req.query;

      // ─────────────────────────────────────
      // 1. Obtener datos del reporte
      // ─────────────────────────────────────

      const reporteService = new ReporteSemanalService();

      const reporteData = await reporteService.generarReporte(semana);

      // ─────────────────────────────────────
      // 2. Generar PDF
      // ─────────────────────────────────────

      const pdfService = new PdfResumenService();

      const { pdfBytes, filename } =
        await pdfService.generarReporteSemanal(reporteData);

      // ─────────────────────────────────────
      // 3. Response PDF
      // ─────────────────────────────────────

      res.setHeader('Content-Type', 'application/pdf');

      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error('❌ Error generando PDF semanal:', error);

      res.status(500).json({
        ok: false,
        error: 'Error generando PDF semanal',
        details: error.message,
      });
    }
  },
};

export default ResumenSemanalPdf;
