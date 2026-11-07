# Plan integral de mejora de TeslaCode

Fecha: 7 de noviembre de 2026. Estado: **en implementación por módulos**. El [registro de implementación](implementation-status.md) distingue el primer lote entregado de los puntos pendientes. Las cifras del diagnóstico se conservan como línea base.

Parte del [diagnóstico contrastado](diagnostico-plataforma.md), la [auditoría conceptual](pedagogical-audit.md) y la [dirección de producto acordada](product-direction.md). Este documento guarda decisiones recomendadas, prioridades, dependencias y condiciones de cierre. No sustituye las reglas vigentes ni autoriza por sí mismo cambios de licencia.

## Resultado buscado y acuerdos que se conservan

Una persona debe poder elegir una ruta, conocer qué aprenderá y qué necesita, recibir apoyo puntual, practicar de forma progresiva y terminar un proyecto comprobable. Un principiante necesita explicaciones suficientes; alguien con experiencia necesita demostrar lo que sabe sin volver a cursar otras especialidades.

- Todas las rutas conservan entrada libre.
- La ruta propia de Python cuenta con el respaldo del usuario como dirección de desarrollo. Debe usar tecnologías soportadas y prácticas vigentes; el temario detallado y su implementación siguen pendientes.
- Requisito obligatorio del usuario: ninguna lección que utilice un lenguaje puede presuponer que la persona ya lo conoce o ha programado. Todo conocimiento necesario se enseña previamente en el recorrido o se explica y practica en el punto de uso.
- Dentro del recorrido elegido se mantiene la progresión con práctica y comprobación. Declarar experiencia no otorga completitud ni XP.
- Se distinguen contenido disponible, planificado, tronco principal y profundización.
- Se preservan IDs, enlaces, progreso y recompensas existentes durante migraciones.
- La apariencia acordada se mantiene; el movimiento acompaña la comprensión y puede detenerse.
- Se mantienen módulos ES, separación de dominio/presentación y carga diferida. No se propone cambiar de framework ni añadir servicios sin necesidad.
- Las ideas de Platzi y roadmap.sh se aplican como recorridos con objetivos, proyectos y mapas de conocimientos. Los textos, ejercicios e ilustraciones requieren autoría o permisos propios.

## Secuencia de trabajo

| Fase                            | Entregable                                                                                                         | Dependencias                                                          | Condición para cerrar                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P0 — Veracidad y base           | Corregir promesas, registrar inventario, preparar decisiones de licencias/procedencia y facilitar desarrollo.      | Diagnóstico guardado.                                                 | Catálogo y documentación describen capacidades reales; decisiones pendientes identificadas sin atribuir permisos inexistentes. |
| P1 — Diseño curricular          | Separar secuencia/requisitos/acceso; revisar seis mapas; diseñar unidades compartidas de Python.                   | P0 para línea base.                                                   | Cada relación académica tiene justificación; no hay ciclos ni requisitos posteriores; entradas y progreso siguen funcionando.  |
| P2 — Práctica y continuidad     | Mejorar las siete lecciones de Algoritmia, publicar Análisis 8–12 y entregar ejecución Python inicial.             | P1; prototipo del motor puede investigarse en paralelo.               | Recorrido conceptual → implementación → análisis verificable, con ejercicios de producción y evaluación editorial.             |
| P3 — Aprendizaje y recuperación | Piloto con personas, revisión docente, mejora de devolución, respaldo restaurable y repaso.                        | Primer recorrido de P2; restauración puede desarrollarse antes.       | Fallos graves del piloto corregidos; restaurar un respaldo no pierde logros ni duplica XP.                                     |
| P4 — Recorridos completos       | Completar Algoritmia y publicar Python como recorrido propio; desarrollar módulos integradores en las demás rutas. | Patrón editorial y motor validados en P2/P3.                          | Cada módulo termina en una tarea comprobable; no hay saltos a temas sin sus apoyos.                                            |
| P5 — Mantenimiento continuo     | Auditoría CSS, recursos optimizados, revisión de actualidad, ampliaciones avanzadas.                               | Medición inicial; limpieza técnica puede avanzar sin esperar todo P4. | Cambios demostrados por medición y regresiones; contenido actualizado según su riesgo de obsolescencia.                        |

No se fijan fechas de terminación de 253 temas sin medir primero redacción, revisión y pruebas de un módulo. Después de P2/P3 se estimará capacidad con trabajo real. Las fases son hitos de entrega, no una obligación de paralelizar todas las especialidades.

