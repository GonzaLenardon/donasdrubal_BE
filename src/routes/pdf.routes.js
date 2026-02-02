import express from 'express';
import PDFService  from '../services/pdfService.js';

const pdfRouter = express.Router();

/**
 * Endpoint interno para generar PDF vía PHP
 * NO lleva autenticación
 */
pdfRouter.post('/pdf_services/generar_calibracion', async (req, res) => {
  try {
    const resultado = await PDFService.generarPDFviaPHP(req.body);
    res.json(resultado);
  } catch (error) {
    console.error('Error PDF:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error generando PDF',
      error: error.message
    });
  }
});

export { pdfRouter };
