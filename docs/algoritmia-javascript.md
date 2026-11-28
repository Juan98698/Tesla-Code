# Algoritmia en JavaScript: ruta secuencial con proyecto acumulativo

La edición JavaScript publica las primeras 14 lecciones de un mapa de 87. Taller y Análisis están disponibles en secuencia. Los siete niveles siguientes, con 73 temas, siguen en preparación. La edición anterior de pseudocódigo y su laboratorio en Python siguen disponibles como archivo.

## 1. Decisión y alcance

- **Lenguaje:** JavaScript puro, sin TypeScript, sin librerías y sin pasos de compilación. Los tipos, si hacen falta, se explican con JSDoc.
- **Entrada libre:** se recomienda Fundamentos con JavaScript. Las lecciones introducen o repasan la sintaxis que utilizan antes de pedir su aplicación. Algoritmia amplía contratos, pruebas, demostraciones y costes a medida que construye Tesla Metro.
- **Secuencial:** 87 lecciones en 9 niveles. Cada una depende de la anterior y, cuando hace falta, de otras lecciones concretas (columna «Además requiere»).
- **Proyecto acumulativo:** Tesla Metro, el motor de rutas de una ciudad que crece lección a lección.
- **Interacción:** las cinco lecciones nuevas de Análisis incluyen una traza interactiva con decisiones y código ejecutable. Los visualizadores y duelos del temario describen formatos previstos para el desarrollo posterior.

## 2. Principios para no dejar vacíos

1. **Ningún símbolo ni término aparece sin explicarse antes con un ejemplo.** Primero el caso concreto, después la definición.
2. **Cada algoritmo se enseña con cuatro vistas:** intuición (visualizador), traza a mano, implementación en JavaScript y coste (medido y razonado).
3. **Se construyen modelos explícitos.** Se usan arreglos de JavaScript como herramienta de enseñanza desde el taller. Antes de atribuir un coste a una estructura, se explica su modelo y se diferencia de lo que garantiza la especificación del lenguaje.
4. **Cada concepto tiene al menos una evaluación explicativa y una evaluativa**, como exige el validador del repositorio.
5. **Se comprueban casos concretos y propiedades.** La búsqueda comprueba lecturas observadas. El crecimiento se contrasta con copias en un arreglo construido de forma explícita y las consultas por prefijos se comparan con un oráculo directo en intervalos enumerados.
6. **Los errores típicos forman parte del temario:** off-by-one, mutar mientras se recorre, comparar objetos por referencia, recursión sin caso base.
7. **Cada lección declara requisitos y conceptos nuevos.** El validador bloquea una lección que use algo no enseñado antes.

## 3. Cómo es una lección

El bloque comienza con una misión, una explicación, ejemplos ejecutables y una traza. En la práctica se sigue el ciclo de entender, implementar, reescribir y comprobar, e integrar y depurar. Las nuevas lecciones recuperan código aprobado y prueban capacidades previas en las siguientes entregas. Cada lección nueva añade un reto independiente con editor vacío. La bitácora guarda la justificación del estudiante para revisión.

**Formatos que la hacen dinámica** (columna «Formato» del temario):

| Marca | Formato                | Qué hace                                                                  |
| ----- | ---------------------- | ------------------------------------------------------------------------- |
| V     | Visualizador           | Se avanza un paso a la vez y se manipula la entrada.                      |
| D     | Duelo                  | Dos algoritmos compiten con un contador de operaciones y una gráfica.     |
| T     | Traza-juego            | Se predice cada paso antes de verlo.                                      |
| B     | Detective de bugs      | Un algoritmo casi correcto falla en un caso límite que hay que encontrar. |
| P     | Propiedades y proyecto | Pruebas con oráculo y entrega al proyecto acumulativo.                    |

Los hitos específicos de rendimiento y nuevos visualizadores pertenecen al plan de desarrollo.

### Correspondencia del bloque de Análisis publicado

