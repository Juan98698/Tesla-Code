# Implementación del plan de mejora

Fecha: 7 de noviembre de 2026. Este registro contrasta el trabajo con [el diagnóstico original](diagnostico-plataforma.md) y [el plan integral](plan-mejora-plataforma.md). Describe una primera entrega funcional; no declara finalizadas todas las fases ni sustituye una revisión docente.

## Resultado disponible

| Área               | Cambio comprobable                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Python             | Nueva ruta independiente de 67 temas, con un primer módulo de siete lecciones publicadas hasta un presupuesto. Las otras 60 siguen en preparación.                                                                 |
| Algoritmia         | Once lecciones principales conceptuales/en pseudocódigo y un laboratorio Python opcional. Publicado Análisis hasta invariantes; teorema maestro queda después como profundización.                                 |
| Práctica           | Las 19 lecciones de Python/Algoritmia tienen tres actividades y fuentes. Trece actividades ejecutan Python real: doce en Python y una en Algoritmia.                                                               |
| Acceso y secuencia | Todas las rutas conservan entrada libre. `progressionRequires` regula pasos internos; `dependsOn`/`requiresConcepts` representan conocimientos. Los laboratorios opcionales no bloquean el núcleo.                 |
| Dependencias       | Algoritmia conecta colas/pilas con recorridos, prioridad con Dijkstra y ordenamiento con Kruskal; elimina los vínculos artificiales hash→colas y grafos→tries. Python presenta clases/subclases antes de unittest. |
| Ejecución          | Pyodide bajo demanda, editor con borrador/restauración, casos visibles, ejecutar/detener, salida y errores. Worker dentro de marco con origen aislado; cancelación al navegar.                                     |
| Progreso           | Importación validada v1/v2 con vista previa, combinación, respaldo previo y deshacer. Reimportar una copia no duplica XP. IDs y logros anteriores conservados.                                                     |
| Publicación futura | Fuentes y tres prácticas como mínimo estructural. Registro explícito de 83 publicaciones heredadas pendientes de profundización. Huellas incluyen orden y justificación de dependencias.                           |
| Colaboración       | Guía rápida sin exigir Chromium/Python para `check`; requisitos de la batería completa separados. Estilos nuevos del editor en `practice.css`.                                                                     |

El catálogo pasa de 90/343 a 102/411 publicaciones/temas. Añadir el mapa Python amplía el alcance pendiente; no se presenta como una mejora artificial del porcentaje. Hay 46 lecciones con fuentes y 140 actividades en total. Son datos de cobertura, no evidencia de aprendizaje.

## Evidencia técnica y sus límites

Verificación local de esta entrega: 96 pruebas unitarias aprobadas; 28 módulos cubiertos, con 99,12 % de líneas, 94,61 % de ramas y 97,75 % de funciones. El recorrido general renderiza las 102 lecciones y resuelve sus 140 actividades. También pasan los recorridos independientes de Fundamentos, Algoritmia y Python, la actualización de caché y las comprobaciones automáticas de accesibilidad. Entorno local: Node 24.22.1 y CPython 3.12.14; no se atribuye ejecución local de Node 26 a este lote.

- Pruebas unitarias de dominio, adaptadores, componentes y herramientas; cobertura global y por archivo, sin reducir umbrales.
- Soluciones de todos los ejercicios Python ejecutadas en la distribución fijada. Casos incorrectos, errores de sintaxis, excepciones, entrada insuficiente, salida excesiva y soluciones equivalentes.
- Recorridos de Python desde cero en escritorio y móvil, con comprobaciones, bloqueos, persistencia, navegación durante ejecución y accesibilidad automática en ambos temas.
- Pruebas de recuperación: archivo corrupto, tamaño/versión inválidos, vista previa, cancelación, respaldo, deshacer, combinación repetida y fallo de almacenamiento.
- 44 programas visibles probados con CPython 3.12.14 y un ejemplo Git. La comprobación adicional en Pyodide cubrió 43 programas; el ejemplo de hilos permanece local.

Las revisiones registran autoría asistida y revisión independiente pendiente. Las actualizaciones de huellas por migración de metadatos no se presentan como una nueva revisión de profundidad de las otras rutas. Las pruebas del navegador no equivalen a un piloto con estudiantes. También se ejecutó un programa con archivos obtenidos de la CDN real a través del proxy verificado del entorno; no es una medición representativa de una conexión móvil.

Deshacer no restaura una copia antigua si ya hay nuevos logros, intentos o favoritos posteriores a la importación. En ese caso conserva ambos, explica el motivo y evita perder el trabajo posterior.

El motor usa Pyodide 314.0.7, que declara Python 3.14.2. Requiere conexión para la descarga inicial. No incluye cuota dura de memoria ni compatibilidad universal con paquetes, hilos, procesos o servicios del sistema. Los casos son visibles y el progreso es local: la plataforma no emite una certificación protegida contra manipulación.

## Mejora prioritaria: consola Python

8 de noviembre de 2026. Las trece actividades Python incorporan **Ejecutar código** para experimentar y **Comprobar ejercicio** para evaluar. Una consola visible muestra la salida incluso cuando el código pasa las pruebas, los errores con su línea y lo impreso antes de detener o agotar el tiempo. Incluye entradas previas para `input()`, limpieza y restauración; la ejecución libre no acredita prácticas ni concede XP.

La etapa Aprender añade el mismo editor y consola a los 43 ejemplos Python compatibles, sin duplicar la implementación ni iniciar el motor al leer. El ejemplo de hilos permanece local con instrucciones. El intérprete acotado de pseudocódigo conserva su salida; los comandos de sistema/Git requieren terminal local. Los ejemplos futuros declarados y las actividades Python heredan esta presentación y sus comprobaciones.

Verificación de esta mejora: 98 pruebas unitarias aprobadas; cobertura de los 28 módulos con 99,17 % de líneas, 94,50 % de ramas y 97,30 % de funciones. Los 43 ejemplos compatibles se ejecutan ahora automáticamente en Pyodide dentro de la suite; los 44 programas siguen pasando con CPython. Pasan las pruebas específicas de consola y el recorrido del módulo Python desde cero en escritorio/móvil, además del recorrido general de 102 lecciones y 140 actividades. Los controles automáticos incluyen accesibilidad en temas claro/oscuro, separación entre experimentar y acreditar, entradas, errores, tiempo máximo y cancelación al navegar. No sustituyen pruebas con estudiantes.

## Fortalecimiento de la base y Primeros pasos

9 de noviembre de 2026. Se corrigió la sobrescritura de progreso entre pestañas: las escrituras se serializan con Web Locks cuando están disponibles y combinan logros, intentos y recompensas sin duplicar XP. Las preferencias y las bajas de favoritos conservan la intención de la edición local. Importar o deshacer exige que el estado almacenado coincida con el esperado. La sincronización mantiene montada una lección activa y el resultado del cuestionario espera a que termine el guardado antes de ofrecer acciones de avance.

«Saltar al contenido» lleva el foco al contenido sin modificar la ruta. Los controles de Windows usan UTF-8, seleccionan Git Bash en lugar del lanzador de WSL, detectan Chrome/Edge cuando falta Chromium y guardan las capturas en la carpeta temporal del sistema. Se fijan finales de línea LF para YAML y Python. `npm run test:examples` selecciona el comando Python apropiado; README documenta el uso de `npm.cmd` cuando el lanzador de PowerShell apunta a una ruta global inaccesible.

El módulo curricular Primeros pasos, de dos lecciones, incorpora explicaciones ampliadas, fuentes oficiales, errores frecuentes y tres actividades por lección: comprensión, ayuda guiada y transferencia. Se conservaron los IDs anteriores. Las finalizaciones previas mantienen su acceso y XP; las nuevas requieren todas las prácticas. Las fuentes y la trazabilidad conceptual se revisaron expresamente y se actualizaron solo las dos revisiones afectadas. La comparación de pseudocódigo se identifica como textual, sin atribuirle ejecución real.

El catálogo conserva 102 publicaciones de 411 temas; ahora hay 144 actividades y 48 lecciones con fuentes. Quedan 81 publicaciones en la deuda editorial. La revisión independiente y el piloto con principiantes siguen pendientes para las dos lecciones ampliadas; estos cambios no certifican aprendizaje ni completan el plan entero.

Verificación local de unidades en Windows con Node 26.12.1: 123 pruebas aprobadas; los 32 módulos cumplen la política de cobertura, con 99,00 % de líneas, 95,33 % de ramas y 97,36 % de funciones. Los 44 ejemplos Python y el ejercicio Git pasan con CPython 3.12.10. El piloto automatizado recorre las 17 lecciones iniciales en 1440 y 390 px sin inyectar finalizaciones.