## P0. Ajustar promesas y reducir fricción

- **P0.1 — Disponibilidad:** generar o verificar los conteos desde los mapas, mostrar el siguiente módulo disponible y explicar el punto donde acaba cada recorrido. Sustituir «Fundamentos completo» por «68 lecciones publicadas» cuando se hable de cobertura. Revisar «Experto» y resultados prometidos contra las actividades que los demuestran.
- **P0.2 — Lenguaje:** presentar Algoritmia como «Pseudocódigo y Python». JavaScript queda como propuesta posterior, condicionada a ejemplos, explicaciones, ejercicios y pruebas equivalentes.
- **P0.3 — Desarrollo:** documentar selección de Node admitido antes de `npm ci`, errores frecuentes y dos recorridos de verificación: `npm run check` para contenido/dominio y suite completa con Python/Chromium. Ya existe la comprobación rápida; mejorar su descubrimiento. Evaluar Node 22 solo si hay necesidad y compatibilidad probada, contrastando soporte oficial en ese momento.
- **P0.4 — Licencias:** preparar para el titular una propuesta de MIT para código y CC BY 4.0 para contenido; comparar CC BY-SA 4.0 si se quiere exigir compartir adaptaciones. Inventariar dependencias y excepciones para marca/imágenes. La elección requiere decisión expresa del titular; no se añade una licencia por inferencia.
- **P0.5 — Procedencia visual:** registrar quién aportó la referencia, herramienta/condiciones conocidas, transformaciones y permisos disponibles. Si no puede establecerse su reutilización, preparar una alternativa con procedencia documentada. No afirmar que «generado por IA» resuelve esa comprobación.

Los asuntos de licencia/procedencia se tramitan desde el principio y no impiden mejorar currículo o práctica. Sí deben resolverse antes de presentar el material como reutilizable bajo una licencia determinada.

## P1. Separar el recorrido del grafo de conocimientos

Hoy `dependsOn` participa tanto en el grafo académico como en el bloqueo interno. Corregir sus relaciones sin separar responsabilidades podría desbloquear accidentalmente pasos intermedios. La migración debe definir tres piezas distintas:

1. **Orden didáctico:** el itinerario recomendado y sus pasos obligatorios dentro de la ruta.
2. **Requisitos conceptuales:** los conocimientos utilizados y dónde se enseñan o repasan.
3. **Acceso:** publicación, progresión propia, ramas opcionales y conservación del progreso.

El mapa visual debe distinguir una conexión de conocimiento de una línea del itinerario. No dibujar el grafo académico copiando la posición de las tarjetas.

| Tema              | Requisitos que deben contrastarse                                                                         | Dependencia que no debe imponerse solo por posición |
| ----------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Tablas hash       | Claves/valores, arreglos, función hash, igualdad y colisiones, enseñados antes o en la propia unidad.     | Colas como condición académica general.             |
| Grafos            | Conjuntos de vértices/aristas y representación con listas o matrices; explicar cada representación usada. | Tries o árboles de segmentos.                       |
| BFS               | Representación de grafos, visitados y cola FIFO.                                                          | Solo «la lección anterior».                         |
| DFS               | Representación, visitados y pila o recursión según implementación.                                        | Exigir cola FIFO por imitación de BFS.              |
| Dijkstra con heap | Grafos ponderados, relajación, pesos no negativos y cola de prioridad.                                    | Dominio de todos los algoritmos de caminos mínimos. |
| Kruskal           | Grafo ponderado no dirigido, ordenamiento, ciclos y conjuntos disjuntos/union-find.                       | Dijkstra como requisito artificial.                 |

La tabla describe la implementación elegida: Dijkstra también tiene versiones sin heap. Los requisitos deben corresponder al ejemplo concreto. Si union-find se enseña en la misma lección que Kruskal, tiene que aparecer y practicarse antes de usarlo; si resulta demasiado denso, separar unidades.

**Entregables de P1:**

