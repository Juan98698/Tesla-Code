# Mantener el contenido técnicamente vigente

## Base verificada

La revisión del 6 de noviembre de 2026 contrasta calendarios y referencias oficiales. El proyecto utiliza Node 24/26, recomienda 26.13.0 y fija sus archivos de selección de versión. Node 20 terminó soporte y ya no se admite en `package.json`. Node 22 sigue soportado según su calendario, pero esta edición concentra sus pruebas en dos líneas más recientes.

Los ejemplos de la biblioteca estándar de Python se ejecutaron con 3.12.14 y 3.15.2. La preferencia para nuevos entornos es 3.15.2; mantener la prueba en 3.12 permite comprobar compatibilidad con una línea todavía en soporte de seguridad. Los límites de octubre de los PEP se registran conservadoramente con el primer día del mes.

Se probaron Node 24.22.2 y 26.13.0. Sus distribuciones locales se descargaron desde nodejs.org y se verificaron con los checksums oficiales. Las acciones de CI se actualizaron a referencias v7 verificadas, fijadas por SHA, con runtime Node 24 y permisos de lectura.

## Fuentes y versiones sin atribuciones falsas

`content/technology-policy.json` contiene fuentes, fecha de verificación, plazo máximo de revisión y versiones de catálogo de 22 referencias. React, Next.js, Transformers, Diffusers, PyTorch y las demás bibliotecas están identificadas como **referencias**, no como dependencias instaladas de esta aplicación ni como cursos técnicos ya ejecutados.

Las pruebas de la plataforma usan sus dependencias reales de `package-lock.json`. Las pruebas de contenido ejecutan los ejemplos Python y Git. No se ha entrenado un modelo, ejecutado una GPU o probado todas las APIs mencionadas en los mapas; esas verificaciones corresponden a las lecciones técnicas cuando se desarrollen.

Cada tema declara `technologyRefs`. Una lección publicada añade `technicalReview` con fechas, alcance de pruebas y huella de sus referencias. Cambiar una versión de referencia o el runtime relevante obliga a revisar la huella de las lecciones afectadas. Las revisiones de Python no se invalidan por un cambio no relacionado de React.

## Controles automáticos

- `npm run validate` comprueba también soporte y contratos técnicos, además del grafo y las revisiones pedagógicas.
- `npm run technology:check` comprueba fechas, fuentes, referencias de temas y versiones preferidas.
- `npm run technology:check -- --online` consulta el calendario y los parches de Node, y los registros oficiales npm/PyPI. Un cambio produce una solicitud de revisión en la salida y un fallo del control. No se considera saludable una fuente que no responde.
- `technology-watch.yml` ejecuta el contraste semanalmente y permite iniciarlo manualmente desde Actions. El calendario se activa cuando el workflow está en la rama predeterminada.
- Dependabot propone actualizaciones mensuales de herramientas npm y acciones GitHub. Las propuestas deben pasar CI; no se fusionan automáticamente.

La revisión técnica dura como máximo 180 días para fundamentos y estándares, 90 días para herramientas estables, 60 para Next.js y 30 para referencias de IA que cambian rápido. Las fechas vencidas hacen fallar la validación; no se prolongan al ejecutar los tests.

## Procedimiento para revisar una referencia

1. Lee las fuentes oficiales, notas de versión, cambios de soporte y deprecaciones. Evalúa si cambió la recomendación, no solo el número.
2. Si hay ejemplos o SDK, fija sus versiones, reproduce sus pasos y contrasta salidas, errores y costos pertinentes. Registra únicamente lo realmente probado.
3. Ajusta objetivos, requisitos, explicaciones y ejercicios afectados. Distingue fundamentos, herramientas recomendadas, alternativas y temas de investigación.
4. Actualiza versión de referencia, fuentes y fechas solo después de la revisión. Recalcula las huellas técnicas de las lecciones afectadas y registra notas concretas en la revisión pedagógica.
5. Ejecuta `npm run test:all`, las pruebas de compatibilidad y el contraste en línea. Publica por una pull request con las evidencias.

El chequeo de versiones no descubre por sí solo una deprecación comercial o un cambio de práctica. La fecha límite fuerza una revisión editorial periódica y el watcher aporta señales adicionales. Este mecanismo reduce la obsolescencia; no garantiza que toda publicación externa se refleje instantáneamente en el curso.