La batería completa `npm run test:all` termina correctamente con Chrome del sistema: actualización de caché, acceso independiente, 102 lecciones y 144 actividades, módulo Python, aislamiento, límites, recuperación/importación, consola y aprendizaje en paralelo entre pestañas. Los recorridos incluyen escritorio/móvil y auditorías automáticas de accesibilidad. Durante la validación se redujo la copia de buffers del runtime en la infraestructura de pruebas, manteniendo los archivos fijados y los límites del motor; no se atribuye una mejora medida de rendimiento a la aplicación en producción. Estas comprobaciones no sustituyen la revisión docente ni el piloto con participantes.

## Remodelación visual para la presentación

9 de noviembre de 2026. El inicio incorpora una escena CSS 3D con un núcleo y siete controles de ruta. La selección actualiza el objetivo, los hitos y el laboratorio sin conceder XP; conserva el foco y la posición del control. Se rediseñan la portada, la navegación, las tarjetas de especialidad, los paneles de práctica y la jerarquía visual de las lecciones. La marca existente y los contratos de progreso se conservan.

El movimiento responde al puntero solo con ratón adecuado. Se detiene fuera de pantalla, con la pestaña oculta, con movimiento reducido o al pulsar la pausa. En dispositivos táctiles la escena permanece estática; los controles siguen siendo HTML nativo. No se incorporan motores gráficos, fuentes externas ni dependencias nuevas. La ilustración de computadora anterior se conserva como recurso, pero deja de descargarse en el inicio.

### Comparación local del inicio

Chrome 156.0.8078.80 en Windows, servidor HTTP local, tres contextos nuevos por ancho, cachés de navegador/sistema calientes y movimiento normal. Se observaron 120 intervalos de `requestAnimationFrame` por muestra. Los 390 px simulan un viewport, no un teléfono físico. Los bytes corresponden a recursos de la página y excluyen el documento HTML principal.

| Medición                           | Antes (1440 / 390 px) | Después (1440 / 390 px) |
| ---------------------------------- | --------------------- | ----------------------- |
| Recursos transferidos por apertura | 445 977 / 445 977 B   | 346 481 / 346 481 B     |
| JavaScript sin compresión          | 125 634 / 125 634 B   | 132 216 / 132 216 B     |
| CLS observado                      | 0,0109 / 0,0510       | 0 / 0                   |
| Mediana del p95 de intervalos rAF  | 17,0 / 16,9 ms        | 16,8 / 16,8 ms          |
| Mediana de LCP                     | 2680 / 1544 ms        | 1536 / 1112 ms          |

El ahorro de transferencia es del 22,3 %. El JavaScript aumenta 6582 B para la escena y los controles. No hubo desbordamiento horizontal ni descarga inicial de Pyodide. La muestra final de escritorio incluye un LCP atípico de 10 812 ms, con 8454 ms en la navegación del documento; las otras dos dieron 1536 y 1252 ms. Los tiempos dependen del servidor y del equipo local: no prueban una mejora de velocidad en producción, no miden INP y no representan Core Web Vitals de usuarios reales. Los intervalos rAF tampoco equivalen a una medición completa de GPU.

La comparación se reproduce con `npm run review:ui -- etiqueta`, manteniendo iniciado el servidor local. Los informes JSON y las capturas quedan en `coverage/ui-review/`, excluido de Git. La interfaz se comprobó visualmente en escritorio y móvil y mediante controles automáticos a 320, 390, 768, 1024 y 1440 px, con temas claro/oscuro, pausa, movimiento reducido y WebGL deshabilitado.

Verificación de este lote con Node 26.12.1: 126 pruebas unitarias aprobadas; los 33 módulos cumplen los umbrales por archivo, con cobertura global de 99,04 % de líneas, 95,27 % de ramas y 97,44 % de funciones. Pasan la coherencia de recursos, el validador de contenido, el formato, la actualización de caché conservando progreso, el acceso independiente y el recorrido general de las 102 lecciones y 144 actividades. El piloto automatizado completa las 17 lecciones iniciales desde cero en escritorio y móvil. Las pruebas de experiencia incluyen activación con Enter/Espacio y foco tras reconstruir la escena. Las auditorías WCAG automáticas no sustituyen pruebas con lectores de pantalla o participantes.

## Logo giratorio optimizado

9 de noviembre de 2026. Se integra en la navegación el giro de `TeslaGifCode.webp`, aportado por el usuario, con fondo negro azulado y borde cian en ambos temas. El original de Descargas se conserva. La versión de entrega mantiene sus 77 fotogramas y tiempos, con encuadre cuadrado de 128 px: 168 744 B frente a 3 705 132 B, una reducción del 95,4 %. El primer fotograma estático pesa 3998 B y también sirve como favicon. El procedimiento y la procedencia están en `assets/README.md`.

La animación solo se solicita para el logo visible durante el inicio. Se sustituye por el fotograma estático durante las lecciones, con pausa, pestaña oculta, movimiento reducido, ahorro de datos o fallo de carga. No se añaden dependencias ni bucles de JavaScript por fotograma. El control del inicio pasa a llamarse «Pausar animaciones» y gobierna la escena y el logo. Se elimina además la transición de fondo de los botones de rutas, que podía producir contraste insuficiente durante el cambio de tema.

Con el mismo procedimiento local de tres muestras por viewport descrito arriba, los recursos transferidos del inicio pasan de 346 481 a 334 635 B; el JavaScript pasa de 132 216 a 134 711 B y las peticiones de 45 a 47. El CLS permanece en 0 en las seis muestras. El p95 de intervalos rAF queda entre 16,8 y 17,0 ms; no se observaron intervalos superiores a 32 ms en los 720 intervalos registrados. Los informes se encuentran en `coverage/ui-review/after/` y `coverage/ui-review/animated-logo/`. Son medidas locales, sin documento HTML principal, y no representan rendimiento móvil físico ni mediciones de GPU o de usuarios reales.

Verificación: 128 pruebas unitarias y cobertura de los 34 módulos aprobadas; el módulo del logo alcanza 100 % de líneas, ramas y funciones. Pasan formato, contenido, coherencia/actualización de recursos, acceso independiente y experiencia visual entre 320 y 1440 px. El navegador comprueba cambios entre fotogramas visibles, pausa, navegación a lecciones y ausencia de solicitudes de la animación cuando corresponde. Se mantienen las auditorías automáticas de accesibilidad en ambos temas.

## Laboratorio y progreso con profundidad; marca persistente

9 de noviembre de 2026. El laboratorio incorpora una escena de planos CSS que responde al puntero, tarjetas elevadas y un panel de filtros para los 30 retos existentes. Se conservan los seis tipos de práctica y los filtros por tema; cambiar de filtro mantiene el foco. Las simulaciones de IA y los accesos a lecciones/guardados permanecen funcionales. Mi progreso añade una plataforma con indicador circular, cuatro métricas reales, tarjetas de rutas y un área de exportación/recuperación. Los porcentajes cuentan únicamente lecciones publicadas, sin modificar logros almacenados ni conceder XP por explorar la interfaz.

La marca aumenta a 96 px en escritorio y 48–56 px en móvil/tableta; en la barra compacta de lecciones mide 56 px. El logo continúa animándose al navegar entre secciones, incluidas las lecciones. Se monta una sola vez en la navegación y solo solicita la animación para una imagen visible. La pausa está disponible en toda la plataforma y se conservan las excepciones por movimiento reducido, ahorro de datos y pestaña oculta. Se utilizan los mismos recursos de 128 px y no se añaden motores gráficos ni dependencias.

La vigilancia tecnológica vuelve a pasar en línea tras revisar Next 16.4.6, Vite 8.3.7 y FastAPI 0.162.2. Las cinco entradas que las citan son temas en preparación; no hay APIs ni ejemplos publicados que migrar. Se actualizan las referencias y sus fuentes sin desactivar el control ni renovar las huellas de lecciones ajenas. La evidencia está en `technology-currency.md`.

### Coste medido de las nuevas vistas

Chrome 156 en Windows, HTTP local, tres contextos nuevos en 1440 y 390 px por vista, cachés de navegador/sistema calientes y movimiento normal, con 120 intervalos rAF por muestra. Los bytes excluyen el documento HTML principal. Los informes están en `coverage/ui-review/lab-before/`, `lab-after/`, `progress-before/` y `progress-after/`; se reproducen mediante `npm run review:ui -- etiqueta lab` o `npm run review:ui -- etiqueta progress`.

