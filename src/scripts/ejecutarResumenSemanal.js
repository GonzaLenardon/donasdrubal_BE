import dotenv from 'dotenv';

dotenv.config();

import reporteSemanalService from '../services/reportes/reporteSemanalService.js';

import PdfResumenService from '../services/pdf/pdfResumenService.js';

import EmailService from '../services/email/emailService.js';

const main = async () => {
  try {
    console.log('🚀 INICIANDO RESUMEN SEMANAL');

    // 1. obtener datos
    console.log('📊 Generando reporte...');

    const reporteData = await reporteSemanalService.generarReporte();

    console.log('✅ Reporte generado');

    // 2. generar PDF
    console.log('📄 Generando PDF...');

    const { pdfBytes, filename } =
      await PdfResumenService.generarReporteSemanal(reporteData);

    console.log('✅ PDF generado');

    // 3. enviar email
    console.log('📧 Enviando email...');

    await EmailService.enviarResumenSemanal({
      pdfBytes,
      filename,
      reporteData,
    });

    console.log('✅ EMAIL ENVIADO');
  } catch (error) {
    console.error('❌ ERROR GENERAL');
    console.error(error);
  }
};

main();