| Lección                     | Explicación y ejemplo                                                                                                         | Implementación y reescritura                                                             | Integración y transferencia                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mejor, peor y caso promedio | Posición, ausencia, extremos y esperanza bajo una distribución declarada. Se trazan búsquedas y consultas de una muestra.     | `implementar-busqueda` y `reescribir-muestra` verifican salida temprana, media y vacío.  | `integrar-perfil` distingue máximo de una consulta y total de un lote. `aplicar-incidencia` busca la primera demora que supera un umbral.                 |
| Coste amortizado            | Duplicación, coste individual, suma geométrica y crecimiento fijo. El ejemplo de avisos efectúa las copias.                   | `implementar-crecimiento` y `reescribir-politicas` separan capacidad, escrituras y pico. | `integrar-catalogo` conserva el perfil de búsqueda y detecta una política mal elegida. `aplicar-avisos` almacena datos con crecimiento real en el modelo. |
| Memoria y espacio auxiliar  | Entrada, salida, trabajo auxiliar, pila activa, copias y pico de reserva. Se comparan dos sumas equivalentes.                 | `implementar-suma` y `reescribir-pila` cuentan lecturas y llamadas internas.             | `integrar-espacio` distingue capacidad final y pico. `aplicar-sufijo` evita la copia y las lecturas del prefijo.                                          |
| Corrección e invariantes    | Intervalos semiabiertos, estado inicial, conservación, salida y variante. Se prueba el rechazo antes de leer.                 | `implementar-prefijo` y `reescribir-intervalo` conservan fronteras y datos.              | `integrar-distancia` repara una lectura fuera del rango. `aplicar-demoras` cambia la suma por un contador con invariante propio.                          |
| Elegir con evidencia        | Sumas acumuladas, equivalencia, coste de preparación, memoria y reloj. El experimento alterna orden y mide ambas estrategias. | `implementar-directa` y `reescribir-indice` conservan el contrato de cada consulta.      | `integrar-decision` aplica presupuesto y empate. `aplicar-estimacion` decide antes de ejecutar un lote de lecturas.                                       |

Mitades y recurrencias conservan su práctica original. La explicación delimita el caso simplificado del teorema maestro, completa el coste cuando dominan las hojas y muestra por qué Fibonacci queda fuera de ese modelo.

## 4. Proyecto acumulativo: Tesla Metro

Se construye el motor de una red de metro. Cada checkpoint entrega una capacidad nueva y reutiliza el código aprobado de los anteriores.

| Lección | Entrega del proyecto                                       |
| ------- | ---------------------------------------------------------- |
| #28     | Checkpoint 1: catálogo de estaciones con historial y caché |
| #39     | Checkpoint 2: horarios y simulación de eventos             |
| #48     | Checkpoint 3: autocompletado y estadísticas por tramo      |
| #50     | Construir el grafo de Tesla Metro                          |
| #62     | Checkpoint 4: el planificador de rutas                     |
| #74     | Checkpoint 5: optimizar la red                             |
| #87     | Proyecto final: Tesla Metro completo                       |

Resumen por tramos:

| Tramo                | Capacidad del producto                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| Taller               | Datos de la ciudad, pruebas y medición                                          |
| Estructuras lineales | Catálogo de estaciones con historial de consultas y caché de rutas recientes    |
| Buscar y ordenar     | Horarios ordenados y simulación de la llegada de trenes con una cola de eventos |
| Árboles              | Autocompletado de estaciones y estadísticas de pasajeros por tramo              |
| Grafos               | Planificador: menos paradas, ruta más rápida, plan de obras y capacidad         |
| Estrategias          | Optimización de la red: presupuesto, recorrido de inspección y compresión       |
| JavaScript real      | Rendimiento medido, trabajo fuera del hilo principal y datos grandes            |
| Entrega              | Aplicación integrada, informe de decisiones y pruebas por propiedades           |

## 5. Temario completo

### Nivel 1: Taller y proyecto (4 lecciones)

