const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// Configuración de multer para almacenar archivos temporalmente
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Nombre único para el archivo
  }
});

const upload = multer({ storage: storage });

// Ruta para enviar el correo con el certificado
app.post('/send-email', async (req, res) => {
  const { email, name, cedula } = req.body; // Datos enviados en la solicitud
  const outputDir = path.join(__dirname, 'certificates');
  const certificatePath = path.join(outputDir, `${cedula}_certificado.pdf`);

  // Generar el certificado utilizando Python
  const pythonProcess = spawn('python3', [
    path.join(__dirname, 'generate_certificate.py'),
    name,
    certificatePath,
    cedula // Agregamos la cédula aquí
]);
  

  // Captura la salida estándar (stdout) y la salida de error (stderr) del proceso Python
  pythonProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on('close', async (code) => {
  if (code !== 0) {
    return res.status(500).send({ error: 'Error al generar el certificado' });
  }
    // Configuración del transportador SMTP
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
      to: email, // Correo del destinatario
      subject: 'BPM VALENCIA Certificacion', // Asunto del correo
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
            <h1 style="color: #0073e6;">BPM VALENCIA</h1>
          </div>
          <div style="padding: 20px;">
            <p>Estimado/a ${name},</p>
            <p>Se realiza Envio de SU certificado de manipulador de alimentos</p>
            <p>Gracias por elegirnos. Si tienes alguna consulta, no dudes en contactarnos.</p>
            <p style="font-size: 0.9em; color: #555;">Atentamente,<br>Equipo de BPM VALENCIA</p>
          </div>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 0.8em; color: #888;">
            <p>Este correo fue enviado por BPM VALENCIA. Por favor, no respondas a este correo.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `${cedula}_certificado.pdf`,
          path: certificatePath,
        },
      ],
    };
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send({ message: 'Correo enviado con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Error al enviar el correo' });
    }
  });
});


app.post('/send-manual-email', upload.single('file'), async (req, res) => {
  const { email, text } = req.body; // Extraemos 'email' y 'text' del cuerpo de la solicitud
  const file = req.file;

  // Configuración del transportador SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true para puerto 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  // Opciones del correo
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email, // Correo del destinatario
    subject: 'BPM VALENCIA Certificacion', // Asunto del correo
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center;">
          <h1 style="color: #0073e6;">BPM VALENCIA</h1>
        </div>
        <div style="padding: 20px;">
          <p>Estimado/a cliente,</p>
          <p>${req.body.body}</p>
          <p>Gracias por elegirnos. Si tienes alguna consulta, no dudes en contactarnos.</p>
          <p style="font-size: 0.9em; color: #555;">Atentamente,<br>Equipo de BPM VALENCIA</p>
        </div>
        <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 0.8em; color: #888;">
          <p>Este correo fue enviado por BPM VALENCIA. Por favor, no respondas a este correo.</p>
        </div>
      </div>
    `,
    attachments: file ? [
      {
        filename: file.originalname,
        path: file.path // Ruta del archivo
      }
    ] : [] // Si no hay archivo, no incluimos el adjunto
  };
  

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Correo enviado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Hubo un error al enviar el correo' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en puerto ${port}`);
});
