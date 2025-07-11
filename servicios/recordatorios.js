const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Enviar recordatorio (alarma) por correo electrónico
 * @param {string} email - Dirección de correo del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} content - Contenido HTML del mensaje
 * @returns {Promise<Object>} - Resultado del envío
 */
const enviarRecordatorio = async (email, subject, content, date) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
          <h2 style="color: #0073e6;">BPM VALENCIA</h2>
        </div>
        <div style="padding: 20px;">
          ${content}
        </div>
        <p>Recuerda que la fecha programada de la reunion es para el</p>
        <h2 style="color: #0073e6;">${date}</h2>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 0.8em; color: #888;">
          <p>Este mensaje fue enviado automáticamente. No respondas a este correo.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Recordatorio enviado con éxito' };
  } catch (error) {
    console.error('Error al enviar recordatorio:', error);
    return { success: false, error: 'Error al enviar el recordatorio' };
  }
};

module.exports = { enviarRecordatorio };