| Recursos en apertura directa           | Antes     | Después   |
| -------------------------------------- | --------- | --------- |
| Laboratorio, transferencia             | 178 985 B | 353 162 B |
| Laboratorio, JavaScript sin compresión | 144 353 B | 149 111 B |
| Mi progreso, transferencia             | 165 291 B | 339 187 B |
| Mi progreso, JavaScript sin compresión | 134 711 B | 138 862 B |

La mayor parte del incremento corresponde al WebP animado de 168 744 B que ahora también se solicita al entrar directamente en estas secciones. El recurso se comparte al navegar; antes solo se animaba en la portada. No se presenta este cambio como una reducción de transferencia. El CLS observado permanece en 0 en todas las muestras y el p95 de intervalos rAF está entre 16,8 y 16,9 ms. No hay desbordamiento horizontal ni descarga inicial de Pyodide. Son pruebas locales de viewport, sin medición de GPU ni dispositivos físicos, y no demuestran rendimiento de usuarios reales.

Las 129 pruebas unitarias pasan y los 34 módulos cumplen los umbrales de cobertura: 99,04 % de líneas, 95,51 % de ramas y 97,11 % de funciones. La verificación visual y automática cubre entre 320 y 1440 px, ambos temas, giro visible, pausa fuera de la portada y ausencia de descarga del logo oculto. Las comprobaciones automáticas de accesibilidad no sustituyen pruebas con lectores de pantalla o participantes.

La batería completa `npm run test:all` termina correctamente con Node 26.12.1 y Chrome del sistema: ejemplos Python/Git, caché, 17 lecciones iniciales desde cero en ambos tamaños, acceso independiente, 102 lecciones y 144 actividades, ejecución Python, consola, importación/deshacer y aprendizaje simultáneo entre pestañas. También pasan el contraste tecnológico en línea y `npm run format:check`. Estas pruebas locales no sustituyen revisión docente ni pruebas con participantes.

## Nikola Tesla holográfico en la portada

9 de noviembre de 2026. El cubo se reemplaza por un busto vectorial original y estilizado de Nikola Tesla sobre un proyector cian. La cabeza se inclina con profundidad CSS y las pupilas siguen el cursor por separado, con recortes que las mantienen dentro de los ojos. Los siete botones de rutas conservan posición, semántica, selección y acceso por teclado. No se añaden dependencias, modelos, texturas ni peticiones a servicios de IA.

El seguimiento agrupa eventos en una actualización por frame y no mantiene un bucle JavaScript en reposo. Se desactiva con pausa, movimiento reducido, dispositivos táctiles, pestaña oculta o escena fuera de pantalla. Al desmontar se cancelan frames y se eliminan observadores y listeners, incluido el del documento. La ilustración SVG permanece disponible sin WebGL.

Comparación con el cubo: Chrome 156.0.8078.80, Windows, servidor HTTP local, tres contextos nuevos por viewport (1440/390 px), cachés calientes y 120 intervalos rAF por muestra; misma herramienta `npm run review:ui -- tesla-before` / `tesla-final`. Los informes y capturas están en `coverage/ui-review/`, excluido de Git.

| Métrica del inicio                    | Cubo      | Tesla        |
| ------------------------------------- | --------- | ------------ |
| Transferencia sin documento principal | 339 487 B | 342 072 B    |
| JavaScript sin compresión             | 138 862 B | 145 316 B    |
| Peticiones de recursos                | 48        | 49           |
| CLS en las seis muestras              | 0         | 0            |
| p95 de intervalos rAF                 | 16,8 ms   | 16,7–16,9 ms |
| Intervalos superiores a 32 ms         | 0/720     | 0/720        |

El incremento de transferencia es de 2585 B (0,76 %). No se observó desbordamiento horizontal ni descarga inicial de Pyodide. Una medición adicional en escritorio con 120 movimientos reales del cursor por muestra produjo p95 entre 16,8 y 17,6 ms, con 5/360 intervalos superiores a 32 ms; queda en `tesla-final/tracking.json`. Las medianas de LCP en escritorio/móvil fueron 1212/612 ms con el cubo y 2528/964 ms con Tesla. También varían los tiempos del documento y del servidor local; no se ha aislado la causa de esa diferencia. Son observaciones locales de laboratorio, sin medición de GPU ni dispositivo móvil físico; no demuestran una mejora de velocidad en producción.

La revisión visual incluye la mirada en las cuatro direcciones. El busto aplana la composición y mantiene la cabeza por encima del traje para impedir que sus planos se intersequen al girar.

Verificación: 130 pruebas unitarias aprobadas y 35 módulos dentro de los umbrales de cobertura; `depth-scene.js` y `tesla-hologram.js` alcanzan el 100 % de líneas, ramas y funciones. Pasan experiencia entre 320 y 1440 px, acceso independiente, actualización real de caché, contenido, formato y coherencia de recursos. Las comprobaciones incluyen transformaciones independientes de cabeza y ojos, botones estables, tres montajes/desmontajes, pausa, salida de pantalla, teclado, táctil, movimiento reducido, ambos temas y WebGL deshabilitado. Las auditorías automáticas de accesibilidad no sustituyen pruebas con lectores de pantalla o participantes.

## Retrato de referencia con relieve y mirada

9 de noviembre de 2026. Tras la revisión visual del usuario, la portada reemplaza el SVG simplificado por el rostro de `ideaHolograma.png`, conservando cabello, facciones, bigote, traje y luz azul. Se utiliza únicamente el busto. El original RGBA de 1199 × 1312 px y 1 933 541 B se convierte a WebP de 512 × 560 px y 90 060 B, con transparencia. No se regenera el rostro y no se incorporan las poses de cuerpo completo de la hoja de referencia. Los originales permanecen en Descargas.

Una malla frontal de relieve con 2009 vértices y 3840 triángulos permite girar la cabeza moderadamente, mezclando el movimiento del cuello hacia el traje fijo. El shader desplaza por separado los iris fotografiados dentro de máscaras suaves. WebGL se usa directamente, sin motor ni dependencias nuevas. Se dibuja bajo demanda, con DPR máximo 2; táctil y movimiento reducido no crean un contexto del retrato. Pausa, salida de pantalla y pestaña oculta suspenden el dibujo. La imagen HTML queda disponible al perder el contexto gráfico; restaurarlo reconstruye los recursos. El desmontaje libera buffers, shaders, textura, programa, contexto y observadores/listeners.

### Coste y verificación local

Chrome 156.0.8078.80 y Node 26.12.1 en Windows, HTTP local, tres contextos nuevos en 1440 y 390 px con ratón, cachés calientes y 120 intervalos rAF por muestra. Se compara el informe de la entrega anterior `coverage/ui-review/tesla-final/report.json` con `portrait-reference/report.json`, generado con `npm run review:ui -- portrait-reference`. La captura de 390 px es un viewport de escritorio, no un dispositivo móvil físico. Los bytes excluyen el documento HTML principal.

| Métrica                          | SVG anterior  | Retrato de referencia |
| -------------------------------- | ------------- | --------------------- |
| Transferencia                    | 342 072 B     | 434 003 B             |
| JavaScript sin compresión        | 145 316 B     | 148 122 B             |
| Peticiones de recursos           | 49            | 51                    |
| CLS en las seis muestras         | 0             | 0                     |
| p95 de intervalos rAF            | 16,7–16,9 ms  | 16,8–17,1 ms          |
| Intervalos superiores a 32 ms    | 0/720         | 0/720                 |
| Tareas largas durante la carga   | 1 por muestra | 2 por muestra         |
| Mediana LCP, escritorio / 390 px | 2528 / 964 ms | 1068 / 804 ms         |

El nuevo detalle aumenta la transferencia 91 931 B y el JavaScript 2806 B. El cambio de LCP no demuestra una mejora de velocidad: los tiempos de documento/servidor varían y estas mediciones locales no aíslan su causa ni representan Core Web Vitals de usuarios reales. No se observaron desbordamientos ni descargas iniciales de Pyodide.

En tres muestras adicionales de 120 fotogramas con movimientos reales del cursor, el p95 fue 16,9 ms, con 0/360 intervalos superiores a 32 ms. Se registraron 120 movimientos y 120 dibujos por muestra; durante otros 120 fotogramas en reposo hubo cero dibujos del retrato. La evidencia está en `portrait-reference/tracking.json`. Los intervalos rAF no equivalen a una medición completa de GPU.