_Preparar el taller, entender el proyecto y aprender a probar y medir antes de optimizar._

| #   | Lección                                             | Conceptos que enseña                                                      | Formato                | Además requiere |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------- | --------------- |
| 1   | Tesla Metro: el problema, el contrato y el taller   | contrato del problema, entradas y salidas, estructura del proyecto        | Traza-juego            | —               |
| 2   | Representar la ciudad: estaciones, líneas y tiempos | modelo de datos, JSON del mapa, copia profunda                            | —                      | —               |
| 3   | Probar un algoritmo: casos, fronteras y oráculos    | oráculo de fuerza bruta, prueba de propiedades, aleatoriedad reproducible | Propiedades y proyecto | —               |
| 4   | Medir de verdad: operaciones, tiempo y ruido        | contador de operaciones, calentamiento, varianza, benchmark honesto       | Duelo                  | —               |

### Nivel 2: Análisis de algoritmos (10 lecciones)

_Predecir y demostrar cómo se comporta un algoritmo antes de ejecutarlo._

| #   | Lección                                              | Conceptos que enseña                                              | Formato              | Además requiere |
| --- | ---------------------------------------------------- | ----------------------------------------------------------------- | -------------------- | --------------- |
| 5   | Por qué importa la escala                            | tamaño de entrada, crecimiento, límite práctico                   | Visualizador · Duelo | —               |
| 6   | Las funciones de crecimiento                         | constante, logarítmico, lineal, n log n, cuadrático, exponencial  | Visualizador         | —               |
| 7   | Big O, Omega y Theta                                 | cota superior, cota inferior, cota ajustada, constantes ignoradas | Traza-juego          | —               |
| 8   | Analizar ciclos simples, anidados y que dividen      | conteo de operaciones, ciclos anidados, ciclos logarítmicos       | Traza-juego          | —               |
| 9   | Analizar recursión: árbol de llamadas y recurrencias | recurrencia, árbol de llamadas, teorema maestro                   | Visualizador         | —               |
| 10  | Mejor, peor y caso promedio                          | caso adversarial, caso promedio, sensibilidad a la entrada        | Duelo                | —               |
| 11  | Coste amortizado                                     | análisis amortizado, duplicación de capacidad, método agregado    | Visualizador · Duelo | —               |
| 12  | Memoria y espacio auxiliar                           | espacio auxiliar, pila de llamadas, copias                        | —                    | —               |
| 13  | Corrección: invariantes y terminación                | invariante de ciclo, terminación, inducción                       | Detective de bugs    | —               |
| 14  | Elegir con evidencia: análisis más medición          | informe de decisión, modelo frente a medición                     | Duelo                | #4              |

### Nivel 3: Estructuras lineales y hash (14 lecciones)

_Construir desde cero las estructuras que sostienen casi todo lo demás._

