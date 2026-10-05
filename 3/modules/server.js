// Servidor Express: entrega la página y sus archivos
const express = require('express');
const path = require('path');

const app = express();
const PUERTO = 3000;
const raiz = path.join(__dirname, '..');

app.use('/styles', express.static(path.join(raiz, 'styles')));
app.use('/data', express.static(path.join(raiz, 'data')));

app.get('/', (req, res) => {
  res.sendFile(path.join(raiz, 'pages', 'index.html'));
});

app.get('/modules/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'script.js'));
});

app.listen(PUERTO, () => {
  console.log('Servidor listo en http://localhost:' + PUERTO);
});
