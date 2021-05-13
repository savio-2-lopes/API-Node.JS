const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.use(express.json());
require('./app/controllers/index')(app)

app.listen(3333, console.log(`Servidor iniciado.`));