| #   | Lección                                                    | Conceptos que enseña                                              | Formato                          | Además requiere |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------- | --------------- |
| 15  | Arreglos dinámicos desde dentro                            | memoria contigua, capacidad y longitud, estrategia de crecimiento | Visualizador                     | #11             |
| 16  | Listas enlazadas simples                                   | nodo, referencia, inserción y borrado                             | Visualizador                     | —               |
| 17  | Listas dobles y nodos centinela                            | enlace doble, centinela, borrado en tiempo constante              | Visualizador                     | —               |
| 18  | Pilas                                                      | LIFO, apilar y desapilar, paréntesis balanceados                  | Traza-juego                      | —               |
| 19  | Colas y colas circulares                                   | FIFO, buffer circular, índices con módulo                         | Visualizador                     | —               |
| 20  | Deque y ventana monótona                                   | deque, ventana deslizante, máximo en ventana                      | Traza-juego                      | —               |
| 21  | Tablas hash I: función hash y colisiones                   | función hash, colisión, encadenamiento                            | Visualizador                     | #11             |
| 22  | Tablas hash II: factor de carga y rehash                   | direccionamiento abierto, factor de carga, rehash                 | Visualizador · Duelo             | —               |
| 23  | Map y Set nativos: qué hacen por dentro                    | igualdad de claves, orden de inserción, coste esperado            | Duelo                            | —               |
| 24  | Caché LRU                                                  | política de expulsión, Map más lista doble, acierto y fallo       | Visualizador · Duelo             | #17, #22        |
| 25  | Técnicas con arreglos: dos punteros y sumas de prefijos    | dos punteros, ventana, suma de prefijos, arreglo de diferencias   | Traza-juego                      | —               |
| 26  | Cadenas I: búsqueda de patrón y hash rodante               | búsqueda ingenua, hash rodante, Rabin–Karp                        | Visualizador                     | #21             |
| 27  | Cadenas II: KMP y la función de fallo                      | prefijo y sufijo, función de fallo, KMP                           | Visualizador · Detective de bugs | —               |
| 28  | Checkpoint 1: catálogo de estaciones con historial y caché | integración de estructuras, índice por nombre, historial          | Propiedades y proyecto           | #24, #18, #27   |

### Nivel 4: Buscar y ordenar (11 lecciones)

_Dominar los algoritmos clásicos y entender sus compromisos._

| #   | Lección                                        | Conceptos que enseña                                                        | Formato                         | Además requiere |
| --- | ---------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------- | --------------- |
| 29  | Búsqueda binaria rigurosa                      | invariante de intervalo, desbordes y off-by-one, primera y última aparición | Detective de bugs · Traza-juego | #13             |
| 30  | Búsqueda binaria sobre la respuesta            | predicado monótono, espacio de respuestas                                   | Traza-juego                     | —               |
| 31  | Ordenamientos cuadráticos                      | ordenamiento por inserción, ordenamiento por selección, burbuja             | Visualizador · Duelo            | —               |
| 32  | Merge sort                                     | divide y vencerás, mezcla estable, recurrencia n log n                      | Visualizador · Duelo            | #9              |
| 33  | Quicksort                                      | partición, pivote aleatorio, tres vías                                      | Visualizador · Duelo            | —               |
| 34  | Montículo binario y cola de prioridad          | montículo, subir y bajar, construir en tiempo lineal                        | Visualizador                    | —               |
| 35  | Heapsort y el sort real de JavaScript          | heapsort, estabilidad, algoritmo híbrido                                    | Duelo                           | —               |
| 36  | Ordenar sin comparar y la cota n log n         | counting sort, radix sort, cota inferior de comparaciones                   | Visualizador · Duelo            | —               |
| 37  | Selección y top-k                              | quickselect, mediana, top-k con montículo                                   | Duelo                           | #33, #34        |
| 38  | Ordenar para resolver: intervalos y fusiones   | ordenar primero, fusionar intervalos, barrido de eventos                    | Traza-juego                     | —               |
| 39  | Checkpoint 2: horarios y simulación de eventos | cola de eventos, simulación discreta                                        | Propiedades y proyecto          | #34, #38        |

### Nivel 5: Árboles y estructuras jerárquicas (9 lecciones)

_Modelar jerarquías y consultar rangos de forma eficiente._

| #   | Lección                                               | Conceptos que enseña                                                         | Formato                          | Además requiere |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------- | --------------- |
| 40  | Árboles y recorridos                                  | raíz y hojas, preorden, inorden y postorden, recorrido por niveles           | Visualizador                     | #18, #19        |
| 41  | Árboles binarios de búsqueda                          | propiedad BST, inserción en un BST, borrado en un BST                        | Visualizador · Detective de bugs | —               |
| 42  | Balanceo y árboles AVL                                | altura, factor de balance, rotaciones                                        | Visualizador                     | —               |
| 43  | Tries y autocompletado                                | prefijo, trie, búsqueda por prefijo                                          | Visualizador · Duelo             | #21             |
| 44  | Union-Find                                            | conjuntos disjuntos, compresión de caminos, unión por rango                  | Visualizador                     | —               |
| 45  | Árbol de Fenwick                                      | suma de prefijos dinámica, bits bajos, actualización puntual                 | Visualizador · Duelo             | #25             |
| 46  | Árbol de segmentos                                    | consulta por rango, nodo agregado, actualización perezosa                    | Visualizador · Duelo             | —               |
| 47  | Árboles B y bases de datos _(opcional)_               | nodo con muchas claves, acceso a disco, índices                              | —                                | #42             |
| 48  | Checkpoint 3: autocompletado y estadísticas por tramo | integración de árboles, autocompletado con estadísticas, consultas por rango | Propiedades y proyecto           | #43, #46        |

