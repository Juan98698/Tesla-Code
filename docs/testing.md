# Verificación de la plataforma

## Comandos

- `npm test`: pruebas unitarias de dominio, componentes DOM, widgets, repositorios y controlador; más pruebas de regresión de las herramientas pedagógicas.
- `npm run test:coverage`: Node 24/26; genera `coverage/lcov.info` y verifica que todos los módulos de `js/` aparezcan en la cobertura. El informe no sustituye las aserciones.
- `npm run test:examples`: ejecuta 44 ejemplos Python publicados y el ejercicio Git en directorios temporales, contrasta salida esperada y comprueba contratos de los proyectos. Selecciona Python según el sistema y utiliza UTF-8. Las entradas simuladas conservan el comportamiento de los mensajes de `input`. Los ejemplos declarados deben coincidir con el código mostrado.
- `npm run test:cache`: navegación con módulos/estilos/datos antiguos realmente cacheados, entradas libres y preservación del perfil anterior.
- `npm run test:module`: piloto de 17 lecciones iniciales sin progreso artificial, en escritorio y móvil.
- `npm run test:access`: entradas independientes en las siete rutas, recorrido de las lecciones publicadas de Algoritmia sin inyectar progreso, orientación y repasos sin créditos, preferencia con experiencia, secuencia interna, movimiento reducido y auditorías WCAG en escritorio/móvil.
- `npm run test:python`: las siete lecciones iniciales desde cero en 1440 y 390 px, ejecución real, borradores, navegación durante un bucle, tiempo máximo, aislamiento del DOM/almacenamiento, auditoría automática en ambos temas e importación con vista previa/cancelación/deshacer e idempotencia.
- `npm run test:console`: consola en 1440 y 390 px con impresión, entradas personalizadas, sintaxis y excepciones con línea, ausencia de salida, cancelación y tiempo máximo conservando lo impreso; ejemplos de Fundamentos/Algoritmia/Python y accesibilidad en ambos temas. Comprueba que experimentar no concede progreso y que comprobar usa los casos del autor.
- `npm run test:e2e`: renderiza todas las lecciones publicadas y resuelve sus prácticas; verifica navegación, desbloqueos, persistencia, descarga, simuladores, diseños y accesibilidad.
- `npm run test:progress`: dos pestañas completan lecciones en paralelo y una tercera cambia de objetivo; verifica la conservación conjunta de logros y la ausencia de XP duplicado al repetir una comprobación.
- `npm run test:all`: ejecuta el validador, control técnico local, cobertura, ejemplos, piloto, acceso independiente, recorrido general, módulo Python, consola y progreso entre pestañas.
- `npm run technology:check -- --online`: consulta fuentes oficiales y devuelve un fallo si cambian referencias o falta evidencia. No instala ni renueva versiones.

Para las pruebas de navegador usa Chromium del sistema o instala el navegador de Playwright siguiendo README. Los servicios de pruebas se cierran al terminar. Los proyectos Python y Git no tocan el repositorio del estudiante ni sus archivos.

En Windows se detectan también Chrome y Edge instalados. `CHROMIUM_PATH`, `PYTHON` y `BASH_PATH` permiten seleccionar los ejecutables; para Git se evita confundir Git Bash con el lanzador de WSL. Las capturas usan la carpeta temporal del sistema. La prueba de acceso activa «Saltar al contenido» con teclado y comprueba que conserva la URL. El cuestionario espera el guardado antes de mostrar las acciones del resultado.

Las pruebas Python del navegador interceptan la URL de la CDN y sirven los archivos reales de `pyodide` instalados por npm: no sustituyen la ejecución por respuestas simuladas. Una aserción comprueba que la distribución instalada y la URL fijada tienen la misma versión. Esto elimina la variabilidad de la CDN en CI; no mide latencia de descarga en una conexión móvil real.

Las pruebas del corrector ejecutan soluciones de referencia, implementaciones incorrectas y funciones equivalentes. Cubren errores de sintaxis, excepciones, entradas insuficientes, mensajes de `input`, salida parcial y límite de salida. También ejecutan todos los ejemplos declarados para navegador —43 en esta edición— en directorios temporales separados de Pyodide, con sus entradas y salidas esperadas. Las unidades del adaptador cubren fallos de carga, cancelación, mensajes de otra ejecución, frecuencia/tamaño de salida y recuperación. La restauración comprueba copias corruptas, límites, versiones, persistencia fallida y recompensas únicas.

## Cobertura y alcance

Se exige globalmente al menos 90 % de líneas, 85 % de ramas y 90 % de funciones. Cada módulo debe aparecer en LCOV y alcanzar 80 % de líneas, 60 % de ramas y 80 % de funciones; un módulo nuevo sin pruebas hace fallar el control. La política tiene sus propias pruebas de archivo ausente y umbrales incumplidos. CI ejecuta Node 24 y 26, y los ejemplos Python se prueban con 3.12 y 3.15.

El dominio cubre migración y almacenamiento inválido, intentos, mejor puntuación, evidencia reciente, XP acotado, requisitos entre rutas, corrección, días de racha y límites del intérprete. Las pruebas DOM verifican interacción y contratos de componentes, sin sustituirlos por copias de su implementación. Los casos del controlador se aíslan por proceso para evitar contaminación de cachés y para medir el mismo módulo sin variantes artificiales de URL.

La suite general y la de consola utilizan una fixture explícita de finalizaciones para inspeccionar lecciones; eso no representa haber cursado toda la academia. El piloto y el recorrido Python sí avanzan desde cero. Los escaneos WCAG automáticos no sustituyen pruebas con lectores de pantalla o participantes. Las prácticas breves no certifican la entrega completa de los proyectos de programación.

## Añadir contenido y código

Cada nuevo comportamiento necesita casos de éxito, error y límites pertinentes. Un ejemplo Python ejecutable se declara en `examples` con `id`, `language`, `code` y `stdout`; el runner exige que el código coincida con un bloque de la lección. Amplía los casos del proyecto cuando cambien sus reglas. No renueves revisiones pedagógicas solo para silenciar errores: vuelve a contrastar teoría, ejemplo y evaluación.
