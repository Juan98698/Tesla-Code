# Revisión de granularidad y claridad de Fundamentos JavaScript

La revisión comprende el material publicado y sus ejemplos, actividades,
cuestionarios, pistas y mensajes. Se contrasta cada construcción exigida con la
lección que la introduce y con la entrega que consume. Las revisiones son
asistidas; la comprensión y la facilidad de uso con principiantes requieren un
piloto que todavía no se ha realizado.

## Distribución y decisión

| Bloque                       | Hallazgo                                                                                                                              | Distribución aplicada                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primer programa              | Ocho pasos acotados introducen editor, valores, errores, const, let, cálculos, entradas e integración. Las pistas se repetían.        | Se conservan las ocho lecciones y se corrigen las orientaciones de cada habilidad.                                                                 |
| Valores, tipos y operaciones | La separación anterior ya distingue reconocer tipos, operar, comparar e integrar.                                                     | Se conservan cuatro lecciones y se revisan pistas y mensajes sin añadir temas nuevos.                                                              |
| Decisiones y validación      | if/else, varias categorías, operadores lógicos y comprobaciones de texto aparecían en dos lecciones.                                  | Dos caminos → categorías con else if → reglas con conjunción, disyunción y negación → texto, entero y rango.                                       |
| Repeticiones y trazas        | La segunda lección introducía a la vez for, acumulación y conteo condicional.                                                         | while → calendario equivalente con for → minutos acumulados → días que cumplen.                                                                    |
| Funciones y descomposición   | Definición, retorno, composición, extracción de reglas y retornos tempranos se concentraban en dos lecciones.                         | Parámetros y retorno → composición → reglas independientes → retornos tempranos y contratos.                                                       |
| Listas y análisis            | Crear, leer, sumar, contar, devolver listas y hallar un máximo aparecían en dos entregas. El título prometía texto sin desarrollarlo. | Construcción e índices → lectura validada → suma sin mutación → conteo → resumen → máximo e integración. El nombre refleja el contenido publicado. |

Cada lección conserva entender → implementar → reescribir y comprobar → integrar
y depurar. Hay 30 publicaciones y siete comprobaciones posteriores en otros
contextos. Las lecciones nuevas no se acreditan automáticamente a quienes ya
completaron una edición anterior; se conservan sus IDs, registros y XP.

## Correcciones de claridad

- Las pistas avanzan desde una pregunta de análisis hasta una traza concreta y una
  orientación de código. Por ejemplo, acumulación explica dónde sobrevive el
  total; conteo distingue sumar minutos de agregar una unidad por coincidencia.
- El primer contacto con funciones muestra guardar y presentar un retorno. Las
  llamadas anidadas se introducen en su propia lección antes de exigirlas.
- Las reglas booleanas preparadas se consultan con valores iniciales de prueba
  visibles. La validación siguiente utiliza la regla de rango antes de calcular.
- Las listas se construyen antes de pedir que se sumen. El helper crearPar se
  reutiliza después al construir el resumen de dos resultados.
- Los contratos de funciones, la lectura de entradas del reporte y las llamadas
  independientes del comprobador se explican por separado.
- Los casos muestran los valores iniciales que cambian y los datos que se
  comprueban al terminar. Un fallo de datos muestra valor y tipo observados,
  incluso para undefined; la impresión del reporte por sí sola puede coincidir.
- Una decisión equivocada muestra una pista para esa decisión. Un fallo de código
  orienta sobre la habilidad del reto y conserva resultados esperados y observados.
- Un resultado correcto se describe como coincidencia de casos. La comparación con
  la entrega anterior tiene un estado propio y la explicación escrita permanece
  pendiente de revisión humana.

## Comprobaciones y límites

Se ejecutan ejemplos y soluciones, variantes, argumentos independientes y copias
defectuosas. Las pruebas contrastan orden, conservación de capacidades,
construcciones aún no enseñadas, resultados de reescrituras, cero, extremos,
repetidos, listas vacías, inmutabilidad y tipos. También cubren que las pistas no
concedan progreso y que los mensajes no afirmen comprensión humana.

Los doce bloques futuros siguen siendo planificación. No se presenta su material
como redactado, ni se atribuye claridad comprobada a explicaciones que aún no
existen. La revisión docente independiente y las observaciones con estudiantes
siguen pendientes.

