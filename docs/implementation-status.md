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

## Estado del plan completo

| Fase                           | Estado                    | Pendiente concreto                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0: alcance y confianza        | Parcial                   | Elegir licencias y documentar derechos de recursos; el inventario está en `assets-and-licensing.md`. No se concedieron derechos ni eliminaron maestros.                                                                                 |
| P1: grafo conceptual           | Parcial                   | Modelo separado en siete rutas; revisión semántica realizada para Algoritmia y el mapa Python. Falta contrastar las dependencias y profundidad de las restantes especialidades.                                                         |
| P2: Algoritmia/Python/práctica | Primer lote implementado  | Completar Python tras el presupuesto y Algoritmia tras invariantes, con la misma disciplina editorial y pruebas. La medición publicada explica conteos en pseudocódigo; un laboratorio de reloj necesita su propio diseño reproducible. |
| P3: aprendizaje y recuperación | Recuperación implementada | Revisión independiente, piloto con participantes, retención y ajustes derivados de evidencia real. No hay equivalencias automáticas de acreditación entre rutas.                                                                        |
| P4: catálogo                   | En desarrollo por módulos | 309 temas planificados pendientes; profundizar las 81 publicaciones heredadas restantes del registro editorial. Priorizar resultados integradores, sin rellenar lecciones para aumentar cifras.                                         |
| P5: mantenimiento              | Preparación               | Auditoría completa de CSS, medición en móviles/conexiones representativas, destino recuperable de PNG y ampliaciones avanzadas de algoritmos.                                                                                           |

## Siguiente lote

1. Python: comparaciones → decisiones → listas/índices → for → while → funciones → proyecto de resumen de datos. Explicar cada construcción antes del ejercicio y añadir casos de límite y fallos frecuentes.
2. Algoritmia: estructuras lineales y análisis de sus operaciones, manteniendo pseudocódigo como núcleo y código real como aplicación opcional.
3. Revisar Fundamentos empezando por listas, funciones, recursión, errores y proyectos; retirar entradas del registro editorial solo con evidencia.
4. Contrastar el módulo inicial con una persona docente y participantes de los perfiles previstos. Incorporar sus hallazgos antes de replicar el patrón sin cambios a todas las rutas.

Los puentes existentes se reutilizan como repasos. Las nuevas lecciones de Python responden a objetivos propios y no se acreditan automáticamente por coincidencia de títulos. El contenido no redactado permanece visible como planificación.
