const express = require('express');

const app = express();

app.use(express.json());
require('./app/controllers/index')(app)

app.listen(3333, console.log("Listening in port 3333"));