- Auditar las 343 entradas de los seis mapas, con explicación breve de por qué cada requisito se necesita. Revisar también requisitos ausentes, no solo enlaces sobrantes.
- Comprobar cada concepto en explicación, ejemplo, práctica y evaluación; los conocimientos nuevos se enseñan en la unidad o remiten a un apoyo suficiente.
- Añadir validaciones de referencias, ciclos, disponibilidad, orden y correspondencia entre fuentes canónicas y vistas reutilizadas.
- Añadir regresiones para los casos concretos detectados; no presentar una lista de excepciones codificadas como un detector semántico universal.
- Migrar el dominio de acceso y verificar catálogo, búsqueda, enlaces directos, ramas y perfiles nuevos/antiguos.
- Mantener revisión humana de pertinencia. Una justificación escrita o una huella tampoco demuestra que una dependencia sea correcta.

## Python como ruta y como apoyo

**Dirección respaldada por el usuario:** crear un recorrido propio de Python mediante unidades compartidas, una vez que pueda ofrecer un primer módulo coherente. No añadir de inmediato otro mapa vacío ni duplicar las 68 lecciones de Fundamentos. Su actualización continua y la enseñanza sin experiencia previa son condiciones obligatorias.

| Bloque                | Objetivo                                                                                                                                   | Papel en Algoritmia                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Python esencial       | Ejecución, variables/tipos, comparaciones, booleanos, listas/índices, `if`, `for`/`while`, funciones/parámetros/retorno y errores básicos. | Puente breve y contextual para comenzar a implementar. |
| Programas mantenibles | Colecciones y mutabilidad, módulos, archivos, excepciones, depuración y pruebas.                                                           | Se incorpora cuando el problema lo necesita.           |
| Desarrollo con Python | Entornos y paquetes, anotaciones de tipos, objetos/composición, calidad y proyecto.                                                        | Profundización; no requisito de entrada a Algoritmia.  |

La recursión algorítmica requiere funciones y traza de llamadas; debe enseñarse y practicarse antes de analizar su coste. No exigir al principiante completar objetos o todo el lenguaje para llegar a ella.

### Profundidad y secuencia exigidas para Python

El usuario exige un temario y lecciones completos, actuales y secuenciales. Esto se convierte en criterio de aceptación editorial: no publicar una colección de introducciones breves como si constituyera una formación completa. El alcance será programación general con Python desde cero hasta construir, probar y mantener proyectos; web, datos e IA tendrán conexiones a sus especialidades.

La estructura inicial que debe desarrollarse y contrastarse por lección es:

1. **Primer contacto:** archivos, carpetas, editor, ejecución, salida y lectura de errores; instrucciones comprobadas para cada entorno admitido.
2. **Datos y expresiones:** valores, nombres, asignación, tipos, números, booleanos, `None`, cadenas, operadores, conversiones y entrada/salida.
3. **Control del programa:** condiciones, lógica, repetición, trazas, contadores, acumuladores y terminación; introducir las colecciones mínimas antes de recorrerlas.
4. **Colecciones:** listas, tuplas, diccionarios, conjuntos, índices, recorridos, referencias, mutabilidad y copias; comprensiones después de ciclos equivalentes.
5. **Funciones:** parámetros, argumentos, retorno, alcance, contratos, composición de funciones y recursión gradual; errores frecuentes con valores mutables.
6. **Programas con varios archivos y datos persistentes:** módulos, importación, biblioteca estándar, rutas, archivos, codificación, JSON/CSV, excepciones y manejo de recursos. Introducir cada herramienta antes de usarla.
7. **Pruebas y depuración:** aserciones, casos normales y límite, pruebas unitarias, diagnóstico y refactorización. Comprobar código desde las primeras unidades; aquí se sistematiza la técnica.
8. **Entorno y calidad de proyecto:** entornos virtuales, dependencias, configuración con `pyproject.toml`, anotaciones de tipos, formato y análisis estático. Cualquier herramienta externa se instala y explica antes de exigirla.
9. **Modelado con objetos:** clases, instancias, métodos, composición, herencia cuando aporte valor y clases de datos; enseñar antes la sintaxis y efectos de las anotaciones o decoradores utilizados.
10. **Mecanismos del lenguaje:** iterables, iteradores, generadores, funciones como valores, cierres, decoradores y gestores de contexto, con sus requisitos en orden.
11. **Integración y ejecución concurrente:** conceptos de HTTP/API antes de sus clientes, tiempos de espera, errores, tareas de E/S, hilos/procesos y asincronía; límites y elección según el problema.
12. **Proyecto integrador:** aplicación reproducible con entradas, persistencia, validación, pruebas, documentación, gestión de dependencias y entrega; explicar antes cualquier herramienta añadida.

