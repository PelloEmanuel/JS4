const $ = (id) => document.getElementById(id);
const toast = $('toast');
let temporizador = null;

// Mensaje emergente propio (tipo: 'ok' o 'error')
function avisar(texto, tipo) {
  toast.textContent = texto;
  toast.className = 'toast visible ' + (tipo || 'ok');
  clearTimeout(temporizador);
  temporizador = setTimeout(() => toast.classList.remove('visible'), 3000);
}

function emailValido(texto) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
}

const URL_API = 'https://jsonplaceholder.typicode.com/users';

// POST con fetch: se indica el método, el tipo de contenido y el cuerpo en texto JSON
async function enviarConFetch(datos) {
  const respuesta = await fetch(URL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!respuesta.ok) throw new Error('Error ' + respuesta.status);
  return { estado: respuesta.status, datos: await respuesta.json() };
}

// POST con axios: más corto, recibe el objeto y lo convierte solo
async function enviarConAxios(datos) {
  const respuesta = await axios.post(URL_API, datos);
  return { estado: respuesta.status, datos: respuesta.data };
}

function mostrarRespuesta(resultado, metodo) {
  $('idRespuesta').textContent = resultado.datos.id;
  $('datoNombre').textContent = resultado.datos.nombre;
  $('datoEmail').textContent = resultado.datos.email;
  $('datoMetodo').textContent = metodo === 'axios' ? 'axios.post()' : 'fetch (POST)';
  $('datoEstado').textContent = resultado.estado;
  $('sinRespuesta').classList.add('oculto');
  $('respuesta').classList.remove('oculto');
}

$('formulario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = { nombre: $('inputNombre').value.trim(), email: $('inputEmail').value.trim() };
  const metodo = $('selectMetodo').value;

  if (datos.nombre.length < 2) { $('errorForm').textContent = 'El nombre debe tener al menos 2 caracteres.'; return; }
  if (!emailValido(datos.email)) { $('errorForm').textContent = 'Escribí un email válido.'; return; }
  $('errorForm').textContent = '';

  $('btnEnviar').disabled = true;
  $('btnEnviar').textContent = 'Enviando...';
  try {
    const resultado = metodo === 'axios' ? await enviarConAxios(datos) : await enviarConFetch(datos);
    mostrarRespuesta(resultado, metodo);
    avisar('Datos enviados correctamente.');
    $('formulario').reset();
  } catch (error) {
    avisar('No se pudo enviar: ' + error.message, 'error');
  }
  $('btnEnviar').disabled = false;
  $('btnEnviar').textContent = 'Enviar';
});

// ---- Modo claro / oscuro ----
const btnTema = $('btnTema');

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-tema', tema);
  btnTema.textContent = tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro';
}

aplicarTema(localStorage.getItem('tema') || 'claro');

btnTema.addEventListener('click', () => {
  const actual = document.documentElement.getAttribute('data-tema');
  const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro';
  localStorage.setItem('tema', nuevo);
  aplicarTema(nuevo);
});
