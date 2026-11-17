# Alcance y carga de los temas de Fundamentos JavaScript

Decisión del usuario, 16 de noviembre de 2026. La cantidad de lecciones se deriva
del tema que hay que enseñar. Cuatro es el número de etapas de cada entrega, no
un límite ni un objetivo de publicaciones por bloque. La coherencia se revisa antes
de entregar el material a principiantes; el piloto ajustará ritmo y comprensión.

## Criterio de distribución

1. Delimitar lo que promete el tema y enumerar las habilidades necesarias, incluyendo
   lectura de código, escritura, explicación, selección de casos y corrección.
2. Identificar qué se enseñó y practicó antes, qué se introduce aquí y qué necesita
   una introducción posterior explícita. No considerar aprendido algo solo por
   mencionarlo o incluirlo en una solución.
3. Para cada habilidad nueva, aportar explicación, ejemplo ejecutable, error típico,
   práctica y aplicación. Una explicación breve no reemplaza esa secuencia.
4. Mantener en una lección operaciones que resuelven una misma pregunta con los
   mismos datos. Separar una representación nueva de un protocolo de entradas,
   y separar una regla de la composición que la utiliza cuando ambas necesitan
   práctica independiente.
5. Cada lección aporta una capacidad del producto o una reescritura justificada que
   utiliza el tramo siguiente. Las actividades de transferencia plantean otro
   contrato con menos instrucciones y pistas opcionales.
6. Aumentar actividades cuando falta transferencia o un caso relevante; aumentar
   lecciones cuando hace falta una etapa de enseñanza propia. No dividir una
   explicación por cada símbolo ni agregar ejercicios que repitan las mismas
   decisiones solo para aumentar el volumen.
7. Contrastar las tecnologías con documentación vigente y el entorno de ejecución.
   Priorizar capacidades estables usadas en los problemas de la ruta. Una técnica
   básica no es obsoleta por su edad; una API reciente no es obligatoria por ser nueva.

## Resultado sobre el núcleo publicado

| Bloque                       | Distribución | Justificación de la carga y refuerzo                                                                                                                                                                                                                |
| ---------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primer programa              | 8            | Introduce desde cero editor/salida, valores/secuencia, errores, const, let, cálculos, entradas y proyecto. Cada paso prepara una herramienta o representación todavía desconocida.                                                                  |
| Valores, tipos y operaciones | 4            | Reconocer valores, elegir cálculos/unidades, expresar relaciones e integrar son objetivos distintos. Los operadores aritméticos relacionados permanecen juntos. Se añade transferencia de aforos para distinguir < de <= y exigir booleanos reales. |
| Decisiones y validación      | 4            | Dos ramas, clasificación ordenada, combinación de reglas y admisión de datos forman cuatro avances del contrato. Una reserva nueva comprueba clasificación y rechazo sin copiar los umbrales de minutos.                                            |
| Repeticiones y trazas        | 4            | Parada con while, estructura de for, acumulación y conteo exigen razonamientos distintos. Se explica += con una traza y se añade un problema con aportes variables; no basta multiplicar una duración constante.                                    |
| Funciones y descomposición   | 4            | Parámetros/retorno, composición, reglas independientes y retornos tempranos conservan focos identificables. Un ejemplo hace visible el retorno undefined al imprimir sin return y una transferencia integra cobro, composición y límites.           |
| Listas y análisis            | 6            | Construcción → lectura validada → suma → conteo → resumen → máximo. La representación se practica antes del protocolo variable y el conteo produce una función aprobada antes de componer el resumen.                                               |

La coincidencia de cuatro en algunos bloques es resultado de los objetivos del
núcleo descrito, no una norma para los siguientes. La distribución vuelve a abrirse
si una capacidad requerida no tiene introducción y práctica suficientes. Estas
cantidades describen lo implementado, no una garantía de carga óptima universal.

El primer registro del proyecto está vacío; la siguiente lección lo llena con
entradas reales. Registros: muestra el arreglo para que almacenar textos en lugar
de números sea un fallo observable antes de sumar. El conteo mantiene suma y datos;
el resumen reutiliza crearPar, sumarSesiones y contarSesiones. No se acreditan las
lecciones nuevas por haber completado una edición anterior.

## Ampliaciones del lenguaje que no se dan por aprendidas

Los seis bloques son el núcleo publicado, no el lenguaje completo. El alcance del
mapa conserva estas introducciones pendientes, antes de exigirlas en proyectos:

- Bloque 7: funciones como valores y flechas, for...of y control de recorridos con
  break/continue antes de búsquedas y filtros; métodos de arreglo uno por uno tras
  su ciclo equivalente. El condicional como expresión requiere su ejemplo propio.
  do...while se contrasta con while cuando un intento inicial sea parte del problema.
- Bloque 8: texto, objetos, propiedades, referencias, copias y diccionarios antes
  de agrupar o serializar; selección de opciones por valor con switch y su salida
  controlada; valores truthy/falsy antes de contrastar acceso opcional y coalescencia
  nula. new y recuperación de errores preceden a Map/Set/Date y JSON.parse.
- Bloque 12: alcance y capturas, prototipos, this, clases, composición y los casos
  específicos de BigInt/Symbol. No reemplaza la introducción práctica anterior.
- Bloques 13–18: entorno local, módulos ES, pruebas y Git; HTML/CSS antes de DOM;
  eventos y estado antes de persistencia; promesas y HTTP antes de async/await y
  fetch; errores, cancelación, accesibilidad y publicación dentro de sus proyectos.

Estas capacidades siguen en preparación; no se suprimen del alcance ni se atribuyen
al estudiante por finalizar las listas. Su cantidad de lecciones se decidirá con
el mismo inventario, sin copiar la cantidad del bloque anterior.

## Referencias contrastadas

Consultadas el 16 de noviembre de 2026; las seis direcciones respondieron con sus
guías actuales. Se usan para contrastar operaciones, semántica y familias de
habilidades, no como una prueba de popularidad ni como un currículo para copiar.

- [Números y operadores, MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Math).
- [Decisiones, MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Conditionals).
- [Recorridos, MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Loops).
- [Funciones, MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Functions).
- [Arreglos, MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Arrays).
- [Contrato de push, MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push).

La comprobación editorial revisa el contenido y sus dependencias; las pruebas
comprueban comportamientos y regresiones. La revisión docente independiente y el
piloto siguen pendientes y no se presentan como condición para redactar lo básico.