Estos bloques son un alcance de diseño, no un catálogo de lecciones ya redactadas ni una afirmación de compatibilidad de herramientas. Al desglosarlos, cada lección debe registrar conocimientos necesarios, conceptos nuevos, práctica y resultado observable. Un requisito debe estar enseñado y practicado antes de su uso; las relaciones no se obtienen copiando automáticamente la lección anterior.

Cada unidad necesita explicaciones suficientes, varios ejemplos cuando haya comportamientos distintos, errores comunes, casos límite, ejercicios guiados y una aplicación autónoma alineada. Cada módulo terminará en una tarea integradora y una revisión de dependencias con el siguiente. Si acumula demasiadas novedades, dividirlo conservando continuidad. La extensión y el número de lecciones se ajustan a esos objetivos, sin rellenar para alcanzar un conteo.

Inventariar y extraer unidades canónicas desde Fundamentos sin romper sus URLs. Compartir definiciones, ejemplos y apoyos, conservando objetivos y ejercicios propios de cada ruta. Un contenido compartido no debe otorgar XP duplicado. Guardar la procedencia de cualquier evidencia reutilizada.

Con el acuerdo actual, quien conoce un tema puede entrar directamente a su práctica y comprobación. La propuesta externa de saltar lecciones por progreso previo queda como **decisión de producto pendiente**: si se adopta reconocimiento entre rutas, debe vincular objetivos equivalentes y evidencia versionada. Haber leído Python no acredita haber diseñado o analizado un algoritmo.

### Algoritmia independiente del lenguaje

Es posible enseñar toda la teoría de algoritmos con pseudocódigo: diseño, estructuras de datos, corrección, terminación y complejidad. Python o JavaScript no son requisitos de la disciplina. Sí hace falta implementación ejecutable para evaluar objetivos de programación, depuración y comportamiento de un programa real.

La modalidad recomendada es un núcleo de Algoritmia comprensible y practicable íntegramente en pseudocódigo, acompañado por laboratorios Python guiados desde cero. Se propone que esos laboratorios sean una rama complementaria: los objetivos algorítmicos se comprueban en el núcleo y los de implementación se registran con evidencia propia. Completar el núcleo no acredita automáticamente competencia de programación. Esta modalidad es una propuesta de diseño, no un cambio ya realizado en el acceso.

El núcleo conservaría su secuencia obligatoria; la rama de implementación tendría sus propios requisitos y comprobaciones. No se conceden finalizaciones ficticias por omitir laboratorios. Antes de migrar se deben reclasificar los objetivos de las lecciones actuales, preservar el progreso y adaptar las pruebas de acceso.

El pseudocódigo también requiere enseñanza. Definir una notación coherente para asignación, comparación, índices, intervalos, condiciones, ciclos, funciones, retorno y colecciones. Explicar cada construcción antes de usarla y mantenerla estable en todas las rutas. Los estudiantes deben diseñar pasos, trazar estados, depurar soluciones y resolver variantes; no limitarse a leer pseudocódigo ni responder sí/no.

Para pruebas de corrección o complejidad, especificar el modelo de coste y las operaciones primitivas. No esconder trabajo dentro de una instrucción como «ordena los datos» y después contarla como una operación constante.

### Condiciones obligatorias para cualquier ejemplo de código

1. Identificar cada concepto, símbolo, operación y herramienta utilizada. Deben estar enseñados y practicados en el propio recorrido o introducirse con apoyo suficiente en la unidad; completar otra ruta no es la única ayuda permitida.
2. Presentar problema, entradas, resultado, condiciones y solución en pasos antes de traducir al lenguaje.
3. Explicar la traducción instrucción por instrucción cuando sea la primera aparición, incluida sangría, signos, índices y diferencia entre salida y retorno.
4. Enseñar cómo ejecutar, qué resultado esperar y cómo interpretar errores. Si se usa una terminal, un archivo o una instalación, explicar también esas herramientas.
5. Incluir una traza y cambios guiados antes de pedir una solución autónoma. Los errores y variantes no pueden exigir sintaxis todavía no presentada.
6. Mantener los apoyos disponibles en contexto para quien ingresa directamente o regresa después de un tiempo. Un enlace o glosario por sí solo no demuestra suficiencia.
7. Comprobar con principiantes la claridad de la explicación. Si necesita conocimientos ausentes, corregir la secuencia o dividir la unidad antes de ampliar el temario.

### Vigencia de la ruta Python