### Nivel 6: Grafos (14 lecciones)

_Modelar redes y resolver rutas, dependencias, conectividad y capacidad._

| #   | Lección                                | Conceptos que enseña                                                 | Formato                    | Además requiere    |
| --- | -------------------------------------- | -------------------------------------------------------------------- | -------------------------- | ------------------ |
| 49  | Grafos: modelo y representaciones      | vértice, arista, lista y matriz de adyacencia                        | Visualizador               | #40                |
| 50  | Construir el grafo de Tesla Metro      | grafo ponderado, validación de datos                                 | Propiedades y proyecto     | #2                 |
| 51  | BFS: menos paradas                     | búsqueda en anchura, distancia en aristas, reconstrucción del camino | Visualizador · Traza-juego | #19                |
| 52  | DFS: conectividad y ciclos             | búsqueda en profundidad, componentes conexas, detección de ciclos    | Visualizador · Traza-juego | #18                |
| 53  | Orden topológico                       | grafo acíclico dirigido, algoritmo de Kahn, dependencias de obras    | Visualizador               | —                  |
| 54  | Dijkstra con montículo                 | relajación, distancia mínima, cola de prioridad                      | Visualizador · Duelo       | #34                |
| 55  | Bellman-Ford _(opcional)_              | pesos negativos, ciclo negativo, relajación repetida                 | Visualizador               | —                  |
| 56  | A* y heurísticas                       | heurística admisible, coste estimado, comparación con Dijkstra       | Visualizador · Duelo       | —                  |
| 57  | Floyd–Warshall                         | todos los pares, vértices intermedios                                | Visualizador               | —                  |
| 58  | Árbol de expansión mínima              | propiedad del corte, Kruskal, Prim                                   | Visualizador               | #44, #34           |
| 59  | Componentes fuertemente conexas        | grafo dirigido, Kosaraju, Tarjan                                     | Visualizador               | —                  |
| 60  | Flujo máximo y corte mínimo            | red de flujo, camino de aumento, Edmonds–Karp                        | Visualizador               | —                  |
| 61  | Emparejamiento bipartito _(opcional)_  | grafo bipartito, emparejamiento máximo, caminos alternantes          | —                          | #60                |
| 62  | Checkpoint 4: el planificador de rutas | integración de grafos, rutas con restricciones                       | Propiedades y proyecto     | #50, #54, #56, #53 |

### Nivel 7: Estrategias de diseño (12 lecciones)

_Elegir la técnica correcta según la estructura del problema._

