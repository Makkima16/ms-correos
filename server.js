const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Importar las rutas de certificados
const certificadosRoutes = require('./servicios/certificados');
app.use('/api/certificados', certificadosRoutes);


const { enviarRecordatorio } = require('./servicios/recordatorios');

app.post('/enviar-recordatorio', async (req, res) => {
  const { email, subject, content } = req.body;

  const resultado = await enviarRecordatorio(email, subject, content);
  if (resultado.success) {
    res.status(200).send({ message: resultado.message });
  } else {
    res.status(500).send({ error: resultado.error });
  }
});


// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en puerto ${port}`);
});
