import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const VERDE = rgb(0.106, 0.349, 0.192);
const TEXTO = rgb(0.16, 0.18, 0.16);
const MUTED = rgb(0.42, 0.45, 0.42);

class PdfInformeCrmService {
  async generar(data) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const pageSize = [842, 595];
    const margin = 42;
    let page = pdf.addPage(pageSize);
    let y = 548;
    const draw = (text, x = margin, size = 10, useBold = false, color = TEXTO) => {
      page.drawText(String(text), { x, y, size, font: useBold ? bold : font, color, maxWidth: 750 });
    };
    const line = () => page.drawLine({ start: { x: margin, y: y - 8 }, end: { x: 800, y: y - 8 }, thickness: 1, color: rgb(0.85, 0.88, 0.85) });
    draw('INFORME CONFIGURABLE DEL CRM', margin, 20, true, VERDE); y -= 27;
    draw(`Período: ${data.filtros.fechaInicio} al ${data.filtros.fechaFin}`, margin, 11, true); y -= 19;
    draw(`Cliente: ${data.filtros.cliente || 'Todos'}`); y -= 15;
    draw(`Ingeniero: ${data.filtros.ingeniero || 'Todos'}`); y -= 15;
    draw(`Servicios: ${data.filtros.servicios.map((s) => ({ jornada: 'Jornadas', muestra_agua: 'Muestras de agua', calibracion: 'Calibraciones' })[s]).join(', ')}`); y -= 15;
    draw(`Tipos de cliente: ${data.filtros.tiposCliente?.join(', ') || 'Todos'}`); y -= 18;
    line(); y -= 18;
    draw('INDICADORES', margin, 12, true, VERDE); y -= 20;
    draw(`Clientes con actividad: ${data.indicadores.clientesActivos}`); y -= 16;
    draw(`Ingenieros con actividad: ${data.indicadores.ingenierosActivos}`); y -= 16;
    draw(`Total de actividades: ${data.indicadores.totalActividades}`); y -= 20;
    for (const [key, label] of [['jornada', 'Jornadas'], ['muestra_agua', 'Muestras de agua'], ['calibracion', 'Calibraciones']]) {
      if (Object.hasOwn(data.indicadores.porServicio, key)) { draw(`${label}: ${data.indicadores.porServicio[key]}`); y -= 15; }
    }
    y -= 8; line(); y -= 20;
    draw('DETALLE DE ACTIVIDADES', margin, 12, true, VERDE); y -= 22;
    if (data.sinResultados) {
      draw('No se encontraron actividades para los filtros seleccionados.', margin, 11, false, MUTED);
    } else {
      const columns = [margin, 210, 390, 535, 670];
      const headers = ['CLIENTE', 'INGENIERO', 'SERVICIO', 'FECHA', 'ID'];
      const newPage = () => { page = pdf.addPage(pageSize); y = 548; draw('INFORME CONFIGURABLE DEL CRM · CONTINUACIÓN', margin, 13, true, VERDE); y -= 26; };
      const drawRow = (values, header = false) => {
        if (y < 42) newPage();
        values.forEach((value, i) => page.drawText(String(value), { x: columns[i] + 3, y, size: header ? 8 : 8.5, font: header ? bold : font, color: header ? VERDE : TEXTO, maxWidth: i === 0 ? 175 : 135 }));
        y -= header ? 18 : 15;
      };
      drawRow(headers, true);
      for (const row of data.detalle) {
        const nombre = ({ jornada: 'Jornada', muestra_agua: 'Muestra de agua', calibracion: 'Calibración' })[row.servicio];
        drawRow([row.cliente, row.ingeniero, nombre, row.fecha, row.id]);
      }
    }
    const bytes = await pdf.save();
    return { pdfBytes: bytes, filename: `informe-crm-${data.filtros.fechaInicio}-${data.filtros.fechaFin}.pdf` };
  }
}

export default PdfInformeCrmService;
