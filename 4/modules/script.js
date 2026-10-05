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

const API = '/api/alumnos';
const TITULO_AGREGAR = 'Agregar alumno';
const TITULO_EDITAR = 'Editar alumno';
const NOMBRE_PLURAL = 'alumnos';

let alumnos = [];
let editandoId = null;

// Arma las opciones de fetch para POST y PUT
function conCuerpo(metodo, datos) {
  return { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) };
}

// Pide algo a la API y devuelve los datos; si hay error lanza un mensaje claro
async function pedir(url, opciones) {
  const respuesta = await fetch(url, opciones);
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || 'Error ' + respuesta.status);
  return datos;
}

async function cargarAlumnos() {
  try {
    alumnos = await pedir(API);
    dibujarLista();
  } catch (error) {
    $('infoLista').textContent = 'No se pudo conectar con la API.';
    avisar('Falló la carga: ' + error.message, 'error');
  }
}

function cantidadTotal() {
  return alumnos.length;
}

function dibujarLista() {
  $('btnBorrarTodos').disabled = alumnos.length === 0;
  $('infoLista').textContent = alumnos.length + ' alumnos recibidos de la API (GET /api/alumnos)';
  dibujarTarjetas(alumnos, 'Todavía no hay alumnos. Agregá el primero.', editar, pedirBorrado);
}

// ---- Agregar, editar y borrar (POST, PUT y DELETE) ----
async function guardar() {
  const datos = {
    nombre: $('inputNombre').value.trim(),
    email: $('inputEmail').value.trim(),
    curso: $('inputCurso').value.trim()
  };
  if (datos.nombre.length < 2) { mostrarErrorForm('El nombre debe tener al menos 2 caracteres.'); return; }
  if (!emailValido(datos.email)) { mostrarErrorForm('Escribí un email válido.'); return; }
  if (datos.curso === '') { mostrarErrorForm('Escribí el curso.'); return; }

  try {
    if (editandoId === null) {
      await pedir(API, conCuerpo('POST', datos));
      avisar('Alumno agregado.');
    } else {
      await pedir(API + '/' + editandoId, conCuerpo('PUT', datos));
      avisar('Cambios guardados.');
    }
    terminarEdicion();
    await cargarAlumnos();
  } catch (error) {
    mostrarErrorForm(error.message);
  }
}

function editar(alumno) {
  $('inputNombre').value = alumno.nombre;
  $('inputEmail').value = alumno.email;
  $('inputCurso').value = alumno.curso;
  pasarAModoEdicion(alumno);
}

async function borrar(id) {
  try {
    await pedir(API + '/' + id, { method: 'DELETE' });
    if (editandoId === id) terminarEdicion();
    avisar('Alumno eliminado.');
    await cargarAlumnos();
  } catch (error) {
    avisar('No se pudo eliminar: ' + error.message, 'error');
  }
}

// DELETE /api/alumnos (sin id) vacía toda la lista en el servidor
async function borrarTodos() {
  try {
    await pedir(API, { method: 'DELETE' });
    terminarEdicion();
    avisar('Se eliminaron todos los alumnos.');
    await cargarAlumnos();
  } catch (error) {
    avisar('No se pudo eliminar: ' + error.message, 'error');
  }
}

cargarAlumnos();

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
