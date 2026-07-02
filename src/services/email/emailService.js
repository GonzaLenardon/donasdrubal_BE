import nodemailer from 'nodemailer';
import Users from '../../models/users.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(date);
};

const buildActionUrl = (urlAccion) => {
  if (!urlAccion) return null;
  if (/^https?:\/\//i.test(urlAccion)) return urlAccion;
  if (!process.env.URL) return urlAccion;

  return `${process.env.URL.replace(/\/$/, '')}/${String(urlAccion).replace(
    /^\//,
    '',
  )}`;
};

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,

      port: Number(process.env.SMTP_PORT),

      secure: true,

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async enviarResumenSemanal({
    pdfBytes,
    filename,
    reporteData,
    subject,
    html,
  }) {
    // ✅ VERIFICA CONEXIÓN SMTP
    await this.transporter.verify();

    console.log('✅ SMTP conectado correctamente');

    await this.transporter.sendMail({
      from: `"Don Asdrúbal" <${process.env.SMTP_USER}>`,
      to: process.env.RESUMEN_SEMANAL_EMAILS.split(','),
      subject: subject || `Resumen semanal ${reporteData.periodo}`,
      html:
        html ||
        `
          <h2>Resumen semanal</h2>

          <p>
            Se adjunta el resumen semanal automático.
          </p>
        `,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBytes),
        },
      ],
    });

    console.log('📧 Email enviado correctamente');
  }

  async enviarNotificacionAlerta(alerta) {
    const usuarioDestino = await Users.findByPk(alerta.usuario_to_id, {
      attributes: ['id', 'nombre', 'email'],
    });

    if (!usuarioDestino?.email) {
      throw new Error(
        `No se encontro email para el usuario ${alerta.usuario_to_id}`,
      );
    }

    const fechaAlerta = formatDate(alerta.fecha_alerta);
    const fechaEvento = formatDate(alerta.fecha_evento);
    const fechaVencimiento = formatDate(alerta.fecha_vencimiento);
    const actionUrl = buildActionUrl(alerta.url_accion);
    const fechas = [
      fechaAlerta ? `<li><strong>Fecha de alerta:</strong> ${fechaAlerta}</li>` : '',
      fechaEvento ? `<li><strong>Fecha del evento:</strong> ${fechaEvento}</li>` : '',
      fechaVencimiento
        ? `<li><strong>Fecha de vencimiento:</strong> ${fechaVencimiento}</li>`
        : '',
    ].join('');

    await this.transporter.verify();

    const info = await this.transporter.sendMail({
      from: `"Don Asdrubal" <${process.env.SMTP_USER}>`,
      to: usuarioDestino.email,
      subject: alerta.titulo,
      html: `
        <h2>${escapeHtml(alerta.titulo)}</h2>
        <p>Hola ${escapeHtml(usuarioDestino.nombre)},</p>
        <p>${escapeHtml(alerta.mensaje)}</p>
        ${fechas ? `<ul>${fechas}</ul>` : ''}
        ${
          alerta.requiere_accion && alerta.accion_texto
            ? `<p>${
                actionUrl
                  ? `<a href="${escapeHtml(actionUrl)}">${escapeHtml(
                      alerta.accion_texto,
                    )}</a>`
                  : `<strong>${escapeHtml(alerta.accion_texto)}</strong>`
              }</p>`
            : ''
        }
      `,
      text: [
        alerta.titulo,
        '',
        `Hola ${usuarioDestino.nombre},`,
        '',
        alerta.mensaje,
        fechaAlerta ? `Fecha de alerta: ${fechaAlerta}` : '',
        fechaEvento ? `Fecha del evento: ${fechaEvento}` : '',
        fechaVencimiento ? `Fecha de vencimiento: ${fechaVencimiento}` : '',
        alerta.requiere_accion && alerta.accion_texto ? alerta.accion_texto : '',
        actionUrl ? actionUrl : '',
      ]
        .filter(Boolean)
        .join('\n'),
    });

    console.log(`Email de alerta enviado a ${usuarioDestino.email}`);

    return info;
  }
}

export default new EmailService();