| #   | Lección                                                  | Conceptos que enseña                                                                 | Formato                    | Además requiere |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------- | --------------- |
| 63  | Divide y vencerás y memoización                          | subproblemas, combinación, memoria de resultados                                     | Traza-juego                | #9              |
| 64  | Backtracking y poda                                      | árbol de decisiones, poda, permutaciones y N reinas                                  | Visualizador · Traza-juego | —               |
| 65  | Algoritmos voraces y su demostración                     | elección local, argumento de intercambio, selección de actividades                   | Traza-juego                | #38             |
| 66  | Huffman y compresión                                     | código de prefijo, árbol de Huffman, razón de compresión                             | Visualizador · Duelo       | #34, #65        |
| 67  | Programación dinámica I: recordar subproblemas           | subproblemas superpuestos, memoización, tabulación                                   | Visualizador · Traza-juego | #63             |
| 68  | Programación dinámica II: mochila y monedas              | mochila 0/1, cambio de monedas, reconstrucción de la solución                        | Visualizador · Traza-juego | —               |
| 69  | Programación dinámica III: secuencias                    | subsecuencia común más larga, subsecuencia creciente más larga, distancia de edición | Visualizador · Duelo       | —               |
| 70  | Programación dinámica IV: rejillas, intervalos y memoria | DP en rejillas, DP sobre intervalos, reducir memoria                                 | Traza-juego                | —               |
| 71  | Bits y aritmética modular                                | máscaras de bits, exponenciación rápida, MCD, criba de primos, BigInt                | Traza-juego                | —               |
| 72  | Aleatorización y estructuras probabilísticas             | Fisher–Yates, muestreo por reservorio, Monte Carlo, filtro de Bloom                  | Visualizador · Duelo       | #22             |
| 73  | Aproximación y heurísticas                               | aproximación, vecino más cercano, 2-opt, búsqueda local                              | Visualizador · Duelo       | #54             |
| 74  | Checkpoint 5: optimizar la red                           | integración de estrategias, presupuesto, recorrido de inspección                     | Propiedades y proyecto     | #68, #73, #58   |

### Nivel 8: Algoritmos en JavaScript real (8 lecciones)

_Aprovechar el lenguaje y el motor sin perder el control del rendimiento._

| #   | Lección                                                           | Conceptos que enseña                                                          | Formato           | Además requiere |
| --- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------- | --------------- |
| 75  | Iteradores, generadores y algoritmos perezosos                    | protocolo de iteración, generadores, helpers de iterador                      | Traza-juego       | —               |
| 76  | Elegir estructura nativa: Map, Set, arreglos y TypedArray         | métodos de conjuntos, arreglos tipados, agrupar y getOrInsert                 | Duelo             | #23             |
| 77  | Rendimiento en el motor: formas, arreglos densos y deoptimización | formas de objeto, arreglo denso y con huecos, deoptimización                  | Duelo             | #14             |
| 78  | Números y precisión                                               | punto flotante, suma precisa, enteros grandes y límites seguros, Float16Array | Detective de bugs | #71             |
| 79  | Cómputo pesado fuera del hilo principal                           | Web Workers, objetos transferibles, cancelación con AbortSignal               | Duelo             | —               |
| 80  | WebAssembly: cuándo compensa _(opcional)_                         | frontera JS–Wasm, memoria lineal, medición honesta                            | Duelo             | #79             |
| 81  | Datos grandes: flujos, páginas y memoria acotada                  | streams, iteración asíncrona, memoria acotada                                 | Duelo             | #75             |
| 82  | Perfilar y reproducir un benchmark                                | perfilador, gráfica de llamas, benchmark reproducible                         | Duelo             | #77             |

### Nivel 9: Dominio y entrega (5 lecciones)

_Cerrar con teoría, calidad, aplicaciones actuales y el proyecto final._

| #   | Lección                                                  | Conceptos que enseña                                       | Formato                                    | Además requiere |
| --- | -------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ | --------------- |
| 83  | Complejidad computacional: P, NP y reducciones           | P, NP, reducción, NP-completo                              | Visualizador                               | #7              |
| 84  | Pruebas por propiedades y fuzzing                        | propiedad, generador de casos, reducción de contraejemplos | Propiedades y proyecto · Detective de bugs | #3              |
| 85  | Algoritmos detrás de la IA: similitud, vecinos y ranking | similitud coseno, k vecinos, índice aproximado, BM25       | Visualizador · Duelo                       | #34, #72        |
| 86  | Resolver problemas nuevos y practicar con método         | patrones de problemas, plan de práctica, comunicación      | —                                          | —               |
| 87  | Proyecto final: Tesla Metro completo                     | entrega reproducible, informe de decisiones                | Propiedades y proyecto                     | #74, #84, #82   |