Pasan 135 pruebas unitarias y los 36 módulos cumplen cobertura por archivo; `tesla-hologram.js`, `tesla-renderer.js` y `depth-scene.js` alcanzan 100 % de líneas, ramas y funciones. Se verifican shaders compilados y retrato renderizado en el navegador, cambios de píxeles al mirar, ausencia de renderizado en reposo/pausa, pérdida/restauración del contexto, cero asignaciones WebGL en táctil/movimiento reducido, recursos liberados y rutas con teclado. Pasan experiencia entre 320 y 1440 px, ambos temas y accesibilidad automática, acceso independiente, caché real, contenido, formato y coherencia de recursos. Se revisan visualmente frente, izquierda, derecha, arriba y abajo, escritorio y móvil. No sustituye pruebas con participantes, lectores de pantalla ni móviles físicos.

## Primera entrega de Fundamentos con JavaScript

10 de noviembre de 2026. La entrada recomendada de Fundamentos utiliza JavaScript desde la primera línea. Se publica un módulo de ocho lecciones originales con 15 ejemplos ejecutables, 24 prácticas de código y 40 preguntas. Cada lección explica los símbolos y conceptos que necesita antes de utilizarlos, incluye un problema trabajado, condiciones explícitas, predicción, práctica guiada, depuración y transferencia. Las fuentes son referencias de MDN; la autoría y revisión técnica son asistidas. La revisión docente independiente y el piloto con principiantes siguen pendientes.

| Orden | Lección                                         | Resultado práctico                                                                                   |
| ----- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1     | Tu primera línea: escribe, ejecuta y observa    | Reconocer editor y salida, escribir y modificar un saludo con console.log.                           |
| 2     | Textos, números y el orden de tus instrucciones | Distinguir valores y construir una salida de varias líneas.                                          |
| 3     | Aprender a leer errores y comentar tu intención | Reparar nombres, cierres y secuencia; reconocer comentarios.                                         |
| 4     | Dar nombre a tus datos con const                | Declarar y consultar valores sin confundir nombres con textos.                                       |
| 5     | Seguir un dato que cambia con let               | Explicar una reasignación y observar estados con una traza.                                          |
| 6     | Calcular con números y unir textos              | Sumar, multiplicar, agrupar y expresar unidades; distinguir concatenación.                           |
| 7     | Recibir entradas y convertir texto en número    | Leer líneas precargadas, convertir con Number y probar datos diferentes.                             |
| 8     | Tu primer producto: tarjeta y plan de práctica  | Integrar nombre, meta y tiempo diario; comprobar el plan con tres conjuntos de datos, incluido cero. |

La consola comparte editor y controles con Python, manteniendo un adaptador propio para JavaScript. Ejecutar permite experimentar; comprobar usa los casos del autor y es lo único que puede resolver la práctica. Incluye restauración, borradores, limpiar, detener, salida parcial y mensajes de error con línea cuando el navegador la proporciona. Cada caso se ejecuta como script clásico real en un Worker nuevo dentro de un marco con origen opaco; la red está bloqueada. La cola de prompt es una adaptación explícita con entradas previas y no un diálogo del navegador. Esta entrega es síncrona: DOM, módulos ES, espera asíncrona, archivos locales y Node requieren las entregas previstas para sus entornos. No hay cuota dura de memoria ni certificación protegida contra manipulación local.

El mapa principal muestra el módulo nuevo y 17 bloques posteriores en preparación. Sus entradas son un esquema de los bloques futuros, no lecciones completas publicadas. Las 68 lecciones anteriores conservan archivos, IDs, URLs, conceptos e historial en `#/ruta/fundamentos/archivo`; sus revisiones no se renuevan. Los IDs nuevos `js-*` conservan separadas las claves de progreso sin borrar ni reinterpretar datos v2. Las búsquedas y los guardados resuelven la edición correspondiente y Mi progreso muestra el historial anterior separado del porcentaje actual. La vista previa de Fundamentos en el inicio utiliza sintaxis JavaScript y se identifica como simulación.

El inventario tiene 110 publicaciones: 42 de los recorridos actuales y 68 de la edición anterior. Hay 436 entradas de mapa contando ambas ediciones y los bloques planificados. El registro de deuda editorial anterior permanece disponible; publicar el primer módulo no declara terminada la reescritura de toda la ruta.

La verificación específica recorre las ocho lecciones desde cero en 1440 y 390 px, resuelve las 24 actividades y sus cuestionarios sin inyectar finalizaciones, comprueba bloqueo secuencial, borradores, ejemplos, temas y accesibilidad automática. Las pruebas del motor cubren contextos separados, scripts y errores reales, límite de salida, salida parcial antes de un ciclo, detener, timeout, bloqueo de red, falta de acceso al DOM/almacenamiento de TeslaCode y limpieza de marcos. El comando es `npm run test:javascript`, incorporado a CI y a `test:all`. Las capturas quedan en `coverage/javascript/`.

Verificación final en Windows con Node 26.12.1 y Chrome del sistema: `npm run test:all` terminó con éxito. Pasan 141 pruebas unitarias, con cobertura global de 99,19 % de líneas, 95,93 % de ramas y 97,21 % de funciones; los 38 módulos cumplen los umbrales por archivo. El recorrido general renderiza las 110 lecciones actuales/anteriores y resuelve sus 168 actividades. También pasan 44 ejemplos Python y el ejemplo Git, 17 lecciones iniciales de la edición anterior en ambos tamaños, acceso, caché, Python, consola, JavaScript, progreso entre pestañas y experiencia entre 320 y 1440 px. Los 15 ejemplos JavaScript se ejecutan además en el motor real del navegador. La revisión visual y automática no sustituye el piloto docente pendiente.

## Remodelación pedagógica de IA generativa

10 de noviembre de 2026. El temario se reorganiza en 96 temas y 13 bloques; conserva los 73 IDs anteriores y añade 23 pasos. LLM, difusión y NCM son contenido central. Se retiran dependencias del antiguo proyecto de Fundamentos y se preparan JavaScript, HTTP, Python, matemáticas y redes antes de sus consumidores. Se amplían los objetivos de corpus, alineación, evaluación de LLM y experimentos de NCM. El detalle y el inventario están en [ia-curriculum.md](ia-curriculum.md).

Se revisan las nueve lecciones publicadas y se añaden probabilidad introductoria, imágenes/píxeles/semillas, frases/vectores/codificación y un proyecto de auditoría documental. Las 13 publicaciones contienen 52 prácticas, 39 casos con 95 decisiones y 68 preguntas. Cada una ofrece explicación desde cero, ejemplo resuelto con condiciones, comprensión, práctica guiada, corrección y transferencia a una situación nueva. Las fuentes son primarias. Las nueve publicaciones salen del registro editorial, que conserva 72 entradas. La revisión es asistida; el piloto con principiantes y la revisión independiente siguen pendientes.

El motor case-study exige resolver todas las decisiones, conserva las respuestas correctas al revisar las restantes y produce un informe con las justificaciones de referencia. No califica escritura libre mediante coincidencias de palabras. Los controles son grupos de opciones nativos con etiquetas y devolución accesible; las opciones se barajan sin cambiar la respuesta correcta. No hay proveedores, claves, pesos ni inferencias en vivo. El token-lab y la mezcla de ruido conservan sus límites visibles.

Las nueve URLs e identidades previas conservan historial y XP. Los cuatro pasos nuevos no se acreditan por finalizaciones antiguas. Las lecciones aún no finalizadas exigen las cuatro prácticas; una finalización histórica mantiene su significado anterior. El catálogo actual pasa a 46 publicaciones más 68 del archivo de Fundamentos: 114 archivos de lección, 459 entradas totales y 211 actividades. Los 83 temas técnicos de IA permanecen en preparación.

La verificación específica se incorpora como npm run test:ia a CI y a test:all. Recorre las 13 lecciones sin inyectar finalizaciones en escritorio/móvil, prueba errores, informes, progreso y ambos temas con WCAG automático; revisa lectura y teclado en 320 px. Las capturas y el registro completo quedan en coverage/ia/.

La batería completa npm run test:all terminó con éxito: validación técnica y de contenido, 149 pruebas unitarias, cobertura de los 40 módulos (99,21 % de líneas, 96,00 % de ramas y 97,30 % de funciones), ejemplos Python/Git, caché, módulos y acceso, 114 lecciones/211 actividades, consolas, IA, progreso y experiencia entre 320 y 1440 px. La revisión editorial final aclaró sesgo en su primer uso, eliminó anticipaciones de terminología y restauró las etiquetas originales de conceptos reutilizados. Una regresión de etiquetas se reprodujo antes de corregirla. Tras esos ajustes, npm run check pasa con 150 pruebas y el recorrido npm run test:ia vuelve a pasar completo. No se modifican dependencias ni se descargan modelos para las prácticas de IA.

