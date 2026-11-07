# Diagnóstico de producto, contenido y aprendizaje

Fecha: 7 de noviembre de 2026. Base revisada: `5dce437b01c4cc3ba5446cf98cf1143bfbb7e1a1`.

Este documento conserva la autocrítica del proyecto y contrasta las observaciones aportadas por el usuario con el repositorio. Su ejecución se organiza en el [plan de mejora](plan-mejora-plataforma.md). Los hallazgos confirmados, las hipótesis y las recomendaciones se distinguen expresamente. Guardar este diagnóstico no significa haber implementado sus propuestas.

## Juicio sobre el producto actual

TeslaCode es una plataforma funcional de aprendizaje guiado con una identidad visual definida, entradas independientes a seis rutas, explicaciones, comprobaciones, simuladores y progreso local. Una persona puede explorar, estudiar, predecir resultados, resolver actividades breves y reproducir ejemplos y proyectos Python en su equipo.

La principal distancia respecto a su promesa está entre recorrer contenido y producir soluciones autónomas. La plataforma todavía no observa el proceso de escribir, ejecutar y corregir programas del estudiante. Sus cuestionarios aportan evidencia limitada de comprensión; no permiten afirmar dominio profesional, transferencia o retención.

El catálogo es mucho más amplio que el contenido publicado. La estética y los mapas hacen visible una ambición que debe acompañarse con recorridos terminados, límites claros y actividades sustanciales. La prioridad es profundizar y cerrar experiencias completas de aprendizaje.

La revisión asistida anterior mejoró la entrada a Algoritmia y añadió controles útiles, pero no contrastó suficientemente la pertinencia semántica de las dependencias ni la exigencia real de las actividades. Que una dependencia exista y no forme ciclos no significa que sea pedagógicamente correcta. Esta es una deuda del trabajo realizado y debe corregirse, no justificarse con los resultados de CI.

## Línea base reproducible

Los estados proceden de `content/curriculum/*.json`; las lecciones, de `content/lessons/**/*.json`. Las palabras se cuentan extrayendo los nodos de texto del campo `html` y separando por espacios: incluyen código, glosarios y ayudas desplegables; excluyen cuestionarios y metadatos. Son un indicador de extensión, no una medida de calidad.

| Ruta           | Publicadas | Temas del mapa | Publicación |
| -------------- | ---------: | -------------: | ----------: |
| Fundamentos    |         68 |             68 |       100 % |
| Algoritmia     |          7 |             44 |      15,9 % |
| Frontend       |          2 |             59 |       3,4 % |
| Backend        |          2 |             49 |       4,1 % |
| Bases de datos |          2 |             50 |       4,0 % |
| IA             |          9 |             73 |      12,3 % |
| **Total**      |     **90** |        **343** |  **26,2 %** |

- Hay 253 temas planificados sin lección publicada.
- La media es 307,5 palabras por explicación; la menor tiene 151, en `fundamentos/listas-y-arreglos`.
- Las 90 lecciones contienen una actividad cada una, de respuesta textual. También hay cuestionarios; no deben confundirse con práctica de programación.
- 33 de 90 lecciones incluyen fuentes en su campo `sources`. Una URL presente tampoco prueba que respalde todas las afirmaciones de la lección.
- Algoritmia tiene explicaciones de entre 262 y 589 palabras. `medir-tiempo-y-memoria` no declara fuentes ni ejemplos de código ejecutables.
- Los cinco archivos CSS suman **4.567 líneas**, frente a las aproximadamente 4.300 estimadas en la observación externa. `components.css` tiene 1.740.
- Los dos PNG maestros suman 3.261.309 bytes, aproximadamente 3,26 MB. Los dos WebP de entrega suman 291.374 bytes, aproximadamente 285 KiB.
- Los archivos rastreados por Git suman 5.251.155 bytes. Este cómputo excluye historial Git, dependencias y archivos sin seguimiento; no equivale al peso de una visita al sitio.
- No se encontró un archivo de licencia en los archivos rastreados.
- El proyecto declara Node 24/26 y los prueba en CI. El entorno inspeccionado usa Node 24.22.1. No se volvió a ejecutar la suite completa para este diagnóstico documental.

## Contraste de las observaciones

