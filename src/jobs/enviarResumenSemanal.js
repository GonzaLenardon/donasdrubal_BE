// controllers/jobsController.js

import ReporteSemanalService from '../services/reportes/reporteSemanalService.js';
import PdfResumenService from '../services/pdf/OldpdfResumenService.js';
import EmailService from '../services/email/emailService.js';

/**
 * GET /api/jobs/resumen-semanal
 *
 * Endpoint exclusivo para ser invocado por el cron de Plesk via curl.
 * Replica exactamente la lógica de enviarResumenSemanal.js.
 */
export const ejecutarResumenSemanal = async (req, res) => {
  try {
    console.log('====================================');
    console.log('⏰ Iniciando resumen semanal via HTTP');
    console.log(new Date().toISOString());
    console.log('====================================');

    // 1. Obtener datos
    const reporteService = new ReporteSemanalService();
    const reporteData = await reporteService.generarReporte();

    if (reporteData.total_clientes === 0) {
      console.log('ℹ️ No existen clientes con actividad. Se cancela envío.');
      return res.status(200).json({
        ok: true,
        mensaje: 'Sin actividad en la semana. No se envió email.',
      });
    }

    // 2. Generar PDF
    const pdfService = new PdfResumenService();
    const { pdfBytes, filename } =
      await pdfService.generarReporteSemanal(reporteData);
    console.log(`📄 PDF generado: ${filename}`);

    // 3. Enviar Email
    await EmailService.enviarResumenSemanal({
      pdfBytes,
      filename,
      reporteData,
    });
    console.log('✅ Email enviado correctamente');

    return res.status(200).json({
      ok: true,
      mensaje: 'Resumen semanal enviado correctamente',
      periodo: reporteData.periodo,
      total_clientes: reporteData.total_clientes,
    });
  } catch (error) {
    console.error('❌ Error ejecutando resumen semanal:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error ejecutando resumen semanal',
      details: error.message,
    });
  }
};
