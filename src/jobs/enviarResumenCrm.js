import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek.js';

import ResumenCrmService from '../services/reportes/resumenCrmService.js';
import PdfResumenCrmService from '../services/pdf/pdfResumenCrmService.js';
import EmailService from '../services/email/emailService.js';

dayjs.extend(isoWeek);

/* NUEVA FUNCION DE PDF */

export const ejecutarResumenCrm = async (req, res) => {
  try {
    console.log('====================================');
    console.log('⏰ Iniciando resumen CRM via HTTP');
    console.log(new Date().toISOString());
    console.log('====================================');

    console.log('🔍 CHECKPOINT 1 — req.query:', req.query);

    const { semana } = req.query;
    const esSabado = dayjs().isoWeekday() === 6;
    const semanaAnterior = !semana && esSabado;

    console.log(
      '🔍 CHECKPOINT 2 — semana:',
      semana,
      '| esSabado:',
      esSabado,
      '| semanaAnterior:',
      semanaAnterior,
    );

    const reporteService = new ResumenCrmService();

    console.log('🔍 CHECKPOINT 3 — llamando a generarResumenV2...');

    const reporteData = await reporteService.generarResumenV2({
      semana,
      semanaAnterior,
    });

    console.log('🔍 CHECKPOINT 4 — periodo calculado:', reporteData.periodo);
    console.log(
      '🔍 CHECKPOINT 5 — clientes_activos.actual:',
      reporteData.indicadores.clientes_activos.actual,
    );

    // ✅ Corregido: usar indicadores de V2
    if (reporteData.indicadores.clientes_activos.actual === 0) {
      console.log('ℹ️ Sin actividad en el rango. No se envía email.');
      return res.status(200).json({
        ok: true,
        mensaje: 'Sin actividad en el periodo. No se envió email.',
        periodo: reporteData.periodo,
      });
    }

    const pdfService = new PdfResumenCrmService();
    const { pdfBytes, filename } =
      await pdfService.generarReporteCrm(reporteData);

    await EmailService.enviarResumenSemanal({
      pdfBytes,
      filename,
      reporteData,
      subject: `Resumen CRM ${reporteData.periodo}`,
      html: `
        <h2>Resumen CRM NUEVO</h2>
        <p>Se adjunta el reporte CRM con los datos de actividad del periodo.</p>
      `,
    });

    console.log(`✅ Email Resumen CRM enviado — ${reporteData.periodo}`);

    return res.status(200).json({
      ok: true,
      mensaje: 'Resumen CRM enviado correctamente',
      periodo: reporteData.periodo,
      // ✅ Corregido: campo correcto de V2
      clientes_con_actividad: reporteData.indicadores.clientes_activos.actual,
    });
  } catch (error) {
    console.error('❌ Error ejecutando resumen CRM:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error ejecutando resumen CRM',
      details: error.message,
    });
  }
};

/* 
 ESTO SOLO ERA DE PRUBAS PARA GUARDAR A DISCO

async function generarPdf(params = {}) {
  const reporteService = new ResumenCrmService();

  const reporteData = await reporteService.generarResumenV2(params);
  const pdfService = new PdfResumenCrmService();
  const { pdfBytes, filename } =
    await pdfService.generarReporteCrm(reporteData);

  const reportsDir = path.join(process.cwd(), 'public', 'reports');
  await fs.mkdir(reportsDir, { recursive: true });

  const safeFilename = path.basename(filename);
  const outputPath = path.join(reportsDir, safeFilename);
  await fs.writeFile(outputPath, pdfBytes);

  return { outputPath, filename, reporteData };
} */

/* function parseArgs(argv) {
  const params = {};

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--semana':
        params.semana = argv[++index];
        break;
      case '--fechaInicio':
        params.fechaInicio = argv[++index];
        break;
      case '--fechaFin':
        params.fechaFin = argv[++index];
        break;
      case '--help':
        params.help = true;
        break;
      default:
        console.warn(`⚠️ Argumento no reconocido: ${arg}`);
    }
  }

  return params;
}

async function main() {
  const params = parseArgs(process.argv);

  if (params.help) {
    console.log(
      'Uso: node src/jobs/enviarResumenCrm.js [--semana YYYY-MM-DD] [--fechaInicio YYYY-MM-DD --fechaFin YYYY-MM-DD]',
    );
    console.log(
      'Ejemplo: node src/jobs/enviarResumenCrm.js --semana 2026-05-19',
    );
    return;
  }

  const { outputPath, filename, reporteData } = await generarPdf(params);
  console.log(`✅ PDF generado: ${outputPath}`);
  console.log(`Periodo: ${reporteData.periodo}`);
  console.log(
    `Clientes con actividad: ${reporteData.indicadores.clientes_activos.actual}`,
  );
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('❌ Error al ejecutar desde CLI:', error);
    process.exit(1);
  });
}
 */
