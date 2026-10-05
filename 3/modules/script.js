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
let editandoId = null;

// Pasa a minúsculas y quita tildes, para que "Maria" encuentre "María"
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function cargarUsuarios() {
  $('infoLista').textContent = 'Cargando usuarios...';
  try {
    const respuesta = await fetch(URL_API);
    if (!respuesta.ok) throw new Error('Error ' + respuesta.status);
    const datos = await respuesta.json();
    usuarios = datos.map((u) => ({ id: u.id, nombre: u.name, email: u.email }));
    dibujarLista();
  } catch (error) {
    $('infoLista').textContent = 'No se pudieron cargar los usuarios.';
    avisar('Falló la carga: ' + error.message, 'error');
  }
}

// Filtra el array con lo que hay escrito en el buscador y lo muestra
function cantidadTotal() {
  return usuarios.length;
}

function dibujarLista() {
  $('btnBorrarTodos').disabled = usuarios.length === 0;
  const escrito = $('inputBuscar').value.trim();
  const visibles = usuarios.filter((u) => normalizar(u.nombre).includes(normalizar(escrito)));
  $('infoLista').textContent = 'Mostrando ' + visibles.length + ' de ' + usuarios.length + ' usuarios';
  const vacio = usuarios.length === 0 ? 'No hay usuarios.' : 'Ningún nombre coincide con «' + escrito + '».';
  dibujarTarjetas(visibles, vacio, editar, pedirBorrado);
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

// Vacía el array completo (no solo los que se ven filtrados)
function borrarTodos() {
  usuarios = [];
  terminarEdicion();
  dibujarLista();
  avisar('Se eliminaron todos los usuarios.');
}

$('inputBuscar').addEventListener('input', dibujarLista);
cargarUsuarios();

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
