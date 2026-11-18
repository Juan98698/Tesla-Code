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

## Distribución de los 18 bloques

| Bloque                                  | Distribución | Justificación de la carga y refuerzo                                                                                                                                                                                                                |
| --------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primer programa                         | 8            | Introduce desde cero editor/salida, valores/secuencia, errores, const, let, cálculos, entradas y proyecto. Cada paso prepara una herramienta o representación todavía desconocida.                                                                  |
| Valores, tipos y operaciones            | 4            | Reconocer valores, elegir cálculos/unidades, expresar relaciones e integrar son objetivos distintos. Los operadores aritméticos relacionados permanecen juntos. Se añade transferencia de aforos para distinguir < de <= y exigir booleanos reales. |
| Decisiones y validación                 | 4            | Dos ramas, clasificación ordenada, combinación de reglas y admisión de datos forman cuatro avances del contrato. Una reserva nueva comprueba clasificación y rechazo sin copiar los umbrales de minutos.                                            |
| Repeticiones y trazas                   | 5            | Parada con while, estructura de for, acumulación, conteo y control con break y continue exigen razonamientos distintos. Se explica += con una traza y se añade un problema con aportes variables; no basta multiplicar una duración constante.      |
| Funciones y descomposición              | 4            | Parámetros/retorno, composición, reglas independientes y retornos tempranos conservan focos identificables. Un ejemplo hace visible el retorno undefined al imprimir sin return y una transferencia integra cobro, composición y límites.           |
| Listas y análisis                       | 6            | Construcción → lectura validada → suma → conteo → resumen → máximo. La representación se practica antes del protocolo variable y el conteo produce una función aprobada antes de componer el resumen.                                               |
| Recorridos y métodos de arreglo         | 5            | Empieza por recorrer valores. Separa callbacks, transformación, filtrado/búsqueda y reducción para contrastar cada método con su ciclo y sus casos vacíos.                                                                                          |
| Texto, objetos y colecciones con claves | 5            | Separa normalización, objetos y referencias, ausencia y opciones, JSON y colecciones Map/Set. El formato de intercambio llega después de la representación.                                                                                         |
| Contratos y coste                       | 2            | Primero decide qué comportamiento preservar. Después cuenta operaciones y contrasta cómo cambia el trabajo al crecer la entrada.                                                                                                                    |
| Búsqueda, orden y patrones              | 3            | Cada lección cambia la estrategia y sus supuestos. Búsqueda ordenada, ranking estable y ventana con frecuencias.                                                                                                                                    |
| Estructuras y recorridos                | 3            | Árbol con recursión, pila y cola, y grafo con visitados. Las tres representaciones resuelven problemas distintos.                                                                                                                                   |
| JavaScript avanzado                     | 4            | Cierres y alcance, clases y this, fechas y zonas, y representación con BigInt y Symbol. Cada tema tiene un uso y límites específicos.                                                                                                               |
| Herramientas y módulos                  | 3            | Entorno reproducible y Git, importaciones y exportaciones ES, y pruebas locales con depuración.                                                                                                                                                     |
| HTML y CSS para el proyecto             | 2            | La forma de representar información y controles precede a su presentación adaptable. Se evalúan con el mismo formulario.                                                                                                                            |
| DOM, eventos y estado                   | 4            | Render seguro, envío y errores, transiciones de estado y persistencia. Cada lección agrega una función observable en la interfaz.                                                                                                                   |
| Asincronía y HTTP                       | 5            | Orden de ejecución, promesas, contrato HTTP, consumo con fetch y cancelación. Separar el protocolo de la función asíncrona permite diagnosticar los fallos.                                                                                         |
| Calidad web                             | 3            | Pruebas de integración, errores y accesibilidad, y trabajo de renderizado. Cada objetivo requiere evidencias distintas.                                                                                                                             |
| Proyecto y publicación                  | 2            | Una entrega conecta las capacidades anteriores y la siguiente prueba que otra persona las puede usar a partir de una copia limpia.                                                                                                                  |

La distribución abarca 72 lecciones. Los bloques de dos lecciones tienen dos resultados que pueden comprobarse por separado. Los de cinco o más separan representaciones u operaciones que requieren practicar casos distintos antes de combinarlas.

## Competencias de salida

El estudiante parte de un primer programa en la consola y termina con un planificador modular, accesible por teclado, que valida entradas y conserva sesiones. Puede explicar decisiones de representación y coste, investigar fallos con casos reproducibles y comprobar respuestas HTTP, cancelación y conservación del estado.

La ruta profundiza en JavaScript moderno en el navegador y emplea Node.js para herramientas y pruebas. Los problemas usan lenguaje estándar, módulos ES, APIs web y dependencias mínimas. Los marcos de frontend, los servicios de backend, las bases de datos y las APIs específicas de producción pertenecen a sus respectivas rutas.

## Referencias y revisión

Los fundamentos de operadores, decisiones, ciclos, funciones y colecciones se contrastan con [MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting). Las lecciones enlazan referencias particulares de JavaScript, APIs web, accesibilidad, Node.js, Git y publicación, con una fecha de revisión técnica.

La [matriz de correspondencia](fundamentos-correspondencia-editorial.md) documenta dónde se enseña, practica y aplica cada habilidad. La revisión independiente de un docente y el piloto con principiantes quedan pendientes. El piloto debe medir la carga, dónde se quedan sin estrategias y si las pistas les sirven para avanzar.
