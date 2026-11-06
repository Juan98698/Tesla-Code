# Piloto automatizado del módulo inicial

El módulo recorre las dos lecciones de Primeros pasos y las quince de Inicio, hasta la calculadora de propinas. Se ejecuta con `npm run test:module` en Chromium, usando contextos nuevos de escritorio (1440 px) y móvil (390 px). No inyecta lecciones aprobadas en localStorage.

## Escenarios verificados

- El inicio lleva a la primera lección y una URL adelantada respeta el bloqueo.
- Una respuesta de práctica incorrecta muestra retroalimentación; la pista ayuda a repetir y el acierto se conserva.
- Una comprobación fallida no completa la lección. Reintentar permite avanzar con una comprobación aprobada y la práctica resuelta.
- Se resuelven preguntas de selección, texto y orden con el orden de presentación barajado.
- Las preguntas con el mismo enunciado y programas distintos conservan identidad propia: las pruebas usan el ID de pregunta, no un enunciado ambiguo.
- Tras recargar se mantienen finalización y XP. Repetir un logro no concede la misma recompensa de nuevo.
- El simulador de variables llega a 21 y la calculadora calcula 22 por persona para el ejemplo de 80, 10 % y cuatro personas.
- Las 17 lecciones se completan consecutivamente, sin errores de JavaScript ni desbordamiento horizontal, y se desbloquea Condicionales.

El recorrido pasó en ambas anchuras. Las comprobaciones se repiten en CI. Esto comprueba el funcionamiento del módulo y la coherencia de sus transiciones, no la comprensión de una persona.

## Prueba pendiente con principiantes reales

Usa el mismo recorrido con participantes que no programen y registra, sin darles respuestas, si pueden distinguir guardar y ejecutar, explicar una asignación, predecir una traza y resolver una variación de la calculadora. Observa dónde piden ayuda, abandonan o aciertan sin poder explicar. Revisa después retención y transferencia a entradas nuevas. Esos resultados todavía no se han medido y no se presentan como aprobados.
