# Verificación de la plataforma

## Comandos

- `npm test`: pruebas unitarias de dominio, componentes DOM, widgets, repositorios y controlador; más pruebas de regresión de las herramientas pedagógicas.
- `npm run test:coverage`: Node 24/26; genera `coverage/lcov.info` y verifica que los 23 módulos de `js/` aparezcan en la cobertura. El informe no sustituye las aserciones.
- `python3 tests/python-examples.py`: ejecuta 37 ejemplos Python y el ejercicio Git en directorios temporales, contrasta salida esperada y comprueba contratos de los proyectos. Los ejemplos declarados deben coincidir con el código mostrado.
- `npm run test:cache`: navegación con módulos/estilos/datos antiguos realmente cacheados, seis entradas libres y preservación del perfil anterior.
- `npm run test:module`: piloto de 17 lecciones iniciales sin progreso artificial, en escritorio y móvil.
- `npm run test:access`: entradas independientes en las seis rutas, orientación y repasos sin créditos, preferencia con experiencia, secuencia interna, movimiento reducido y doce auditorías WCAG adicionales en escritorio/móvil.
- `npm run test:e2e`: renderiza todas las lecciones publicadas y resuelve sus prácticas; verifica navegación, desbloqueos, persistencia, descarga, simuladores, diseños y accesibilidad.
- `npm run test:all`: ejecuta el validador, control técnico local, cobertura, ejemplos, piloto, acceso independiente y recorrido general.
- `npm run technology:check -- --online`: consulta fuentes oficiales y devuelve un fallo si cambian referencias o falta evidencia. No instala ni renueva versiones.

Para las pruebas de navegador usa Chromium del sistema o instala el navegador de Playwright siguiendo README. Los servicios de pruebas se cierran al terminar. Los proyectos Python y Git no tocan el repositorio del estudiante ni sus archivos.

## Cobertura y alcance

Se exige globalmente al menos 90 % de líneas, 85 % de ramas y 90 % de funciones. Cada módulo debe aparecer en LCOV y alcanzar 80 % de líneas, 60 % de ramas y 80 % de funciones; un módulo nuevo sin pruebas hace fallar el control. La política tiene sus propias pruebas de archivo ausente y umbrales incumplidos. CI ejecuta Node 24 y 26, y los ejemplos Python se prueban con 3.12 y 3.15.

El dominio cubre migración y almacenamiento inválido, intentos, mejor puntuación, evidencia reciente, XP acotado, requisitos entre rutas, corrección, días de racha y límites del intérprete. Las pruebas DOM verifican interacción y contratos de componentes, sin sustituirlos por copias de su implementación. Los casos del controlador se aíslan por proceso para evitar contaminación de cachés y para medir el mismo módulo sin variantes artificiales de URL.

La suite general de navegador utiliza una fixture explícita de finalizaciones para inspeccionar todas las lecciones; eso no representa haber cursado toda la academia. El piloto sí avanza desde cero. Los escaneos WCAG automáticos no sustituyen pruebas con lectores de pantalla o participantes. Las prácticas breves no certifican la entrega completa de los proyectos de programación.

## Añadir contenido y código

Cada nuevo comportamiento necesita casos de éxito, error y límites pertinentes. Un ejemplo Python ejecutable se declara en `examples` con `id`, `language`, `code` y `stdout`; el runner exige que el código coincida con un bloque de la lección. Amplía los casos del proyecto cuando cambien sus reglas. No renueves revisiones pedagógicas solo para silenciar errores: vuelve a contrastar teoría, ejemplo y evaluación.
