import dotenv from 'dotenv';

import ReporteSemanalService from '../services/reportes/reporteSemanalService.js';
import PdfResumenService from '../services/pdf/pdfResumenService.js';
import EmailService from '../services/email/emailService.js';

dotenv.config();

async function ejecutarResumenSemanal() {
  try {
    console.log('====================================');
    console.log('⏰ Iniciando resumen semanal');
    console.log(new Date().toISOString());
    console.log('====================================');

    // 1. Obtener datos
    const reporteService = new ReporteSemanalService();

    const reporteData = await reporteService.generarReporte();

    if (reporteData.total_clientes === 0) {
      console.log('ℹ️ No existen clientes con actividad. Se cancela envío.');

      process.exit(0);
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

    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando resumen semanal:', error);

    process.exit(1);
  }
}

ejecutarResumenSemanal();
