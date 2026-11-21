# Algoritmia en JavaScript: ruta secuencial con proyecto acumulativo

Propuesta de diseño para sustituir la edición actual (pseudocódigo con laboratorio en Python). Es un plan para aprobar: todavía no hay lecciones escritas ni cambios en el repositorio.

## 1. Decisión y alcance

- **Lenguaje:** JavaScript puro, sin TypeScript, sin librerías y sin pasos de compilación. Los tipos, si hacen falta, se explican con JSDoc.
- **Requisito de entrada:** Fundamentos con JavaScript completo. La ruta no repite lo que ya enseña: contratos y fronteras, contar operaciones, búsqueda por mitades, ordenar con comparador, recursión sobre árboles y estrategias básicas. Pasa de **usar** esas ideas a **construir, demostrar y medir** cada algoritmo.
- **Secuencial:** 87 lecciones en 9 niveles. Cada una depende de la anterior y, cuando hace falta, de otras lecciones concretas (columna «Además requiere»).
- **Proyecto acumulativo:** Tesla Metro, el motor de rutas de una ciudad que crece lección a lección.
- **Entretenida y dinámica:** cada lección combina un visualizador, un juego de traza o un duelo de rendimiento con la implementación real.

## 2. Principios para no dejar vacíos

1. **Ningún símbolo ni término aparece sin explicarse antes con un ejemplo.** Primero el caso concreto, después la definición.
2. **Cada algoritmo se enseña con cuatro vistas:** intuición (visualizador), traza a mano, implementación en JavaScript y coste (medido y razonado).
3. **Se implementa antes de usar la versión nativa.** Se construye la lista enlazada antes de `Array`, la tabla hash antes de `Map`, el heap antes de la cola de prioridad. Después se compara con la nativa.
4. **Cada concepto tiene al menos una evaluación explicativa y una evaluativa**, como exige el validador del repositorio.
5. **Toda solución se prueba contra un oráculo** (la versión ingenua) y con casos límite generados al azar de forma reproducible.
6. **Los errores típicos forman parte del temario:** off-by-one, mutar mientras se recorre, comparar objetos por referencia, recursión sin caso base.
7. **Cada lección declara requisitos y conceptos nuevos.** El validador bloquea una lección que use algo no enseñado antes.

## 3. Cómo es una lección

Cinco pasos, igual que en Fundamentos, adaptados a algoritmos:

1. **Misión:** una necesidad concreta de Tesla Metro («los pasajeros esperan demasiado en la ventanilla»).
2. **Visualiza:** se interactúa con el algoritmo antes de leer código.
3. **Implementa:** se escribe en JavaScript con pistas progresivas y comprobación automática.
4. **Mide:** se cuenta operaciones y se compara contra otra solución.
5. **Integra y depura:** se entrega el incremento al proyecto y se resuelve una variante o un fallo.

**Formatos que la hacen dinámica** (columna «Formato» del temario):

| Marca | Formato                | Qué hace                                                                  |
| ----- | ---------------------- | ------------------------------------------------------------------------- |
| V     | Visualizador           | Se avanza un paso a la vez y se manipula la entrada.                      |
| D     | Duelo                  | Dos algoritmos compiten con un contador de operaciones y una gráfica.     |
| T     | Traza-juego            | Se predice cada paso antes de verlo.                                      |
| B     | Detective de bugs      | Un algoritmo casi correcto falla en un caso límite que hay que encontrar. |
| P     | Propiedades y proyecto | Pruebas con oráculo y entrega al proyecto acumulativo.                    |

Además: bitácora personal, logros por hitos de rendimiento (por ejemplo, «redujiste las operaciones de n² a n log n») y repaso espaciado con las rondas del Laboratorio.

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

Lo que la ruta enseña y cómo se mantiene al día:

- **ECMAScript 2026.** Según una fuente consultada (OpenReplay), la especificación se aprobó el 30 de junio de 2026 con siete novedades: `Array.fromAsync`, `Error.isError`, `Math.sumPrecise`, métodos base64 y hex de `Uint8Array`, `Iterator.concat`, acceso al texto fuente en `JSON.parse` y `getOrInsert` en `Map`/`WeakMap`. Otra fuente consultada contradice ese detalle (atribuye a ES2026 funciones que son de ediciones anteriores y da por cerrado Temporal), así que **hay que verificar cada función contra la especificación y MDN antes de publicar la lección**.
- **Funciones modernas que sí se usarán, con fecha de verificación y alternativa:** métodos de conjuntos de `Set`, helpers de iterador, `toSorted`/`toSpliced`/`with`, `Object.groupBy`/`Map.groupBy`, `structuredClone`, `Math.sumPrecise` (precisión numérica), `Map.prototype.getOrInsert` (grafos y memoización), `BigInt`, arreglos tipados y `Float16Array`.
- **Plataforma:** Web Workers, objetos transferibles, `AbortSignal`, iteración asíncrona, `performance.now` y `performance.measure`, perfilador y gráfica de llamas de las DevTools.
- **Qué NO se enseña:** código dependiente de una librería, TypeScript, ni funciones sin soporte amplio sin su alternativa.
- **Mantenimiento:** cada lección referencia sus tecnologías en el registro de vigencia del repositorio, con fecha de revisión.

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

1. **Edición nueva, no reemplazo:** igual que Fundamentos, la edición actual (12 lecciones en pseudocódigo) pasa a ser _legacy_ y la nueva se registra como edición vigente.
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

## 9. Decisiones que necesitan aprobación

1. ¿Aprobar **Tesla Metro** como hilo conductor?
2. ¿Mantener como opcionales Árboles B, Bellman-Ford, Emparejamiento bipartito y WebAssembly?
3. ¿Empezar por la Tanda 1 y publicar cada nivel cuando esté completo?
