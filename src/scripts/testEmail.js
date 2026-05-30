import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const main = async () => {
  try {
    console.log('🚀 Iniciando prueba SMTP...');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,

      port: Number(process.env.SMTP_PORT),

      secure: true,

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },

      logger: true,
      debug: true,
    });

    console.log('🔍 Verificando conexión SMTP...');

    await transporter.verify();

    console.log('✅ SMTP conectado correctamente');

    console.log('📧 Enviando email...');

    const info = await transporter.sendMail({
      from: `"Don Asdrúbal Test" <${process.env.SMTP_USER}>`,

      to: process.env.RESUMEN_SEMANAL_EMAILS.split(','),

      subject: 'Prueba SMTP desde producción',

      text: `
Hola.

Este es un correo de prueba enviado desde el servidor productivo.

Si recibiste este email:
- SMTP funciona
- Nodemailer funciona
- El servidor puede enviar correos

Fecha:
${new Date().toISOString()}
      `,
    });

    console.log('✅ EMAIL ENVIADO');
    console.log(info);
  } catch (error) {
    console.error('❌ ERROR SMTP');
    console.error(error);
  }
};

main();
