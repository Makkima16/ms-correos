const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { spawn } = require('child_process');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Utils
const sendEmailWithCertificate = async (email, name, cedula, certificatePath, res) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'BPM VALENCIA Certificacion',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
          <h1 style="color: #0073e6;">BPM VALENCIA</h1>
        </div>
        <div style="padding: 20px;">
          <p>Estimado/a ${name},</p>
          <p>Se realiza envío de su certificado de manipulador de alimentos</p>
          <p>Gracias por elegirnos. Si tienes alguna consulta, no dudes en contactarnos.</p>
          <p style="font-size: 0.9em; color: #555;">Atentamente,<br>Equipo de BPM VALENCIA</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 0.8em; color: #888;">
          <p>Este correo fue enviado por BPM VALENCIA. Por favor, no respondas a este correo.</p>
        </div>
      </div>
    `,
    attachments: [{
      filename: `${cedula}_certificado.pdf`,
      path: certificatePath,
    }],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Correo enviado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Error al enviar el correo' });
  }
};

// Ruta genérica para certificados
const createCertificateRoute = (scriptName) => {
  return async (req, res) => {
    const { email, name, cedula } = req.body;
    const outputDir = path.join(__dirname, '..', 'certificates');
    const certificatePath = path.join(outputDir, `${cedula}_certificado.pdf`);

    const pythonProcess = spawn('python3', [
      path.join(__dirname, '..', scriptName),
      name,
      certificatePath,
      cedula,
    ]);

    pythonProcess.stdout.on('data', (data) => console.log(`stdout: ${data}`));
    pythonProcess.stderr.on('data', (data) => console.error(`stderr: ${data}`));

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        return res.status(500).send({ error: 'Error al generar el certificado' });
      }
      await sendEmailWithCertificate(email, name, cedula, certificatePath, res);
    });
  };
};

// Rutas para cada tipo de certificado
router.post('/send-email', createCertificateRoute('generate_certificate.py'));
router.post('/send-email-empaquetadores', createCertificateRoute('empaquetadores.py'));
router.post('/send-email-carnicos', createCertificateRoute('carnicos.py'));

// Manual (con archivo)
router.post('/send-manual-email', upload.single('file'), async (req, res) => {
  const { email, body } = req.body;
  const file = req.file;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'BPM VALENCIA Certificacion',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
          <h1 style="color: #0073e6;">BPM VALENCIA</h1>
        </div>
        <div style="padding: 20px;">
          <p>Estimado/a cliente,</p>
          <p>${body}</p>
          <p>Gracias por elegirnos. Si tienes alguna consulta, no dudes en contactarnos.</p>
          <p style="font-size: 0.9em; color: #555;">Atentamente,<br>Equipo de BPM VALENCIA</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 0.8em; color: #888;">
          <p>Este correo fue enviado por BPM VALENCIA. Por favor, no respondas a este correo.</p>
        </div>
      </div>
    `,
    attachments: file ? [{ filename: file.originalname, path: file.path }] : [],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Correo enviado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Hubo un error al enviar el correo' });
  }
});

module.exports = router;