- Usar Python 3 estable y soportado; contrastar el calendario, notas de versión y documentación oficiales al elegir la versión. No fijar ahora una supuesta «última versión» basándose solo en los archivos del proyecto.
- Elegir una base coherente con el ejecutor del navegador y el entorno local. Pyodide puede incorporar una versión diferente de la última de CPython: documentar la diferencia, comprobar compatibilidad y no enseñar características ausentes del entorno de práctica.
- Enseñar herramientas y prácticas vigentes según necesidad: entornos virtuales, instalación de paquetes dentro del entorno, organización con `pyproject.toml` cuando corresponda, pruebas y anotaciones de tipos explicadas. No añadir herramientas nuevas solo por novedad ni exigirlas para el primer programa.
- No recomendar Python 2, módulos retirados, APIs deprecadas ni procedimientos de instalación abandonados. Si aparece un ejemplo histórico, identificarlo expresamente y mostrar su alternativa actual.
- Mantener registro de fuentes, versiones realmente probadas y fecha de revisión por unidad. Ejecutar ejemplos y ejercicios en las versiones declaradas; atender advertencias de deprecación y cambios de dependencias.
- Integrar esta ruta en la [política de actualidad](technology-currency.md): revisiones periódicas y revisión adicional ante cambios de soporte, seguridad o API. Una alerta inicia trabajo editorial, no renueva automáticamente las fechas.
- Distinguir conceptos duraderos de herramientas que cambian. Un ciclo, una función o un algoritmo clásico no se vuelve obsoleto por ser antiguo.

La condición verificable es no publicar recomendaciones conocidas como obsoletas, y corregir las detectadas mediante revisión continua. No se atribuye una garantía de que ninguna tecnología cambiará en el futuro.

## P2. Primer recorrido de Algoritmia que permite construir

Antes de ampliar temas avanzados, mejorar las siete lecciones publicadas y cerrar el módulo siguiente. Cada unidad necesita un objetivo observable, explicación gradual, ejemplo razonado, supuestos, errores frecuentes, fuentes pertinentes y práctica alineada.

Las posiciones de la tabla siguiente describen el contenido actual. Con la modalidad propuesta, funciones y recursión se explicarán primero en pseudocódigo; su traducción y las tareas Python pasarán a los laboratorios complementarios. El núcleo ofrecerá tareas algorítmicas equivalentes, mientras que los objetivos de implementación exigirán ejecutar código. Esta separación debe resolverse antes de modificar reglas de acceso o anunciar un recorrido totalmente independiente de Python.

La secuencia de práctica será: predecir/trazar → completar/modificar → construir/depurar con una entrada nueva. Se propone usar esas tres formas por unidad o por conjunto breve de unidades cuando una lección sea muy pequeña. La exigencia se adapta al objetivo; ni contar palabras ni añadir tres preguntas casi iguales demuestra profundidad.

| Posición actual | Entregable editorial                                                                                                         | Evidencia de aprendizaje                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1–4             | Consolidar problema, método, pseudocódigo y traza; explicar números negativos, listas vacías y contratos cuando se utilicen. | Diseñar pasos para un problema nuevo, trazar estados y encontrar un contraejemplo.              |
| 5               | Puente Python reutilizable con cambios guiados y fallos de sangría/índices.                                                  | Escribir una función a partir de los pasos y corregir un error con ayuda decreciente.           |
| 6               | Consolidar funciones antes de recursión; dividir si el piloto revela exceso de carga.                                        | Trazar llamadas y retornos, explicar caso base/progreso y reparar una recursión que no termina. |
| 7               | Rehacer «Medir tiempo y memoria» con fuentes y código reproducible.                                                          | Comparar conteos y espacio auxiliar; distinguir observación empírica de prueba de complejidad.  |
| 8               | Funciones, potencias y logaritmos desde ejemplos y tablas.                                                                   | Explicar duplicación y división sucesiva sin presuponer matemáticas no enseñadas.               |
| 9               | Big O, Ω y Θ, tamaño de entrada y modelo de coste.                                                                           | Justificar una cota y distinguirla de mejor/promedio/peor caso.                                 |
| 10              | Conteo en ciclos y recursión: sumar trabajo, anidamiento y profundidad.                                                      | Derivar costes sencillos sin asumir que todo bucle anidado es cuadrático.                       |
| 11              | Contraejemplos, afirmaciones e inducción.                                                                                    | Distinguir comprobar varios casos de demostrar una propiedad.                                   |
| 12              | Pre/postcondiciones, invariantes y terminación.                                                                              | Justificar inicialización, mantenimiento y conclusión en un algoritmo trabajado.                |

