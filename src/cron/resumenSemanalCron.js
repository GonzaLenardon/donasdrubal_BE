// cron/resumenSemanalCron.js

import cron from 'node-cron';

import ReporteSemanalService from '../services/reportes/reporteSemanalService.js';
import PdfResumenService from '../services/pdf/pdfResumenService.js';
import EmailService from '../services/email/emailService.js';

const iniciarResumenSemanalCron = () => {
  // Viernes 20:00 hs — Argentina (UTC-3)
  // Expresión UTC: viernes 23:00 UTC = sábado 00:00 AR → ajustado a 20hs AR = 23:00 UTC
  // Si node-cron corre en servidor con TZ=America/Argentina/Buenos_Aires usar '0 20 * * 5'

  /*   
30 14 * * 3
│  │  │ │ │
│  │  │ │ └── miércoles
│  │  │ └──── todos los meses
│  │  └────── todos los días
│  └───────── 14 hs
└──────────── minuto 30

 */

  cron.schedule('* * * * *', async () => {
    try {
      console.log('⏰ Iniciando generación de resumen semanal automático...');

      // 1. Datos del reporte — sin params = semana actual (lunes–viernes)
      const reporteService = new ReporteSemanalService();
      const reporteData = await reporteService.generarReporte();

      if (reporteData.total_clientes === 0) {
        console.log('ℹ️ Sin actividad en la semana. No se envía email.');
        return;
      }

      // 2. Generar PDF
      const pdfService = new PdfResumenService();
      const { pdfBytes, filename } =
        await pdfService.generarReporteSemanal(reporteData);

      // 3. Enviar email
      await EmailService.enviarResumenSemanal({
        pdfBytes,
        filename,
        reporteData,
      });

      console.log(
        `✅ Resumen semanal enviado — ${reporteData.periodo} — ${reporteData.total_clientes} clientes`,
      );
    } catch (error) {
      console.error('❌ Error en cron resumen semanal:', error);
    }
  });
};

export default iniciarResumenSemanalCron;