| ID  | Observación                                                | Resultado del contraste                                                                                                                                                                                                 | Consecuencia                                                                                                                                                  |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 | Poca profundidad, una actividad y pocas fuentes            | **Confirmado** en las cifras anteriores. La extensión por sí sola no demuestra insuficiencia; la práctica actual sí ofrece poca evidencia de producción autónoma.                                                       | Revisar objetivos, explicaciones, errores comunes, casos y transferencia; evitar cuotas de palabras como criterio de aprobación.                              |
| D02 | Cobertura desigual y rutas que terminan pronto             | **Confirmado**: 90/343. Fundamentos está publicado al 100 %, lo que no acredita profundidad suficiente en todos sus temas.                                                                                              | Publicar módulos completos con resultados observables y mostrar disponibilidad real.                                                                          |
| D03 | Ausencia de licencia                                       | **Confirmado**. No hay un permiso general explícito de reutilización; afirmar que nadie puede hacer ningún uso es demasiado absoluto.                                                                                   | Resolver por separado código, contenido y recursos visuales con el titular.                                                                                   |
| D04 | PNG pesados y procedencia de la referencia visual          | **Confirmado** el tamaño y uso de WebP. La autorización y condiciones de la referencia no están documentadas en el repo. El usuario indicó que otra IA la generó; eso no basta para verificar todos los derechos.       | Registrar procedencia y condiciones; conservar maestros recuperables. Su peso afecta al repositorio, no directamente a las imágenes descargadas por el sitio. |
| D05 | Node 22 rechazado; Chromium y Python para CI               | **Confirmado** el rango admitido y las herramientas exigidas. No se verificó incompatibilidad funcional con Node 22; su rechazo es una política explícita. Ya existe `npm run check` sin navegador ni ejecución Python. | Facilitar el entorno soportado y distinguir comprobaciones rápidas de la suite completa; no debilitar CI ni prometer soporte sin probarlo.                    |
| D06 | Posible CSS duplicado o muerto                             | **Pendiente de auditoría**. El volumen está medido, la duplicación no está demostrada.                                                                                                                                  | Inventariar estilos, estados y uso antes de eliminar reglas.                                                                                                  |
| D07 | Buen comienzo conceptual de Algoritmia                     | **Confirmado**: problema, método, pseudocódigo y traza preceden a Python. Matemáticas precede a notación asintótica; razonamiento, a invariantes.                                                                       | Conservar esta progresión y comprobarla con principiantes.                                                                                                    |
| D08 | Dependencias falsas o ausentes                             | **Confirmado**: tablas hash exige conceptos de colas; grafos exige tries y consultas por rango. Los recorridos de grafos omiten requisitos explícitos de colas/pilas.                                                   | Separar orden del recorrido, requisitos de conocimiento y reglas de acceso. Revisar los seis mapas.                                                           |
| D09 | No hay ejecución real del código escrito por el estudiante | **Confirmado**: el intérprete admite un subconjunto numérico de pseudocódigo, no Python completo. Los ejemplos Python se prueban fuera del sitio.                                                                       | Añadir ejercicios ejecutables con devolución útil y una alternativa local documentada.                                                                        |
| D10 | Python o JavaScript a elección                             | **Confirmado el desajuste** entre la descripción de Algoritmia y sus ejemplos publicados.                                                                                                                               | Anunciar pseudocódigo y Python; ofrecer JavaScript solo cuando tenga contenido, corrector y pruebas equivalentes.                                             |
| D11 | Repetición con Fundamentos                                 | **Confirmado el solapamiento**. Una aplicación algorítmica puede reutilizar conocimientos sin repetir toda su enseñanza.                                                                                                | Crear contenido compartido y actividades aplicadas. Saltar lecciones automáticamente cambiaría el acuerdo de progresión vigente.                              |
| D12 | Faltan algoritmos avanzados                                | Los temas sugeridos son **ampliaciones pertinentes**, no vacíos obligatorios de toda formación inicial.                                                                                                                 | Ubicarlos después del núcleo con requisitos propios y carácter de profundización.                                                                             |
| D13 | Falta evaluación con docentes y estudiantes                | **Confirmado** por la auditoría existente. Pruebas técnicas y huellas no miden aprendizaje.                                                                                                                             | Revisión independiente, sesiones con distintos perfiles y comprobación posterior de retención.                                                                |

## Python dentro de Algoritmia