## Laboratorio de Tesla e introducción cinematográfica

10 de noviembre de 2026. El fondo aportado `TeslaTres.png` se integra en todas las vistas mediante un WebP de 229.352 bytes. Paneles translúcidos, bordes y superficies de lectura conservan la legibilidad en ambos temas. Once símbolos SVG de programación flotan mediante CSS, con menos elementos en móvil y pausa al ocultar la pestaña, reducir movimiento, ahorrar datos o desactivar animaciones. Las siete rutas mantienen sus botones; el holograma interactivo se activa bajo demanda y libera sus recursos al desactivarse.

El video aportado se reprocesó desde 1280×720 a 1920×1080, a 24 fps, conservando los 240 fotogramas y el audio AAC original completo. El MP4 de 10.280.328 bytes usa codificación de unos 8 Mb/s y reproducción progresiva. Se sustituyó la compresión agresiva del prototipo; no se atribuye detalle Full HD nativo al material de 720p. Tras la observación del usuario sobre las franjas, la presentación llena el viewport con `cover`, sin deformación; en formatos distintos de 16:9 recorta parte del entorno. En vertical acompaña a Tesla usando los eventos de progreso del video, sin otro bucle de renderizado.

La entrada se muestra automáticamente una vez por sesión en el inicio; permite pausar, activar sonido, omitir y repetir desde «Intro». Una carga interrumpida después de comenzar no recorta la reproducción. Al terminar, un fundido revela el fondo y libera el decodificador. No se descarga video automáticamente al abrir una lección, con movimiento reducido, ahorro de datos o animaciones pausadas. No modifica logros ni XP. Los originales del usuario permanecen intactos y la procedencia se registra en `assets/atmosphere/README.md` y `media.json`.

La prueba específica `test:atmosphere` pasa con el video real en 1440 y 390 px, cinco vistas en ambos temas, WCAG automático, controles, sesión y holograma bajo demanda. Comprueba también ausencia de franjas en 1917×870, 2560×1080 y 390×844. La cobertura final pasa con 165 pruebas y 41 módulos: 99,15 % de líneas, 96,02 % de ramas y 97,29 % de funciones. El recorrido general renderiza las 114 lecciones y resuelve sus 211 actividades.

Se completaron por tramos todos los controles de la batería: validación, actualidad local, cobertura, ejemplos Python/Git, caché, piloto, acceso, recorrido general, Python, consola, JavaScript, IA, progreso, experiencia y atmósfera; también formato y coherencia de recursos. La revisión detectó y corrigió el texto oscuro del editor sobre su nuevo fondo oscuro en el tema claro. La prueba entre pestañas ahora confirma la respuesta de cada práctica antes de entrar al cuestionario; pasó dos veces después del ajuste. La fixture de Python admite dos reintentos de una conexión local reiniciada, sin ignorar errores HTTP ni sustituir la ejecución real.

Medición local en Chrome 157 / Windows, tres contextos nuevos por tamaño, movimiento normal e intro ya vista, sin limitar CPU o red y sin otras pruebas de navegador en paralelo. Los recursos del inicio pasan de 455.042 a 601.621 bytes (+146.579) y de 55 a 57 peticiones; el HTML no está incluido en esa suma. CLS es 0 en las seis muestras finales. No se solicitó video ni retrato holográfico en ninguna. El primer acceso con intro agrega el MP4 de 10,28 MB y su cartel de 22 KB; se prioriza calidad y carga condicionada.

LCP observado: 248–1192 ms en 1440 px y 240–604 ms en 390 px, frente a 952–1936 y 840–948 ms en la referencia anterior. Son muestras pequeñas con cachés del equipo calientes, no evidencia de una mejora de velocidad para usuarios reales. La reproducción sin capturas simultáneas llegó a 10,026667 s y 240 fotogramas en ambos tamaños; el navegador descartó 1 en escritorio y 0 en móvil emulado. Los registros locales quedan en `coverage/media/after.json` y `playback-final.json`, y las capturas en `coverage/atmosphere/`. Falta contraste en dispositivos y conexiones físicos; no se midió INP de campo.

## Tutor contextual con Gemini

10 de noviembre de 2026. «Pregúntale a Tesla» ofrece explicación desde cero, pistas, revisión de errores y miniprácticas. El panel y sus estilos se cargan al abrirlo; no consulta la API durante la navegación normal. Utiliza la explicación publicada de la lección y, si corresponde, un apoyo anterior de su misma ruta. Las consultas generales permiten explorar hasta dos lecturas publicadas. Compartir código exige una acción explícita. El tutor no completa actividades, desbloquea lecciones ni concede XP; su historial permanece en memoria hasta recargar.

La clave de Gemini se utiliza exclusivamente en el servidor. El sitio público se construye en `dist/` mediante una lista de carpetas permitidas; secretos, índice docente privado, servidor, pruebas y skills quedan fuera. La función de Vercel limita entradas, historial, salida, duración y consultas. Producción requiere contadores compartidos de Upstash Redis y un secreto HMAC; si faltan o fallan, no se consulta Gemini. La configuración e instrucciones están en [tutor-gemini.md](tutor-gemini.md).

Pasan 196 pruebas unitarias con cobertura de los 50 módulos: 99,28 % de líneas, 96,02 % de ramas y 96,99 % de funciones. Se verifican límites, cuotas atómicas con transporte simulado, validación, redacción de errores privados, cancelación, respuestas parciales, reintento, contexto y representación inerte de respuestas. El recorrido HTTP del tutor pasa en escritorio/móvil y ambos temas con WCAG automático, foco, código compartido explícitamente y progreso intacto; también verifica exclusión de archivos privados y reproducción parcial del video. Las pruebas reales de Gemini confirman la conexión con la clave local, sin enviarla al navegador. El servicio de Redis real y el despliegue publicado siguen pendientes de configuración y comprobación.

Se completaron por tramos los controles existentes: contenido, recursos, tecnología, ejemplos, caché, módulo inicial, acceso, 114 lecciones/211 actividades, Python, consola, JavaScript, IA, progreso, experiencia y atmósfera. La primera ejecución del recorrido general tuvo un fallo transitorio al importar Pyodide por red; al repetirlo pasó completo sin cambiar el motor de Python.

La medición local compara el commit `697f6e2` con esta entrega usando el mismo servidor HTTP sin compresión, tres contextos nuevos por tamaño y edición, sin otras pruebas de navegador simultáneas. Los recursos iniciales, sin HTML, pasan de 1.496.580 a 1.500.363 bytes: 3.783 bytes adicionales y una petición del lanzador. No se carga el panel completo ni se consulta la API antes de abrirlo. CLS es 0 en todas las muestras. La dispersión de LCP no permite atribuir una mejora de velocidad; no se midió INP de campo. Los datos quedan en `coverage/tutor/performance.json`.

## Tesla animado en el fondo y diagnóstico local

10 de noviembre de 2026. Se retira el busto holográfico independiente y su botón. La cabeza y los ojos del Tesla fotografiado en el fondo acompañan suavemente el cursor con una deformación 2.5D limitada al rostro y cuello. El laboratorio permanece inmóvil y los siete botones conservan sus posiciones. No se añade otra imagen ni una biblioteca gráfica: el renderizador de dos triángulos se importa al primer movimiento de ratón compatible, se detiene al completar la interpolación y libera recursos tras una pausa prolongada. Móvil/táctil, ahorro de datos, movimiento reducido y fallos de WebGL conservan el fondo estático.

La cabecera del tutor utiliza el retrato frontal aportado por el propietario. La configuración local estaba completa, pero la API no respondía en el puerto 3000; se inició el servidor correcto y se verificó una respuesta real de Gemini mediante esa API. Un primer intento no completó su respuesta; el siguiente sí terminó. El commit no activa un servidor local ni instala variables de Vercel. `tutor:doctor` permite comprobar esa diferencia sin mostrar secretos ni consumir consultas. La guía del tutor señala `tutorPrompt()` y los archivos para ajustar enseñanza, botones y generación.

Pasan 198 pruebas unitarias, cobertura de 50 módulos (99,28 % de líneas, 96,04 % de ramas y 97,01 % de funciones), tutor HTTP en ambos temas y tamaños, acceso, experiencia entre 320 y 1440 px y atmósfera con el video real. Las capturas aisladas comprueban que el rostro cambia y los píxeles del laboratorio no; también se verifican pausa, reposo sin dibujado continuo, pérdida/restauración de contexto y navegación sin WebGL.