El teorema maestro se ubicará después de recurrencias e inducción, como profundización si el módulo inicial no alcanza a justificarlo. No debe aparecer como requisito de la primera explicación de inducción. Si se reordena o divide contenido, actualizar mapa, enlaces y migración conservando evidencia anterior.

Cerrar con una práctica integradora de búsqueda del máximo y comparación de estrategias: contrato, implementación, casos normales/límite, justificación y coste. Distinguir el coste de operaciones Python como cortes, copias, `list.pop(0)`, `dict` o `sorted` del modelo abstracto. Un builtin puede ser apropiado en un programa real, pero no reemplaza implementar la técnica cuando ese es el objetivo.

### Motor de práctica Python

Prototipar Pyodide cargado bajo demanda. Compararlo con la alternativa local por tamaño, compatibilidad, tiempo de inicio y uso móvil antes de fijar versión o presupuesto. El objetivo inicial es Python de biblioteca estándar suficiente para los ejercicios, no un IDE completo.

- Editor accesible, ejecutar/detener/reiniciar, entradas definidas y resultados con mensaje esperado/obtenido.
- Worker terminable para evitar bloquear la interfaz, límite de tiempo y salida, cancelación al navegar y descarte de respuestas de ejecuciones anteriores.
- Aislamiento y comunicación explícitos: un Worker por sí solo no impide acceso a red ni sustituye una frontera de seguridad. Revisar origen, CSP, API expuesta, almacenamiento y dependencias. No ofrecer acceso a secretos.
- Casos normales, límites y entradas inválidas según contrato; aceptar soluciones equivalentes y probar que una respuesta constante no supera los casos.
- Estado de carga, descarga fallida y reintento. Alternativa local con los mismos casos; aclarar qué pudo comprobarse y qué no.
- Borradores guardados y compatibilidad entre versión del ejercicio, soluciones y progreso.
- Contrato de ejecutor separado de la vista y del corrector; ampliar `mountActivities` y validación de contenido con un tipo de ejercicio de código.

Los tests del autor y los tests del código del estudiante son responsabilidades distintas. Los casos y resultados en el cliente sirven para aprender; no son una certificación resistente a manipulación. El rendimiento en WebAssembly/dispositivos distintos no se presentará como benchmark universal.

**Aceptación técnica:** ejecución correcta, error sintáctico, excepción, bucle infinito detenido, salida excesiva, fallo de descarga, reinicio, navegación durante ejecución, teclado y móvil. Probar también un ejercicio con múltiples soluciones válidas.

## P3. Comprobar aprendizaje y cuidar el progreso

- **P3.1 — Revisión editorial independiente:** buscar una revisión de programación/algoritmos y otra pedagógica. Registrar persona, alcance, problemas encontrados y correcciones; no atribuir revisión externa hasta obtenerla.
- **P3.2 — Piloto:** propuesta inicial de 6–8 participantes con perfiles de principiante, experiencia en otro lenguaje y experiencia en Python. Observar dónde se detienen, qué términos necesitan explicación y si resuelven una variante sin copiar. Es una muestra cualitativa, no una validación estadística.
- **P3.3 — Retención:** repetir una tarea equivalente después de 7–14 días, si los participantes aceptan. Contrastar con el desempeño inicial y revisar explicaciones y práctica.
- **P3.4 — Devolución:** pistas escalonadas, mensajes por tipo de error y posibilidad de explicar el razonamiento. Diferenciar resultado incorrecto, contrato incumplido y sintaxis.
- **P3.5 — Recuperación:** importar el JSON exportado con validación de esquema, tamaño y versión; vista previa; respaldo del estado actual; política de combinación/reemplazo clara. Recalcular recompensas de manera idempotente y rechazar datos corruptos.
- **P3.6 — Motivación:** metas cortas, proyectos acumulativos y repasos de conceptos débiles; medir transferencia y regreso voluntario, no solo XP o rachas. Evitar penalizaciones que conviertan un día sin estudiar en pérdida de aprendizaje.

No se envían invitaciones ni se recopilan datos de participantes al guardar el plan. Cuando se organice el piloto, explicar el uso de sus respuestas y recoger solo la información necesaria. La plataforma seguirá pudiendo usarse sin cuenta.

## P4. Completar el catálogo por resultados

