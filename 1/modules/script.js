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

// ---------- Ventana de confirmación propia (reemplaza a confirm) ----------
const modal = $('modal');
let accionPendiente = null;

function pedirConfirmacion(texto, accion) {
  $('modalTexto').textContent = texto;
  accionPendiente = accion;
  modal.classList.remove('oculto');
  $('btnCancelarBorrado').focus();
}

function cerrarModal() {
  modal.classList.add('oculto');
  accionPendiente = null;
}

$('btnConfirmarBorrado').addEventListener('click', () => {
  if (accionPendiente) accionPendiente();
  cerrarModal();
});
$('btnCancelarBorrado').addEventListener('click', cerrarModal);
modal.addEventListener('click', (e) => { if (e.target === modal) cerrarModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

// ---------- Tarjetas del listado ----------
// alEditar y alBorrar reciben el elemento de la tarjeta que se tocó
function dibujarTarjetas(items, mensajeVacio, alEditar, alBorrar) {
  const caja = $('lista');
  caja.innerHTML = '';

  if (items.length === 0) {
    const vacio = document.createElement('p');
    vacio.className = 'vacio';
    vacio.textContent = mensajeVacio;
    caja.appendChild(vacio);
    return;
  }

  items.forEach((item) => {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'usuario';

    const nombre = document.createElement('h3');
    nombre.textContent = item.nombre;
    const email = document.createElement('p');
    email.textContent = item.email;
    tarjeta.append(nombre, email);

    if (item.curso) {
      const curso = document.createElement('span');
      curso.className = 'etiqueta-curso';
      curso.textContent = item.curso;
      tarjeta.appendChild(curso);
    }

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    const btnEditar = document.createElement('button');
    btnEditar.className = 'secundario';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', () => alEditar(item));
    const btnBorrar = document.createElement('button');
    btnBorrar.className = 'peligro';
    btnBorrar.textContent = 'Borrar';
    btnBorrar.addEventListener('click', () => alBorrar(item));
    acciones.append(btnEditar, btnBorrar);

    tarjeta.appendChild(acciones);
    caja.appendChild(tarjeta);
  });
}

function pedirBorrado(item) {
  pedirConfirmacion('¿Eliminar a «' + item.nombre + '»? Esta acción no se puede deshacer.', () => borrar(item.id));
}

// ---------- Formulario de agregar / editar ----------
function mostrarErrorForm(texto) {
  $('errorForm').textContent = texto;
}

function terminarEdicion() {
  editandoId = null;
  $('formulario').reset();
  mostrarErrorForm('');
  $('tituloFormulario').textContent = TITULO_AGREGAR;
  $('btnGuardar').textContent = 'Agregar';
  $('btnCancelarEdicion').classList.add('oculto');
}

function pasarAModoEdicion(item) {
  editandoId = item.id;
  mostrarErrorForm('');
  $('tituloFormulario').textContent = TITULO_EDITAR;
  $('btnGuardar').textContent = 'Guardar cambios';
  $('btnCancelarEdicion').classList.remove('oculto');
  $('inputNombre').focus();
}

$('formulario').addEventListener('submit', (e) => {
  e.preventDefault();
  guardar();
});
$('btnCancelarEdicion').addEventListener('click', terminarEdicion);

// ---------- Eliminar todos (también pide confirmación) ----------
function pedirBorradoTotal() {
  pedirConfirmacion('¿Eliminar todos los ' + NOMBRE_PLURAL + ' (' + cantidadTotal() + ')? Esta acción no se puede deshacer.', borrarTodos);
}
$('btnBorrarTodos').addEventListener('click', pedirBorradoTotal);

const URL_API = 'https://jsonplaceholder.typicode.com/users';
const TITULO_AGREGAR = 'Agregar usuario';
const TITULO_EDITAR = 'Editar usuario';
const NOMBRE_PLURAL = 'usuarios';

let usuarios = [];
let metodoUsado = '';
let editandoId = null;

function cantidadTotal() {
  return usuarios.length;
}

function dibujarLista() {
  $('btnBorrarTodos').disabled = usuarios.length === 0;
  $('infoCarga').textContent = usuarios.length + ' usuarios' +
    (metodoUsado ? ' (datos cargados con ' + metodoUsado + ')' : '');
  dibujarTarjetas(usuarios,
    'Todavía no hay usuarios. Cargalos con fetch o axios, o agregá uno a mano.',
    editar, pedirBorrado);
}

// Guarda los datos recibidos, sin importar con qué técnica se pidieron
function recibirUsuarios(datos, metodo) {
  usuarios = datos.map((u) => ({ id: u.id, nombre: u.name, email: u.email }));
  metodoUsado = metodo;
  terminarEdicion();
  dibujarLista();
  avisar('Datos cargados con ' + metodo + '.');
}

// fetch: hay que revisar "ok" y convertir la respuesta con .json()
async function cargarConFetch() {
  $('infoCarga').textContent = 'Cargando con fetch...';
  try {
    const respuesta = await fetch(URL_API);
    if (!respuesta.ok) throw new Error('Error ' + respuesta.status);
    const datos = await respuesta.json();
    recibirUsuarios(datos, 'fetch');
  } catch (error) {
    dibujarLista();
    avisar('Falló fetch: ' + error.message, 'error');
  }
}

// axios: los datos ya vienen listos en respuesta.data
async function cargarConAxios() {
  $('infoCarga').textContent = 'Cargando con axios...';
  try {
    const respuesta = await axios.get(URL_API);
    recibirUsuarios(respuesta.data, 'axios');
  } catch (error) {
    dibujarLista();
    avisar('Falló axios: ' + error.message, 'error');
  }
}

// ---- Agregar, editar y borrar ----
function guardar() {
  const nombre = $('inputNombre').value.trim();
  const email = $('inputEmail').value.trim();
  if (nombre.length < 2) { mostrarErrorForm('El nombre debe tener al menos 2 caracteres.'); return; }
  if (!emailValido(email)) { mostrarErrorForm('Escribí un email válido.'); return; }

  if (editandoId === null) {
    const nuevoId = usuarios.length === 0 ? 1 : Math.max(...usuarios.map((u) => u.id)) + 1;
    usuarios.push({ id: nuevoId, nombre: nombre, email: email });
    avisar('Usuario agregado.');
  } else {
    const usuario = usuarios.find((u) => u.id === editandoId);
    usuario.nombre = nombre;
    usuario.email = email;
    avisar('Cambios guardados.');
  }
  terminarEdicion();
  dibujarLista();
}

function editar(usuario) {
  $('inputNombre').value = usuario.nombre;
  $('inputEmail').value = usuario.email;
  pasarAModoEdicion(usuario);
}

function borrar(id) {
  usuarios = usuarios.filter((u) => u.id !== id);
  if (editandoId === id) terminarEdicion();
  dibujarLista();
  avisar('Usuario eliminado.');
}

// Vacía el array completo de una sola vez
function borrarTodos() {
  usuarios = [];
  terminarEdicion();
  dibujarLista();
  avisar('Se eliminaron todos los usuarios.');
}

$('btnFetch').addEventListener('click', cargarConFetch);
$('btnAxios').addEventListener('click', cargarConAxios);
dibujarLista();

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
