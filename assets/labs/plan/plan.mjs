function crearPar(primero, segundo) {
  return [primero, segundo];
}

function calcularTotal(minutosPorDia, cantidadDias) {
  return minutosPorDia * cantidadDias;
}

function minutosValidos(texto) {
  const valor = Number(texto);
  return texto.trim() !== '' && Number.isInteger(valor) && valor >= 0 && valor <= 120;
}

function recomendar(cantidad) {
  if (cantidad >= 60) {
    return 'Intensivo';
  }
  if (cantidad >= 30) {
    return 'Constante';
  }
  return 'Inicio';
}

function sumarSesiones(datos) {
  let total = 0;
  let i = 0;
  while (i < datos.length) {
    total = total + datos[i];
    i = i + 1;
  }
  return total;
}

function contarSesiones(datos, objetivo) {
  let cantidad = 0;
  for (let i = 0; i < datos.length; i = i + 1) {
    if (datos[i] >= objetivo) {
      cantidad = cantidad + 1;
    }
  }
  return cantidad;
}

function maximo(datos) {
  if (datos.length === 0) {
    return 'Sin datos';
  }
  let mayor = datos[0];
  let i = 1;
  while (i < datos.length) {
    if (datos[i] > mayor) {
      mayor = datos[i];
    }
    i = i + 1;
  }
  return mayor;
}

function resumir(datos, objetivo) {
  return crearPar(sumarSesiones(datos), contarSesiones(datos, objetivo));
}

function importarMinutos(texto) {
  try {
    const datos = JSON.parse(texto);
    if (!Array.isArray(datos) || !datos.every((n) => Number.isInteger(n) && n >= 0 && n <= 120))
      return null;
    return datos;
  } catch {
    return null;
  }
}

function mejorRacha(datos, meta) {
  let actual = 0;
  let mejor = 0;
  for (const valor of datos) {
    actual = valor >= meta ? actual + 1 : 0;
    mejor = Math.max(mejor, actual);
  }
  return mejor;
}

function modeloPlan(minutos, dias) {
  const total = calcularTotal(minutos, dias);
  const estado = recomendar(minutos);
  const alcanza = minutos >= 30;
  return { total, estado, alcanza };
}

function diasDelFormulario(texto) {
  const dias = Number(texto);
  return texto.trim() !== '' && Number.isInteger(dias) && dias >= 0 && dias <= 7 ? dias : null;
}

function etiquetaDeEstado(estado, dias) {
  const unidad = dias === 1 ? 'día' : 'días';
  return `${estado} · ${dias} ${unidad}`;
}

function lineasDelPanel(nombre, minutos, dias) {
  const { estado, total } = modeloPlan(minutos, dias);
  return [nombre, etiquetaDeEstado(estado, dias), `${total} min`];
}

function aplicarFormulario(nombre, minutos, dias) {
  const diasValidos = diasDelFormulario(dias);
  const limpio = nombre.trim();
  if (!limpio || !minutosValidos(minutos) || diasValidos === null) return null;
  return { nombre: limpio, minutos: Number(minutos), dias: diasValidos };
}

function reducirSesiones(datos, accion) {
  switch (accion.tipo) {
    case 'deshacer':
      return datos.slice(0, -1);
    case 'agregar':
      if (Number.isInteger(accion.minutos) && accion.minutos >= 0 && accion.minutos <= 120)
        return [...datos, accion.minutos];
  }
  return [...datos];
}

function restaurarSesiones(texto) {
  const vacio = (estado) => ({ estado, sesiones: [] });
  if (texto === null) return vacio('nuevo');
  try {
    const copia = JSON.parse(texto);
    if (copia?.version !== 1 || !Array.isArray(copia.sesiones)) return vacio('invalido');
    const sesiones = importarMinutos(JSON.stringify(copia.sesiones));
    return sesiones === null ? vacio('invalido') : { estado: 'guardado', sesiones };
  } catch {
    return vacio('invalido');
  }
}

function erroresDelPlan(nombre, minutos, dias) {
  const campos = [
    ['nombre', nombre.trim() !== ''],
    ['minutos', minutosValidos(minutos)],
    ['dias', diasDelFormulario(dias) !== null],
  ];
  return campos.filter((par) => !par[1]).map((par) => par[0]);
}

function informePlan(datos, objetivo) {
  const [total, cumplen] = resumir(datos, objetivo);
  const mayor = maximo(datos);
  const racha = mejorRacha(datos, objetivo);
  return { total, cumplen, mayor, racha };
}

function exportarPlan(sesiones) {
  return JSON.stringify({ version: 1, sesiones: [...sesiones] });
}

export {
  crearPar,
  calcularTotal,
  minutosValidos,
  recomendar,
  sumarSesiones,
  contarSesiones,
  maximo,
  resumir,
  importarMinutos,
  mejorRacha,
  modeloPlan,
  diasDelFormulario,
  etiquetaDeEstado,
  lineasDelPanel,
  aplicarFormulario,
  reducirSesiones,
  restaurarSesiones,
  erroresDelPlan,
  informePlan,
  exportarPlan,
};