Algoritmia será el primer recorrido de especialidad que se complete: después de Análisis, estructuras lineales → búsqueda/ordenamiento → árboles/montículos → grafos → estrategias → proyecto. Cada bloque debe incluir problemas, implementación, pruebas y límites de aplicación.

Las demás rutas avanzarán por módulos terminados, evitando publicar únicamente introducciones aisladas. La siguiente tabla indica resultados prioritarios; sus requisitos pueden ocupar varios niveles actuales y deben explicarse antes del proyecto.

| Ruta           | Primer resultado integrador que se propone completar                                                                                                   | Siguiente alcance                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Fundamentos    | Revisión de las 68 publicadas, empezando por listas, funciones, recursión, errores y proyectos; comprobar que alguien pueda crear un programa pequeño. | Distinguir base esencial de diseño/ingeniería avanzada sin eliminar contenido ni logros.                                    |
| Python         | Primer programa → funciones y colecciones → programa probado; reutilizar unidades existentes.                                                          | Archivos/errores/módulos, entorno y proyecto completo.                                                                      |
| Frontend       | Sitio semántico, accesible y adaptable que se publica; práctica real en navegador.                                                                     | JavaScript/TypeScript antes de React, interacción, pruebas y calidad.                                                       |
| Bases de datos | Modelo, restricciones y consultas SQL sobre un conjunto reproducible.                                                                                  | Joins, transacciones, índices y operación. Explicar las diferencias si el laboratorio usa SQLite y el curso PostgreSQL.     |
| Backend        | API con validación, contrato, pruebas y persistencia, avanzando por los prerrequisitos necesarios.                                                     | Identidad, seguridad, observabilidad y despliegue. Node/TypeScript como camino principal coherente; alternativas señaladas. |
| IA             | Evaluar una aplicación pequeña con un conjunto de casos, distinguiendo simulación, modelo local y API.                                                 | Aplicaciones/LLM, fundamentos de modelos, difusión y conceptos como recorridos relacionados con requisitos explícitos.      |

Para Frontend puede emplearse una vista previa aislada; para SQL, un motor local apropiado o entorno externo reproducible. Una simulación HTTP no equivale a ejecutar un servidor Backend real. Elegir el entorno de práctica por resultado y plataforma, sin forzar todo dentro de Pyodide.

En IA, explicar Python, datos, matemáticas o APIs antes de utilizarlos. Enseñar LLM, difusión e IA generativa con evaluación, costes, límites y seguridad. Mantener la distinción entre Modelado de Conceptos Siguientes (NCM, en la conversación) y la familia LCM citada; no anunciar una sustitución universal de LLM ni tratar investigación emergente como estándar consolidado. Cualquier API con credenciales requiere manejo adecuado de secretos, no claves incrustadas en el sitio.

Los 253 temas pendientes permanecen en el inventario. Si un tema se divide, fusiona o cambia de carácter, registrar equivalencia y motivo; no mejorar el porcentaje eliminando temas sin explicarlo. Las revisiones técnicas deben contrastar fuentes y versiones oficiales al publicar, aprovechando la política existente.

## P5. Ampliaciones y mantenimiento

### Algoritmos de profundización

| Ampliación                      | Preparación necesaria                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| Floyd-Warshall                  | Grafos ponderados, matrices, caminos mínimos y programación dinámica; ciclos negativos. |
| Componentes fuertemente conexas | Grafos dirigidos y DFS; orden de finalización y/o pila según algoritmo.                 |
| Flujo máximo                    | Redes con capacidades, grafos residuales, caminos aumentantes y conservación de flujo.  |
| KMP                             | Cadenas, prefijos/sufijos y justificación de la función de prefijo.                     |
| Rabin-Karp                      | Cadenas, hashing rodante, aritmética modular y verificación de colisiones.              |
| Árboles de Fenwick              | Sumas de prefijos, consultas/actualizaciones y operaciones de bits.                     |

No bloquean el núcleo inicial. Confirmar que su profundidad y ubicación responden al público objetivo antes de incrementar el catálogo.

### CSS, imágenes y calidad técnica