Las lecciones marcadas como opcionales no bloquean el avance.

## 6. Actualidad 2026 en JavaScript

Las nuevas lecciones usan JavaScript estándar, arreglos y números sin dependencias de terceros. El análisis distingue el modelo de capacidad de las garantías de ECMAScript y explica la resolución del reloj de la plataforma. [ECMAScript, colecciones indexadas](https://tc39.es/ecma262/multipage/indexed-collections.html#sec-array-objects) y [W3C, High Resolution Time](https://www.w3.org/TR/hr-time-3/).

El temario posterior contempla métodos de conjuntos, iteradores, arreglos tipados, Worker y WebAssembly. Al redactar cada lección se contrasta la especificación de su API, se comprueba el entorno real y se documenta una alternativa cuando la disponibilidad lo requiera.

## 7. Cobertura sin vacíos

| Nivel                | Teoría                                                    | Práctica                                  | Evaluación                                         |
| -------------------- | --------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------- |
| Análisis             | Crecimiento, cotas, recurrencias, amortizado, invariantes | Contar y cronometrar, informe de decisión | Predecir el coste, encontrar el invariante roto    |
| Estructuras lineales | Memoria, referencias, colisiones, expulsión               | Implementar cada estructura desde cero    | Comparar con la versión nativa y con un oráculo    |
| Buscar y ordenar     | Invariantes, divide y vencerás, cotas inferiores          | Implementar, visualizar y competir        | Casos límite, estabilidad, cuenta de comparaciones |
| Árboles              | Jerarquías, equilibrio, consultas por rango               | Implementar y consultar                   | Propiedad de la estructura tras cada operación     |
| Grafos               | Modelado, relajación, cortes, flujo                       | Construir el planificador                 | Rutas esperadas, ciclos y casos desconectados      |
| Estrategias          | Subestructura óptima, demostración voraz, poda            | Elegir y justificar la técnica            | Resolver con dos técnicas y comparar               |
| JavaScript real      | Motor, memoria, hilos                                     | Medir y optimizar                         | Benchmarks reproducibles                           |
| Dominio y entrega    | NP, propiedades, similitud y ranking                      | Proyecto final                            | Informe y pruebas por propiedades                  |

## 8. Integración en el repositorio y riesgos

1. **Edición vigente y archivo.** La edición JavaScript y la anterior mantienen sus identificadores y sus propios logros.
2. **Registro de conceptos:** cada concepto nuevo necesita su entrada con la lección que lo introduce.
3. **Revisión editorial:** el validador compara una huella del temario con `pedagogy-reviews.json`. Cambiar el temario exige que una persona lo revise y actualice ese registro; no debe falsificarse.
4. **Widgets nuevos:** visualizadores de ordenamiento, grafos y árboles, el «duelo» con contador de operaciones y el juego de traza. Los dos últimos se pueden reutilizar de Fundamentos.
5. **Pruebas:** cada widget y cada comprobador de ejercicios con prueba unitaria y de navegador.
6. **Tamaño:** 87 lecciones de calidad son mucho trabajo. Se propone entrega por niveles, publicando cada uno completo y verificado:
   - Tanda 1: Taller y Análisis (14 lecciones).
   - Tanda 2: Estructuras lineales (14).
   - Tanda 3: Buscar y ordenar (11).
   - Tanda 4: Árboles (9).
   - Tanda 5: Grafos (14).
   - Tanda 6: Estrategias (12).
   - Tanda 7: JavaScript real, Dominio y entrega (13).
7. **Riesgo principal:** que los visualizadores se conviertan en el cuello de botella. Se mitiga con un motor único de pasos (estado, paso siguiente, retroceso) reutilizado por todos.

El siguiente bloque previsto es Estructuras lineales y hash. La revisión docente independiente y el piloto con estudiantes quedan pendientes.