Es adecuado implementar algoritmos en un lenguaje real. Python facilita la lectura de ejemplos, pero debe quedar claro qué se está aprendiendo en cada momento: el diseño de una solución, la sintaxis para expresarla o su análisis.

La lección 5 explica asignación, listas, índices desde cero, `for`, `if`, sangría, salida y ejecución local. Ya permite seguir el ejemplo sin que el lector haya completado otra ruta. Sin embargo, responder qué imprime una lista distinta solo comprueba una predicción concreta.

La lección 6 reúne funciones, parámetros, retorno, factorial, recursión y terminación. Explica el código, pero su actividad pregunta únicamente `factorial(0)`. Hace falta consolidar funciones y traza de llamadas antes de dar por entendido el razonamiento recursivo. Las pruebas con estudiantes determinarán si debe dividirse en varias lecciones.

La recomendación es combinar:

1. **Fundamentos:** pensamiento lógico, datos, decisiones, repetición, descomposición, errores y herramientas iniciales.
2. **Python como recorrido propio:** aprender a escribir y organizar programas en el lenguaje, con ejercicios y proyectos progresivos.
3. **Algoritmia:** modelar problemas, diseñar soluciones, justificar corrección, implementarlas y analizar sus recursos.

No es necesario completar todo Python antes de entrar a Algoritmia. Las primeras lecciones conceptuales permanecen abiertas; al implementar se ofrece un puente con el subconjunto necesario. Tampoco hace falta conocer clases, decoradores, paquetes científicos o asincronía para empezar a resolver algoritmos.

El puente y la futura ruta Python deben reutilizar unidades canónicas de Fundamentos. Copiar sus textos en una séptima ruta generaría más deuda y un nuevo catálogo incompleto. También debe revisarse si el actual Fundamentos, que llega hasta SOLID, arquitectura y CI/CD, comunica bien la diferencia entre base inicial y profundización.

| Perfil                    | Entrada recomendada                                                     | Acompañamiento                                                              |
| ------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Nunca programó            | Fundamentos; también puede explorar la entrada conceptual de Algoritmia | Explicaciones graduales y Python esencial cuando necesite implementar.      |
| Ya usa Python             | Algoritmia directamente                                                 | Resolver práctica y comprobación de cada paso; repasos disponibles.         |
| Programa en otro lenguaje | Algoritmia directamente                                                 | Traducción breve de la sintaxis Python, diferencias de tipos y colecciones. |

## Otros límites de producto que se conservan en el diagnóstico

- **Progreso:** se guarda en el navegador y se puede exportar, pero no hay importación del respaldo ni sincronización. La recuperación merece prioridad antes que nuevas recompensas.
- **Proyectos:** incluyen indicaciones y casos para ejecución local; la plataforma no revisa automáticamente una entrega completa.
- **Devolución:** una coincidencia textual y una pista general ayudan poco a diagnosticar errores de razonamiento o código.
- **Motivación:** XP y rachas pueden acompañar la práctica; no acreditan dominio. Faltan tareas de transferencia y recuperación posterior de lo aprendido.
- **Móvil y accesibilidad:** disponer de una interfaz adaptable no demuestra que escribir código sea cómodo ni que el aprendizaje sea accesible. Deben probarse teclado, lector de pantalla, conexiones lentas y movimiento reducido.
- **IA:** las simulaciones locales no ejecutan modelos. Debe mantenerse clara la diferencia entre exploración conceptual, desarrollo de aplicaciones y entrenamiento/investigación. LLM, difusión y modelado de conceptos tienen fundamentos y grados de madurez diferentes.
- **Promesas:** títulos como «Experto», «completo» o una estética de IA deben describir alcance real y no sugerir certificación, tutor inteligente o capacidades inexistentes.

## Qué evidencia falta

No se puede garantizar «cero vacíos» mediante conteos, referencias o validadores. Para reducirlos hacen falta revisión semántica, ejercicios que exijan construir, observación de principiantes y correcciones continuas. Esta revisión no incluyó un nuevo piloto de usuarios, una auditoría visual de todos los estados ni una verificación legal de las imágenes.

El [plan de mejora](plan-mejora-plataforma.md) traduce cada hallazgo en entregables y criterios de aceptación. Ante nuevas observaciones se conservará esta línea base, se registrará evidencia y se ajustarán prioridades; no se marcará un problema resuelto solo por haber redactado una propuesta.
