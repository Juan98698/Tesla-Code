import {
  aplicarFormulario,
  erroresDelPlan,
  exportarPlan,
  informePlan,
  lineasDelPanel,
  minutosValidos,
  reducirSesiones,
  restaurarSesiones,
} from './plan.mjs';

const form = document.querySelector('#plan');
const resultado = document.querySelector('#resultado');
const avisoPlan = document.querySelector('#aviso-plan');
const avisoSesiones = document.querySelector('#aviso-sesiones');
const resumen = document.querySelector('#resumen');
const registros = document.querySelector('#registros');
const clave = 'teslacode:laboratorio-plan:v1';
const atributos = ['Nombre', 'Minutos por día', 'Días del plan'];
const campos = ['nombre', 'minutos', 'dias'];
const maxArchivo = 100_000;
let objetivo = 30;
let carga;
try {
  carga = restaurarSesiones(localStorage.getItem(clave));
} catch {
  carga = { estado: 'sin acceso', sesiones: [] };
}
let sesiones = carga.sesiones;
if (carga.estado === 'invalido') {
  avisoSesiones.textContent = 'La copia anterior estaba dañada. Puedes empezar de nuevo.';
} else if (carga.estado === 'sin acceso') {
  avisoSesiones.textContent = 'El navegador no permite acceder a las sesiones guardadas.';
}

function nodo(etiqueta, texto) {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  return elemento;
}

function renderSesiones() {
  const { total, cumplen, mayor, racha } = informePlan(sesiones, objetivo);
  const medidas = [
    ['Minutos realizados', total],
    ['Sesiones con meta', cumplen],
    ['Mayor duración', mayor],
    ['Mejor racha', racha],
  ];
  resumen.replaceChildren(
    ...medidas.flatMap(([titulo, valor]) => [nodo('dt', titulo), nodo('dd', valor)]),
  );
  registros.replaceChildren(...sesiones.map((valor) => nodo('li', valor + ' min')));
}

function guardarYMostrar(mensaje) {
  try {
    localStorage.setItem(clave, exportarPlan(sesiones));
    avisoSesiones.textContent = mensaje;
  } catch {
    avisoSesiones.textContent = mensaje + ' El navegador no pudo guardar el cambio.';
  }
  renderSesiones();
}

form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const valores = new FormData(form);
  const argumentos = campos.map((campo) => valores.get(campo));
  const errores = erroresDelPlan(...argumentos);
  for (const campo of campos) {
    const control = document.getElementById(campo);
    if (errores.includes(campo)) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  }
  if (errores.length) {
    avisoPlan.textContent =
      'Revisa estos campos: ' +
      errores.map((campo) => atributos[campos.indexOf(campo)]).join(', ') +
      '.';
    document.getElementById(errores[0]).focus();
    return;
  }
  const datos = aplicarFormulario(...argumentos);
  if (!datos) return;
  objetivo = datos.minutos;
  resultado.replaceChildren(
    ...lineasDelPanel(datos.nombre, datos.minutos, datos.dias).map((linea) => nodo('p', linea)),
  );
  avisoPlan.textContent = 'Plan calculado.';
  renderSesiones();
});

const sesion = document.querySelector('#sesion');
sesion.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const control = document.getElementById('duracion');
  const texto = control.value;
  if (!minutosValidos(texto) || sesiones.length >= 300) {
    avisoSesiones.textContent =
      sesiones.length >= 300
        ? 'La lista admite 300 sesiones. Descarga una copia antes de continuar.'
        : 'Escribe una duración entera entre 0 y 120 minutos.';
    control.focus();
    return;
  }
  sesiones = reducirSesiones(sesiones, { tipo: 'agregar', minutos: Number(texto) });
  control.value = '';
  guardarYMostrar('Sesión registrada.');
});

document.querySelector('#deshacer').addEventListener('click', () => {
  if (sesiones.length === 0) {
    avisoSesiones.textContent = 'Aún no hay sesiones que deshacer.';
    return;
  }
  sesiones = reducirSesiones(sesiones, { tipo: 'deshacer' });
  guardarYMostrar('Última sesión retirada.');
});

document.querySelector('#exportar').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([exportarPlan(sesiones)], { type: 'application/json' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'mi-plan.json';
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
});

let versionCopia = 0;
document.querySelector('#copia').addEventListener('change', async (evento) => {
  const vigente = ++versionCopia;
  const control = evento.currentTarget;
  const archivo = control.files[0];
  if (!archivo) return;
  try {
    if (archivo.size > maxArchivo) throw Error('Copia demasiado grande');
    const copia = restaurarSesiones(await archivo.text());
    if (vigente !== versionCopia) return;
    if (copia.estado !== 'guardado' || copia.sesiones.length > 300)
      throw Error('Copia no compatible');
    sesiones = copia.sesiones;
    guardarYMostrar('Copia restaurada.');
  } catch {
    if (vigente === versionCopia)
      avisoSesiones.textContent = 'La copia no es válida. Se conservan tus sesiones.';
  } finally {
    if (vigente === versionCopia) control.value = '';
  }
});

let version = 0;
let controlador;
const estadoRed = document.querySelector('#estado-red');
document.querySelector('#busqueda').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const tema = new FormData(evento.currentTarget).get('tema');
  const vigente = ++version;
  controlador?.abort();
  controlador = new AbortController();
  const { signal } = controlador;
  estadoRed.textContent = 'Consultando sugerencias…';
  try {
    const url = './sugerencias.json?tema=' + encodeURIComponent(tema);
    const respuesta = await fetch(url, { signal });
    if (!respuesta.ok) throw Error('HTTP ' + respuesta.status);
    const sugerencias = await respuesta.json();
    const consejo = sugerencias?.[tema];
    if (typeof consejo !== 'string' || consejo.trim() === '') throw Error('Dato inesperado');
    if (vigente === version) estadoRed.textContent = consejo;
  } catch {
    if (vigente === version && !signal.aborted)
      estadoRed.textContent = 'No se pudo cargar la sugerencia. Tu plan sigue disponible.';
  }
});
renderSesiones();