- Medir cobertura CSS en inicio, rutas, lecciones, laboratorios, progreso y estados de error; incluir ambos temas, móvil, teclado y movimiento reducido. Ausencia en una captura no demuestra que una regla esté muerta.
- Inventariar selectores repetidos, especificidad, overrides y tokens. Refactorizar por componente después de capturar referencias visuales; conservar estilos de estados dinámicos.
- Medir carga real, recursos transferidos y respuesta en un móvil representativo. Separar peso del checkout, historial Git y transferencia al navegador.
- Conservar WebP de entrega. Evaluar mover PNG maestros a un paquete de recursos recuperable con enlace/versionado/checksum; no borrarlos sin alternativa ni reescribir el historial como primera medida.
- Mantener pruebas apropiadas a cada cambio: dominio y migraciones, contratos del ejecutor, ejemplos, navegador y revisión visual. Un cambio documental no exige ejecutar toda la batería de navegadores.
- Revisar por tecnología y riesgo de cambio: fundamentos estables frente a SDKs, APIs y modelos. Las alertas de actualidad deben iniciar una revisión, no renovar fechas automáticamente.

## Criterio editorial para contenido nuevo y revisado

Antes de publicar, comprobar objetivo observable; requisitos reales; vocabulario y símbolos introducidos; ejemplo con razonamiento y contrato; práctica guiada y autónoma; casos límite/errores; evaluación alineada; fuentes pertinentes; ejecución reproducible cuando haya código; accesibilidad y revisión registrada.

Toda lección técnica debe tener referencias que respalden sus afirmaciones. Una actividad original puede declarar su autoría y relacionarse con las fuentes de la unidad. Revisar fuentes de las 90 publicadas en lotes, sin añadir enlaces decorativos para alcanzar un porcentaje.

Las automatizaciones controlan estructura y regresiones conocidas. La revisión editorial comprueba suficiencia y precisión; los pilotos aportan evidencia de comprensión. Ninguna de las tres sustituye a las otras.

## Seguimiento, responsabilidades y próximas decisiones

| Evidencia    | Línea base                              | Qué se usará para valorar mejora                                                          |
| ------------ | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| Publicación  | 90/343; Algoritmia 7/44                 | Módulos completos, alcance declarado y proyectos realizables.                             |
| Práctica     | Una actividad textual por lección       | Tareas de construcción/depuración y solución de variantes.                                |
| Fuentes      | 33/90 con `sources`                     | Fuentes revisadas y pertinentes, no solo enlaces presentes.                               |
| Dependencias | Relaciones artificiales confirmadas     | Revisión de seis mapas con justificaciones y casos de regresión.                          |
| Aprendizaje  | Sin piloto independiente                | Bloqueos observados, transferencia y retención; sin prometer resultados antes del piloto. |
| Recuperación | Exportación sin importación             | Respaldo restaurado y migración comprobada sin duplicar recompensas.                      |
| Recursos/CSS | 4.567 líneas y 285 KiB de imágenes WebP | Cambios medidos con conservación visual y funcional.                                      |

El desarrollo mantiene dominio, motor, migraciones y pruebas. La edición mantiene secuencia, explicaciones, ejercicios y fuentes. La revisión independiente contrasta aprendizaje y exactitud. El titular resuelve licencias y procedencia y decide si cambia la política de acreditación. Estas son responsabilidades propuestas; aún no se han asignado personas adicionales.

Decisiones pendientes que no bloquean el plan: licencia definitiva; documentación de derechos; reconocimiento de objetivos entre rutas; alcance editorial inicial de Python y elección final del ejecutor tras el prototipo.

Para contrastar nuevas observaciones, añadir un registro con ID, fecha, evidencia, estado (confirmado/hipótesis/decisión), efecto en fases y criterio de cierre. Conservar la referencia al diagnóstico original. Un hallazgo solo pasa a resuelto con cambios y verificación; una propuesta guardada permanece pendiente.

### Primer lote de implementación recomendado

1. Alinear la descripción de Algoritmia y el estado real del catálogo.
2. Separar el orden obligatorio del grafo académico y corregir los requisitos reales, con migración y pruebas.
3. Diseñar el puente Python compartido y mejorar las actividades de las siete lecciones actuales.
4. Entregar el prototipo de ejecución y validar sus límites antes de integrarlo al progreso.
5. Publicar Análisis 8–12 con ejemplos, fuentes y prácticas; revisar ubicación del teorema maestro.
6. Hacer revisión independiente y piloto; corregir sus hallazgos antes de replicar el patrón en nuevas especialidades.

Licencias/procedencia, documentación de desarrollo y recuperación del progreso pueden avanzar como tareas independientes. Este lote prioriza un resultado comprobable sin perder del plan la cobertura del resto de rutas.