Frente a la entrega del tutor anterior a esta animación, la carga inicial pasa de 1.500.363 a 1.493.005 bytes, sin HTML, y de 58 a 57 peticiones. Son tres contextos nuevos por tamaño/edición, en el mismo servidor HTTP local sin compresión, sin otras pruebas de navegador simultáneas y con intro ya vista. CLS es 0; la variación de LCP no demuestra una mejora para usuarios reales. No se midió INP de campo. Los datos están en `coverage/tesla-world-performance.json`.

## Giro del rostro, tutor ampliado y LAB explicado

10 de noviembre de 2026. La deformación UV de la entrega anterior se sustituye por una malla de relieve con rotación rígida y una base auxiliar sin figura. La cabeza conserva la fotografía y sus proporciones; los iris se componen y desplazan por separado dentro de los párpados. El giro es moderado y no ofrece perfiles ni vistas de 360°. La portada encuadra la cabeza completa y distribuye las siete rutas a sus lados o debajo en móvil. El encuadre usa transformaciones de composición y los símbolos conservan coordenadas de viewport, evitando saltos al aparecer el contenido. Recursos y prompt de la base generada con imagegen quedan en `assets/atmosphere/README.md`.

El tutor pasa de 480 a 680 px de ancho máximo, amplía el retrato de 62 a 112 px en escritorio y reserva más altura para leer al compactar el formulario. En 390×844 el área de respuesta mide aproximadamente 464 px de alto. Cada LAB explica su objetivo, propone una prueba concreta, interpreta el resultado y sugiere qué observar. El ejemplo de IA permite leer sus dos documentos y explica los límites de una coincidencia de palabras. Probar selecciona el resultado; no concede progreso ni XP.

La comprobación GPU localiza ambos iris en cuatro direcciones mediante píxeles renderizados. Se verificaron encuadre, ausencia de solapamientos con rutas y contraste en 320, 390, 768, 1024, 1366 y 1440 px, además de pérdida/restauración de contexto, pausa y navegación por teclado. Los recorridos de experiencia, tutor, atmósfera y acceso pasan en escritorio y móvil emulado. No equivalen a una prueba con móvil físico ni a un modelo anatómico completo.

La medición comparativa usa tres contextos nuevos por edición y tamaño (1440/390 px), HTTP local sin compresión, intro vista, sin cargas de navegador paralelas ni limitación de CPU/red. La transferencia inicial, sin HTML, pasa de 1.493.005 a unos 1.505.422 bytes; mantiene 57 peticiones y no solicita el chat ni la API. La base auxiliar de 86.616 bytes y su máscara se cargan solo con el primer movimiento de ratón compatible. CLS es 0 en las doce muestras finales. LCP mediano de escritorio: 1052 → 1056 ms; móvil: 928 → 832 ms, con variación importante entre muestras. No se atribuye una mejora de velocidad a estos datos ni se mide INP de campo. Comando y datos locales: `node coverage/polish-measure.mjs`, `coverage/polish-performance.json`.

## Restauración del holograma de referencia

11 de noviembre de 2026. A petición del propietario, se retira la animación del Tesla del fondo y su encuadre ligado a la portada. La fotografía global recupera su presentación fija original. El retrato frontal existente vuelve como holograma independiente y visible por defecto, con las siete rutas alrededor. Solo los iris siguen el ratón; el resto del rostro permanece fiel a la referencia. Se retiran el renderizador global y sus capas auxiliares. El LAB y el tutor conservan las mejoras de la entrega anterior. La alternativa estática, pausa, movimiento reducido, ahorro de datos, contexto perdido y limpieza de recursos se mantienen.

## Lectura opcional de la teoría

11 de noviembre de 2026. Se incorpora lectura opcional de teoría mediante Web Speech API en la etapa Aprender de las rutas. Un botón de altavoz inicia la lectura; permite pausar, continuar desde el fragmento actual, detener, elegir voz española y cambiar velocidad. Los bloques activos se resaltan sin desplazar el foco. El módulo se carga al entrar en Aprender y no utiliza servicios de IA del proyecto. Las consolas y el código editable se excluyen; cambiar de etapa/lección cancela el audio y ocultar la página lo pausa. La ausencia de API/voces se informa sin impedir el aprendizaje. Escuchar no completa actividades ni modifica XP.

## Rutas y lectura del tutor

11 de noviembre de 2026. Los siete enlaces del holograma abren directamente el mapa de su ruta. Cada uno utiliza un borde de color propio sobre el mismo fondo de cristal; Fundamentos deja de tener un relleno seleccionado permanente. El tutor integra el contexto en una cabecera compacta, retira lemas y etiquetas redundantes y despliega privacidad/ayuda a petición. Los estados normales se anuncian sin reservar una franja visible; los errores conservan texto y reintento. Las ayudas se pliegan al conversar y el fragmento de código al enviar, manteniendo sus controles disponibles. El texto de las respuestas conserva su tamaño. En la comparación local a 1440×900, la altura de conversación pasa de 471,5 a 633,4 px; a 390×844, de 463,9 a 614,4 px. Se comprueban también 320×568 y 844×390. Son medidas de geometría del navegador, con proveedor simulado, no pruebas en dispositivos físicos.

## Estado del plan completo

| Fase                           | Estado                    | Pendiente concreto                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0: alcance y confianza        | Parcial                   | Elegir licencias y documentar derechos de recursos; el inventario está en `assets-and-licensing.md`. No se concedieron derechos ni eliminaron maestros.                                                                                 |
| P1: grafo conceptual           | Parcial                   | Modelo separado en siete rutas; revisión asistida de Algoritmia, Fundamentos JavaScript, Python e IA. Falta contrastar las dependencias y profundidad de las restantes especialidades.                                                  |
| P2: Algoritmia/Python/práctica | Primer lote implementado  | Completar Python tras el presupuesto y Algoritmia tras invariantes, con la misma disciplina editorial y pruebas. La medición publicada explica conteos en pseudocódigo; un laboratorio de reloj necesita su propio diseño reproducible. |
| P3: aprendizaje y recuperación | Recuperación implementada | Revisión independiente, piloto con participantes, retención y ajustes derivados de evidencia real. No hay equivalencias automáticas de acreditación entre rutas.                                                                        |
| P4: catálogo                   | En desarrollo por módulos | 345 temas planificados pendientes; profundizar las 72 publicaciones heredadas restantes del registro editorial. Priorizar resultados integradores, sin rellenar lecciones para aumentar cifras.                                         |
| P5: mantenimiento              | Preparación               | Auditoría completa de CSS, medición en móviles/conexiones representativas, destino recuperable de PNG y ampliaciones avanzadas de algoritmos.                                                                                           |

## Siguiente lote

1. Python: comparaciones → decisiones → listas/índices → for → while → funciones → proyecto de resumen de datos. Explicar cada construcción antes del ejercicio y añadir casos de límite y fallos frecuentes.
2. Algoritmia: estructuras lineales y análisis de sus operaciones, manteniendo pseudocódigo como núcleo y código real como aplicación opcional.
3. Revisar Fundamentos empezando por listas, funciones, recursión, errores y proyectos; retirar entradas del registro editorial solo con evidencia.
4. Contrastar el módulo inicial con una persona docente y participantes de los perfiles previstos. Incorporar sus hallazgos antes de replicar el patrón sin cambios a todas las rutas.

Los puentes existentes se reutilizan como repasos. Las nuevas lecciones de Python responden a objetivos propios y no se acreditan automáticamente por coincidencia de títulos. El contenido no redactado permanece visible como planificación.

## Inicio del proyecto encadenado en Fundamentos

16 de noviembre de 2026. Se registra la dirección completa en `AGENTS.md` y `fundamentos-learning-model.md`. Las ocho lecciones iniciales construyen Mi plan de práctica con 32 etapas: análisis, implementación, reescritura y entrega integrada por lección. Los incrementos recuperan el código aprobado anterior, conservan borradores propios y permiten recuperar y descargar entregas. La bitácora queda incluida en el respaldo de progreso; no se califica automáticamente su contenido. Se conserva el historial anterior sin exigir nuevas etapas a una finalización ya obtenida.

Se añaden controles de publicación para el orden y las referencias de las etapas. También se amplían los casos de comparación, suma y máximo que admitían errores habituales, y las predicciones numéricas aceptan representaciones equivalentes.

Pendiente: migrar los otros diez temas publicados, desarrollar los doce bloques avanzados con el modelo acordado, revisión independiente, piloto con principiantes y comprobación longitudinal de retención. No se declara completada toda la ruta por este primer lote.

## Corrección del encadenamiento en las ocho lecciones iniciales

