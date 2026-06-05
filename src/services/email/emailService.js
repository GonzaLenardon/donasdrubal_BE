import nodemailer from 'nodemailer';

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

  async enviarResumenSemanal({ pdfBytes, filename, reporteData }) {
    // ✅ VERIFICA CONEXIÓN SMTP
    await this.transporter.verify();

    console.log('✅ SMTP conectado correctamente');

    // ✅ ENVIO EMAIL
    await this.transporter.sendMail({
      from: `"Don Asdrúbal" <${process.env.SMTP_USER}>`,

      /*  to: process.env.RESUMEN_SEMANAL_EMAILS, */
      to: process.env.RESUMEN_SEMANAL_EMAILS.split(','),

      subject: `Resumen semanal ${reporteData.periodo}`,

      html: `
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
}

export default new EmailService();
