import cron from 'node-cron';

import ReporteSemanalService from '../services/reportes/reporteSemanalService.js';
import PdfResumenService from '../services/pdf/pdfResumenService.js';
import EmailService from '../services/email/emailService.js';

const iniciarResumenSemanalCron = () => {
  // viernes 20:00
  /* cron.schedule('0 20 * * 5', async () => { */

  /*   
30 14 * * 3
│  │  │ │ │
│  │  │ │ └── miércoles
│  │  │ └──── todos los meses
│  │  └────── todos los días
│  └───────── 14 hs
└──────────── minuto 30

 */

  /* cada un minuto */
  cron.schedule('30 * * * *', async () => {
    try {
      console.log('⏰ Generando resumen semanal...');

      // 1. obtener datos
      const reporteService = new ReporteSemanalService();

      const reporteData = await reporteService.generarReporte();

      // 2. generar pdf
      const pdfService = new PdfResumenService();

      const { pdfBytes, filename } =
        await pdfService.generarReporteSemanal(reporteData);

      // 3. enviar email
      await EmailService.enviarResumenSemanal({
        pdfBytes,
        filename,
        reporteData,
      });

      console.log('✅ Resumen semanal enviado');
    } catch (error) {
      console.error('❌ Error cron resumen semanal:', error);
    }
  });
};

export default iniciarResumenSemanalCron;