16 de noviembre de 2026. El primer módulo conserva el reporte completo entre
incrementos y declara el motivo de cada cambio. Meta y recordatorio permanecen
en las lecciones posteriores; los 30 minutos confirmados se usan al calcular 150,
con 20 como referencia histórica. La tarjeta final conserva las capacidades
anteriores y compara el plan base con uno ampliado.

Las 32 etapas mantienen sus IDs. Entender exige decisiones y explicación entregada;
las 24 etapas de código incorporan predicciones o trazas estructuradas distintas.
Las ocho reescrituras comparan ejecuciones de la versión real anterior del estudiante
con los mismos casos. Las ocho integraciones requieren ejecutar una incidencia
independiente del borrador, identificar su causa y comprobar la versión corregida
o protegida. La bitácora pide síntoma, entrada, hipótesis, prueba, causa y corrección.

Las pruebas contrastan declaraciones/tipos y variantes de configuración cuando
la habilidad lo exige; no basta imprimir un resultado fijo. Acorn 8.15.0, con su
licencia MIT, analiza declaraciones y localiza inicializadores sin evaluar código
en la página anfitriona. Su copia pública se comprueba contra la dependencia fijada.
El editor, el ejecutor y la evaluación conservan sus responsabilidades separadas.
Se evita aprobar una versión editada mientras se ejecutaba otra o recuperar código
anterior durante un evento de escritura.

Las explicaciones se exigen como entrega, pendiente de revisión humana, sin
clasificación por palabras clave. Los registros guardan respuestas, código probado,
reproducción y comparación; sobreviven a respaldo e importación. Una evaluación
nueva necesita esas evidencias además del quiz y las prácticas. Se preservan
completados históricos y XP; los intentos fallidos no reemplazan entregas aprobadas.

El alcance continúa siendo ocho lecciones migradas: diez publicaciones posteriores
requieren migración y doce bloques futuros siguen en preparación. La revisión
independiente y el piloto con principiantes siguen pendientes. La verificación
local automatizada comprueba contratos y funcionamiento, no acredita comprensión
humana ni ausencia absoluta de vacíos pedagógicos.

Verificación local: 236 pruebas unitarias aprobadas, 55 módulos con cobertura
por archivo y 98,91 % de líneas globales. Pasan las soluciones y variantes de los
contratos, los contraejemplos, el respaldo de evidencias y la conservación de XP.
El recorrido JavaScript comprueba las 18 publicaciones en 1440 y 390 px; audio
comprueba también la alternativa de 320 px. Las auditorías automáticas de los
paneles de evidencia cubren ambos temas en escritorio y móvil. Formato, contenido,
recursos versionados y generación del contexto docente se verifican por separado.

## Migración de las diez publicaciones posteriores

16 de noviembre de 2026. Se completa la migración de las **18 lecciones
publicadas** de Fundamentos JavaScript al proyecto Mi plan de práctica. Los diez
incrementos posteriores añaden tipos y unidades, comparaciones, recomendaciones,
validación, calendario con while, acumulación con for, funciones, descomposición,
listas de sesiones y resumen final. La ruta declara cero publicaciones pendientes
de migración; los doce bloques futuros mantienen su estado de preparación.

Las 72 etapas del proyecto siguen entender → implementar → reescribir y comprobar
→ integrar y depurar. Se preservan los IDs anteriores, incluida analizar-contrato,
y tres repasos posteriores obligatorios con situaciones diferentes. Las cuatro
etapas requieren evidencia; los repasos se habilitan después de integrar. Las
lecciones ya completadas y su XP conservan su tratamiento histórico.

Cada ampliación mantiene capacidades previas dentro del dominio válido y justifica
los cambios de entrada. Validar permite rechazar datos sin presentar cálculos
parciales; no confunde ausencia con cero. El calendario admite cero días. Los
cálculos admiten hasta 125 minutos en la proyección ampliada, manteniendo 120 como
límite de la entrada base. Las listas distinguen sesiones programadas y realizadas,
admiten la vacía y verifican posiciones, repetidos, límites y conservación.

Las funciones se prueban con argumentos independientes de las entradas del
reporte. Los casos pueden comprobar distintos puntos de entrada para conservar
contratos anteriores. La comparación de reescrituras conserva tanto impresión
como retorno tipado; imprimir un resultado no sustituye devolverlo. Las incidencias
muestran resultados esperados, observados y salida impresa; cada copia defectuosa
se ejecuta y falla antes de aceptar la investigación. Las estructuras exigidas se
comprueban mediante análisis sintáctico, sin buscar palabras en comentarios.

Se revisaron prerrequisitos teóricos y el código de las soluciones contra las
construcciones ya enseñadas. El cuestionario conserva sus preguntas e IDs y la
bitácora pide predicción, traza, hipótesis, prueba, causa y corrección. Las preguntas
estructuradas contrastan también estado parcial y parada de recorridos. La calidad
de las explicaciones continúa pendiente de revisión humana; no se califica por
palabras clave ni se atribuye comprensión por superar pruebas automáticas.

Verificación: 246 pruebas unitarias y los 55 módulos bajo comprobación de cobertura;
477 casos declarados para las actividades JavaScript, con soluciones y
contraejemplos ejecutados. El recorrido de las 18 publicaciones pasa en 1440 y
390 px. El recorrido general renderiza 124 lecciones y resuelve 264 actividades.
Audio y alternativas de lectura pasan; los paneles del proyecto final se verifican
en 1440, 390 y 320 px, con ambos temas y auditorías automáticas WCAG. El contexto
docente se regenera, excluyendo evaluaciones. Revisión docente independiente y
piloto con principiantes permanecen pendientes.

## Redistribución de Valores, tipos y operaciones

Se sustituye la agrupación de dos lecciones por cuatro entregas secuenciales:
**Tipos y representación**, **Operaciones y unidades**, **Comparaciones** e
**Integración de valores**. Las dos lecciones existentes mantienen sus IDs,
actividades y preguntas identificadas; el alcance de tipos se concentra y las
operaciones nuevas reciben una lección y un concepto propios. El recorrido pasa
a 20 publicaciones, con 80 etapas de proyecto y tres repasos posteriores.

La primera entrega conserva la tarjeta inicial y añade únicamente la consulta de
tipo. Explica textos, números, booleanos, undefined y null antes de evaluarlos;
ninguno de sus retos exige resta, división, resto, comparaciones o control de flujo
que corresponden a lecciones posteriores. La segunda introduce los símbolos,
precedencia, agrupación, unidades y límites de Number, y añade horas, resto y margen.
Comparaciones utiliza esas cantidades y comprueba tanto el resultado como su tipo
booleano: imprimir un texto idéntico no satisface ese contrato.

La integración utiliza otros nombres, metas y cantidades, conserva todos los
campos y contrasta `(minutos + 5) * dias` con `total + 5 * dias` para los enteros
pequeños admitidos. Su incidencia aplica el aumento diario una sola vez al total.
Cero y ambos lados de las fronteras complementan la traza y la justificación. La
versión integrada alimenta Decisiones; prerrequisitos académicos, progresión y
fuentes de entregas reflejan el nuevo orden. No se añaden ramas ni ciclos en este
bloque. La selección de casos se explica antes de exigirla.

Se preservan completados y XP anteriores; las nuevas lecciones no se acreditan
por esos logros históricos. Las pruebas de regresión verifican acceso, IDs,
conservación de capacidades, evidencias reales, equivalencia, incidencias que
fallan y ausencia de operaciones futuras en los retos de tipos. Las explicaciones
continúan como entregas pendientes de revisión humana. Los doce bloques futuros,
la revisión docente independiente y el piloto con principiantes siguen pendientes.

Verificación de esta redistribución: 253 pruebas unitarias aprobadas; los 55
módulos de aplicación cumplen los umbrales de cobertura. Se ejecutan 31 ejemplos
y 522 casos declarados de actividades JavaScript. El recorrido completo pasa las
20 lecciones en 1440 y 390 px; el recorrido general resuelve 272 actividades de
126 lecciones. Un recorrido específico verifica las cuatro entregas, el rechazo
de booleanos impresos como texto y la transferencia del código real a Decisiones.
La revisión visual comprueba cuatro tarjetas y accesibilidad automática en ambos
temas a 1440 y 320 px. Audio, formato, recursos y contenido pasan sus controles.

## Revisión de granularidad, explicaciones y devoluciones

17 de noviembre de 2026. Se revisaron las 28 publicaciones resultantes y el
alcance de los doce bloques en preparación según el acuerdo de retos encadenados.
La [matriz de revisión](revision-granularidad-fundamentos.md) distingue los
hallazgos, la distribución aplicada y las condiciones pendientes para el temario.
El primer módulo conserva ocho lecciones y Valores conserva cuatro; cada uno de
los cuatro bloques posteriores pasa de dos a cuatro lecciones:

