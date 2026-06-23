import cron from 'node-cron';

import ResumenCrmService from '../services/reportes/resumenCrmService.js';
import PdfResumenCrmService from '../services/pdf/pdfResumenCrmService.js';
import EmailService from '../services/email/emailService.js';

const iniciarResumenCrmCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('⏰ Iniciando generación de Resumen CRM automático...');

      const reporteService = new ResumenCrmService();
      const reporteData = await reporteService.generarResumen();

      if (reporteData.clientes_con_actividad === 0) {
        console.log('ℹ️ Sin actividad en el periodo. No se envía email.');
        return;
      }

      const pdfService = new PdfResumenCrmService();
      const { pdfBytes, filename } =
        await pdfService.generarReporteCrm(reporteData);

      await EmailService.enviarResumenSemanal({
        pdfBytes,
        filename,
        reporteData,
      });

      console.log(`✅ Resumen CRM enviado — ${reporteData.periodo}`);
    } catch (error) {
      console.error('❌ Error en cron Resumen CRM:', error);
    }
  });
};

export default iniciarResumenCrmCron;