## Granularidad de los doce bloques en preparación

Sus tarjetas actuales representan bloques, no lecciones de treinta minutos ya
redactadas. Se revisó el alcance del plan; la cantidad final de lecciones se
resolverá al redactar incrementos comprobables, sin imponer cuatro u ocho por
simetría. Cada habilidad nueva necesita explicación, ejemplo y práctica antes de
combinarse con otra. Las siguientes son condiciones de desarrollo pendientes:

| Bloque                                | Separación necesaria antes de publicar                                                                                                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7. Funciones como valores             | Expresiones y flechas → pasar una función y seguir su llamada → métodos de arreglo uno por uno con su ciclo equivalente → combinaciones. Comenzar con números y textos ya conocidos, sin asumir objetos.                             |
| 8. Datos y colecciones especializadas | Texto más allá de trim → objetos, propiedades y referencias → copias y acceso seguro → diccionarios y agrupación → JSON y errores → Map/Set → fechas y formato → expresiones regulares. No concentrar estas familias en una lección. |
| 9. Resolver y medir                   | Recuperar casos y trazas ya practicados → contar operaciones según tamaño → distinguir tiempo y memoria → potencias/logaritmos antes de Big O → comparar enfoques con datos controlados.                                             |
| 10. Estrategias algorítmicas          | Búsqueda lineal → datos ordenados y búsqueda binaria → ordenamientos y comparadores → frecuencias → dos punteros → ventanas con sus condiciones y contraejemplos.                                                                    |
| 11. Recursión y estructuras           | Traza de llamadas y caso base → progreso y profundidad → pilas y colas → representar árboles antes de recorrerlos → representar grafos antes de DFS/BFS.                                                                             |
| 12. JavaScript en profundidad         | Ampliar alcance y capturas → referencias y prototipos → this y funciones flecha → clases → comparación de composición y herencia. BigInt y Symbol necesitan su propio problema y límites.                                            |
| 13. Organización y herramientas       | Archivos y rutas → terminal y entorno Node → errores y depurador → módulos → pruebas ejecutables → Git y colaboración → paquetes y scripts. Los comandos se enseñan antes de pedir una entrega local.                                |
| 14. Puente web                        | Documento HTML y atributos → presentación con CSS → selectores → formularios y teclado → conectar JavaScript. No exigir DOM antes de construir el documento.                                                                         |
| 15. DOM, eventos y persistencia       | Seleccionar y actualizar nodos → eventos → formularios y validación → estado → almacenamiento JSON y recuperación ante fallos → interacción no confiable.                                                                            |
| 16. Asincronía y comunicación         | Flujo y temporizadores → promesas con then/catch → async/await → HTTP/JSON → fetch y errores → cancelación y respuestas fuera de orden.                                                                                              |
| 17. Calidad de una aplicación         | Pruebas unitarias → integración → interfaz y accesibilidad → protección de entradas y privacidad → medición → refactorización con regresiones. Cada comprobación protege un fallo observable.                                        |
| 18. Proyecto integrador               | Requisitos y criterios → entregas que conservan lo aprobado → integración de capacidades enseñadas → variante nueva → depuración y documentación → publicación reproducible.                                                         |

El bloque publicado de listas no desarrolla todavía objetos, copias superficiales,
for...of, eliminación/búsqueda ni tratamiento general de texto. No se consideran
aprendidos por haber completado las listas. El bloque 7 debe introducir for...of
antes de utilizarlo y puede trabajar sobre arreglos de valores simples; el 8 debe
introducir objetos antes de diccionarios, JSON, destructuración de objetos,
propagación de objetos o encadenamiento opcional. Allí se explicará también la
coalescencia nula y su diferencia con la disyunción. new precede a Map, Set y Date;
try/catch precede a recuperar errores de JSON.parse. Estas capacidades continúan
pendientes y no desaparecen al acotar el contenido publicado.

La [revisión posterior de alcance](fundamentos-alcance-y-carga.md) fundamenta la
cantidad en el tema y sus usos. Listas crece a seis lecciones y los otros bloques
reciben prácticas de transferencia donde faltaba aplicar una habilidad a un
contrato nuevo. Las cuatro etapas se mantienen dentro de cada lección; no fijan
la cantidad de publicaciones.