- Decisiones: dos caminos, clasificación, reglas booleanas y validación.
- Repeticiones: while, calendario equivalente con for, acumulación y conteo.
- Funciones: parámetros/retorno, composición, reglas independientes y retornos
  tempranos con casos que protegen contratos.
- Listas: construcción, suma sin mutación, resumen y máximo integrado.

Se añaden ocho IDs sin eliminar los anteriores. Se actualizan prerrequisitos,
orden de progresión, conceptos y recuperación de entregas para el mismo producto.
Cada publicación mantiene las cuatro etapas, la conservación del reporte,
predicciones, explicaciones entregadas, comparación con código real anterior e
incidencias que efectivamente fallan. Los tres repasos posteriores conservan sus
IDs y su condición obligatoria; los logros y XP históricos permanecen.

Las pistas de las 28 publicaciones orientan sobre la habilidad concreta y avanzan
hacia una traza y una comprobación. Las decisiones fallidas reciben orientación
local. Las funciones empiezan por guardar y mostrar el retorno antes de componer
llamadas. La clasificación muestra decisiones anidadas y su cadena equivalente.
La lectura y construcción de sesiones preceden a su análisis; el par preparado se
reutiliza para devolver el resumen. Los ejemplos no exigen los métodos del tramo
siguiente.

El comprobador muestra las variaciones de datos iniciales y los valores que
consulta al terminar. Un dato equivocado muestra su valor y tipo, incluso cuando
la impresión del reporte coincide; undefined conserva su representación. Las
incidencias también muestran esos datos. El mensaje correcto describe coincidencia
de casos; la comparación con la entrega anterior informa su estado por separado.
La explicación personal continúa pendiente de revisión humana. Las evidencias de
etapas bloqueadas se presentan al habilitarse: esto evita regiones de código
inaccesibles por teclado dentro de controles deshabilitados en pantallas estrechas.

Hay 41 ejemplos, 87 actividades ejecutables, 870 ejecuciones de casos declarados,
28 análisis de decisiones y 131 preguntas. Son 112 etapas y tres repasos. Las 261
pruebas unitarias pasan y los 55 módulos cumplen cobertura: 98,83 % de líneas,
95,64 % de ramas y 96,67 % de funciones globalmente. La verificación general
renderiza 134 lecciones y resuelve 304 actividades, revisa 20 combinaciones de vista
y tamaño y pasa 16 auditorías WCAG automáticas. El recorrido JavaScript completa
28 lecciones desde cero a 1440 y 390 px, conservando las entregas del estudiante.
La devolución de tipos se revisa también a 320 px, con fallo, corrección, etapas
bloqueadas, ambos temas y ausencia de desbordamiento; no acredita una ejecución
fallida. El lector de teoría pasa sus recorridos, incluido el caso sin API a 320 px.
Contenido, recursos y formato se comprueban con los comandos del repositorio.

La revisión del temario pendiente evita suponer objetos, texto avanzado o
herramientas locales al continuar desde las listas publicadas. Sus separaciones
quedan documentadas antes de redactar lecciones; no se publica ese alcance como
material terminado. Permanecen pendientes los doce bloques futuros, la revisión
docente independiente y el piloto con principiantes. Los resultados de CI no
certifican comprensión ni ausencia absoluta de vacíos.

## Dimensionar por el tema antes del piloto

Decisión del usuario, 16 de noviembre de 2026. La coherencia del contenido se
establece antes de entregarlo a principiantes. La cantidad de lecciones deriva del
alcance, sus dependencias y la práctica necesaria; no existe una cuota común. Se
actualizan los acuerdos persistentes y la [matriz de alcance y carga](fundamentos-alcance-y-carga.md).
Se contrastan las familias de habilidades con seis guías actuales de MDN. No se
introducen dependencias, tecnologías nuevas por novedad ni contenido de relleno.

Listas pasa de cuatro a seis lecciones. Construir y consultar el arreglo se
separa de leer una cantidad variable de entradas y validarlas. Contar posiciones
que cumplen se separa de combinar suma y conteo en un resumen. Cada entrega
consume la anterior y conserva el reporte; Registros: permite observar el arreglo
real y detectar guardar textos en lugar de números antes de sumarlos. Los casos
incluyen vacío, posiciones, repetidos, tipos distintos, fronteras, errores de
entrada y conservación de argumentos. Las incidencias producen fallos observables.

Los otros cuatro bloques de continuidad conservan sus objetivos principales y
reciben transferencias a contratos nuevos: aforos con límites distintos, reservas
con validación y clasificación, pedidos con aportes variables y cobro mediante
composición y retornos tempranos. Las pistas son opcionales y los programas parten
sin algoritmo prefijado. Se añaden ejemplos de += y del retorno undefined al
imprimir sin devolver; no se crea una lección por cada variante de escritura.

El núcleo reúne 30 publicaciones, 45 ejemplos, 97 actividades ejecutables con 993
casos declarados, 30 análisis de decisiones y 139 preguntas. Son 120 etapas de
proyecto y siete transferencias obligatorias; se preservan IDs, completados y XP.
La distribución es 8/4/4/4/4/6 por los objetivos documentados. No se presenta como
una cantidad óptima universal ni como el lenguaje completo. Las ampliaciones
necesarias conservan un lugar explícito en los doce bloques en preparación.

Los casos de funciones muestran ahora también todas las entradas del reporte,
con número de línea y texto entre comillas; así se hacen visibles los campos vacíos
sin exigir conocer JSON. Los argumentos de la llamada independiente se muestran
por separado. Esta corrección permite reproducir los casos del protocolo variable.

Verificación: 265 pruebas unitarias aprobadas y los 55 módulos cumplen los umbrales
de cobertura. Pasan los 993 casos declarados y 45 ejemplos. El recorrido JavaScript
completa las 30 lecciones desde cero en 1440/390 px. El recorrido general renderiza
136 lecciones y resuelve 316 actividades; pasa 16 auditorías WCAG automáticas. La
revisión focal a 1440/320 px recupera la entrega real de construcción, reproduce
almacenamiento incorrecto de textos, muestra todas las entradas y resuelve las
cuatro etapas de lectura validada; pasa ambos temas sin desbordamiento. Lector de
teoría, caché con 180 XP anteriores conservados, contenido, formato y compilación
pasan sus controles. La revisión docente independiente y el piloto siguen pendientes.

## Correspondencia editorial por habilidad antes del piloto

17 de noviembre de 2026. La revisión cruza las 30 publicaciones de la edición
actual con su explicación, ejemplos ejecutables, práctica guiada y aplicación
independiente. Las 40 filas de la matriz incluyen habilidades transversales
como formular predicciones, elegir casos para fronteras y justificar una
corrección. Cada reto compartido remite a la lección donde se usa. Los doce
bloques en preparación conservan su alcance planificado.
[Matriz de correspondencia editorial](fundamentos-correspondencia-editorial.md).

Se detallan los cambios guiados sobre el código acumulado y se agregan cuatro
ejemplos para practicar comillas simples, contrastar estimaciones, observar una
disyunción y probar una regla con sus propios argumentos. Se corrigen
instrucciones de lectura y conteo que pedían reutilizar el par de resultados
antes de la lección de resumen.

Se suman 22 aplicaciones independientes. El recorrido alcanza 29 retos
posteriores a la integración. Cada uno tiene sus propios datos y resultado
esperado. Los retos nuevos cuentan como prácticas requeridas para completar
una lección desde cero, o se asignan a una lección posterior cuando esa tarea
puede comprobar varias habilidades. Los identificadores, las entregas y los
logros históricos se conservan.

La revisión de la matriz encontró cada referencia de ejemplo y actividad.
La validación ejecutó 49 ejemplos y 1076 casos declarados de JavaScript. Los
contrastes dirigidos rechazaron trece fallos plausibles, entre ellos imprimir
una cantidad como texto, guardar el dato inicial en dos lugares, excluir una
frontera inclusiva e iniciar un máximo con cero cuando todos los valores son
negativos. La lectura de las explicaciones y decisiones, la revisión docente
independiente y el pilotaje con principiantes quedan pendientes.

Pasaron 265 pruebas unitarias y los umbrales de cobertura de los 55 módulos.
El navegador completó las 30 lecciones desde cero en escritorio y móvil. La
suite general recorrió 136 lecciones y 338 actividades. También pasaron las
comprobaciones automatizadas de accesibilidad, lectura de teoría, migración
de caché y conservación del progreso anterior.
