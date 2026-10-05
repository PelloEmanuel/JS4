// Servidor Express: entrega la página y además expone la API /api/alumnos
const express = require('express');
const path = require('path');

const app = express();
const PUERTO = 3000;
const raiz = path.join(__dirname, '..');

app.use(express.json());
app.use('/styles', express.static(path.join(raiz, 'styles')));
app.use('/data', express.static(path.join(raiz, 'data')));

// ---------- Datos de la API (viven en memoria) ----------
let alumnos = [
  { id: 1, nombre: 'Lucía Fernández', email: 'lucia@correo.com', curso: 'Programación I' },
  { id: 2, nombre: 'Martín Gómez', email: 'martin@correo.com', curso: 'Base de Datos' },
  { id: 3, nombre: 'Sofía Ramírez', email: 'sofia@correo.com', curso: 'Programación I' },
  { id: 4, nombre: 'Tomás Herrera', email: 'tomas@correo.com', curso: 'Redes' },
  { id: 5, nombre: 'Valentina Ruiz', email: 'valentina@correo.com', curso: 'Diseño Web' }
];
let siguienteId = 6;

// Devuelve un texto de error, o null si los datos son correctos
function validar(cuerpo) {
  const { nombre, email, curso } = cuerpo;
  if (typeof nombre !== 'string' || nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'El email no es válido.';
  if (typeof curso !== 'string' || curso.trim() === '') return 'El curso es obligatorio.';
  return null;
}

// ---------- Rutas de la API ----------
app.get('/api/alumnos', (req, res) => {
  res.json(alumnos);
});

app.get('/api/alumnos/:id', (req, res) => {
  const alumno = alumnos.find((a) => a.id === Number(req.params.id));
  if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });
  res.json(alumno);
});

app.post('/api/alumnos', (req, res) => {
  const error = validar(req.body);
  if (error) return res.status(400).json({ error: error });
  const alumno = {
    id: siguienteId++,
    nombre: req.body.nombre.trim(),
    email: req.body.email.trim(),
    curso: req.body.curso.trim()
  };
  alumnos.push(alumno);
  res.status(201).json(alumno);
});

app.put('/api/alumnos/:id', (req, res) => {
  const alumno = alumnos.find((a) => a.id === Number(req.params.id));
  if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });
  const error = validar(req.body);
  if (error) return res.status(400).json({ error: error });
  alumno.nombre = req.body.nombre.trim();
  alumno.email = req.body.email.trim();
  alumno.curso = req.body.curso.trim();
  res.json(alumno);
});

// Borra todos los alumnos de una vez
app.delete('/api/alumnos', (req, res) => {
  alumnos = [];
  res.json({ ok: true });
});

app.delete('/api/alumnos/:id', (req, res) => {
  const existe = alumnos.some((a) => a.id === Number(req.params.id));
  if (!existe) return res.status(404).json({ error: 'Alumno no encontrado.' });
  alumnos = alumnos.filter((a) => a.id !== Number(req.params.id));
  res.json({ ok: true });
});

// ---------- Página ----------
app.get('/', (req, res) => {
  res.sendFile(path.join(raiz, 'pages', 'index.html'));
});

app.get('/modules/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'script.js'));
});

app.listen(PUERTO, () => {
  console.log('Servidor listo en http://localhost:' + PUERTO);
});
