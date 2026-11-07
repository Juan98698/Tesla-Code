# Auditoría teórica y conceptual

Se revisaron los seis mapas curriculares y las explicaciones, ejemplos, cuestionarios y prácticas publicados. La revisión es asistida por Codex y se registra con huellas en `content/pedagogy-reviews.json`. No se ha realizado una evaluación independiente con docentes ni una prueba de aprendizaje longitudinal con estudiantes.

La versión auditada contiene 343 temas en seis mapas, 90 lecciones publicadas y 299 conceptos introducidos con trazabilidad explicativa y evaluativa. Los 253 temas pendientes no se presentan como contenido ya validado.

## Revisión del 7 de noviembre de 2026

La observación sobre el `for` de la primera lección de Algoritmia reveló una limitación de la revisión anterior: declarar requisitos y ofrecer repasos no garantizaba una entrada gradual. Se revisaron de nuevo los seis mapas y las explicaciones y actividades publicadas. Se corrigieron estos hallazgos:

- **Algoritmia:** entrada sin Python; algoritmo y programa, terminación, método, pseudocódigo y traza antes de implementar. El método deja de estar después de invariantes. Se publican cinco lecciones adicionales, incluidas funciones y recursión antes de su análisis. La medición ya no anuncia Big O como siguiente lección cuando antes hay matemáticas.
- **Correspondencia conceptual:** la actividad de porcentaje evalúa porcentaje; la de memoria auxiliar evalúa memoria; `application/json` se asocia a cabecera; la latencia tiene definición, comprobación y punto de introducción propios, antes de observabilidad.
- **Requisitos:** se unifican las declaraciones del mapa y del archivo de contenido; el juego declara el retorno que ya utiliza su evaluación. Las primeras lecciones de todas las rutas carecen de requisitos previos.
- **Explicaciones:** se aclaran raíz cuadrada, pila/terminación, tupla de un elemento, retorno múltiple, excepciones deliberadas, operaciones JSON de texto/archivo, cancelación de suscripciones, filas SQLite y claves de caché. Se corrigen formulaciones sobre nombres locales, compilación e interpretación.
- **Entradas de especialidad:** se explican protocolo, URL, recursos web, API, JSON, autenticación/autorización, tabla/fila/identificador y esquema antes de pedir su aplicación. En IA se explican modelo, tokenizador, probabilidad y muestreo, ruido, codificación y regresión en el nivel introductorio correspondiente.
- **Ejemplos:** las 90 lecciones incluyen situación, razonamiento y resultado visibles, con condiciones explícitas y actividad identificada. No se presentan los ejercicios breves como entregas completas de proyectos.
- **Planificación futura:** accesibilidad antes de CSS/React; pruebas HTTP después de OpenAPI y antes de persistencia y arquitectura; seguridad de IA antes de agentes. Se retira el proyecto Python como requisito del contenido conceptual de prompts. La exfiltración se distingue de la contaminación de conjuntos de datos.

La revisión es asistida y cada lección conserva notas concretas y huella actual. El contenido aún no escrito conserva su estado en preparación; se revisó su orden y requisitos, no una suficiencia explicativa que todavía no se puede observar.

## Hallazgos corregidos en contenido disponible

| Hallazgo                                                                  | Corrección                                                                                                                                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comandos de Python y Git sin explicar la terminal ni el directorio actual | Nueva lección de terminal y rutas antes de ambos.                                                                                                                   |
| Cálculos monetarios sin discutir representación y reparto                 | Nueva lección de precisión, porcentajes y unidades; supuestos y restos explícitos en la calculadora.                                                                |
| `if not texto.strip()` sin explicar valores de verdad                     | Nueva lección de None, valores vacíos y validación.                                                                                                                 |
| Matrices compartidas y copias sin enseñar referencias                     | Nueva lección de referencias, mutación y copia superficial.                                                                                                         |
| Comprensiones de listas y `+=` antes de enseñar su sintaxis               | Se retiró la comprensión adelantada y se explicó la abreviatura.                                                                                                    |
| Confusión entre ámbito y destrucción del objeto                           | Se distingue visibilidad de nombres de vida de los objetos.                                                                                                         |
| Git anunciaba ramas y fusiones sin explicarlas                            | El alcance publicado se limita a repositorio y commit; ramas/fusiones tienen su propio módulo publicado.                                                            |
| Conceptos anunciados sin pregunta propia                                  | Se agregaron comprobaciones de software, almacenamiento, entero, llamada y commit.                                                                                  |
| Actividades etiquetadas por posición, no por lo preguntado                | Se enlazaron a los conceptos que realmente ejercitan; también se revisaron las asociaciones de preguntas y se añadieron comprobaciones específicas cuando faltaban. |
| Juego sin explicitar qué ocurre ante entradas inválidas                   | Se declaran supuestos, regla de sustitución del ciclo y diferencias entre pseudocódigo y widget; práctica de la condición lógica.                                   |
| Definiciones implícitas o terminología poco visible                       | Se agregaron explicaciones contextuales desplegables y fragmentos verificables por concepto.                                                                        |

## Hallazgos corregidos en la planificación

- **Fundamentos:** los cinco principios SOLID; ramas y fusiones antes de colaboración.
- **Algoritmia:** funciones, potencias y logaritmos antes de complejidad; inducción y contraejemplos antes de invariantes; jerarquías y montículos antes de heapsort.
- **Frontend:** sintaxis de control y funciones en JavaScript antes de callbacks/cierres; objetos antes de su uso avanzado. HTML/CSS antes de publicar.
- **Backend:** puente JavaScript antes de runtime y TypeScript; fundamentos criptográficos antes de autenticación; requisitos SQL y transaccionales entre rutas; FastAPI no bloquea la alternativa Node.
- **Datos:** dependencias funcionales antes de normalización; CREATE TABLE antes del proyecto de esquema; NULL y lógica ternaria; transacciones básicas antes de modificaciones; geometría antes de bases vectoriales.
- **IA:** HTTP/JSON/Python antes de clientes de modelos; geometría antes de embeddings; álgebra antes de cálculo; separación de datos antes de transformaciones; métricas antes de comparar modelos; latentes y atención como requisitos de arquitectura de difusión; LoRA antes de adaptación visual; servicio de inferencia antes de despliegue.

Estas correcciones de planificación no crean lecciones automáticamente: los temas pendientes siguen marcados en preparación. Su suficiencia teórica solo podrá revisarse cuando se escriban sus explicaciones, ejemplos y ejercicios.

## Controles que quedan activos

1. IDs de conceptos y un punto de introducción coherente con su estado.
2. Dependencias entre lecciones y requisitos conceptuales también para los temas futuros.
3. Detección de ciclos, referencias inexistentes y publicación sobre requisitos no disponibles.
4. Cobertura verificable de explicación y comprobación de cada concepto anunciado en las lecciones publicadas.
5. Prácticas con pistas y respuestas válidas; ejercicios enlazados a conceptos introducidos.
6. Revisión editorial ligada a la versión: cambiar el contenido o el currículo invalida la revisión anterior.
7. Pruebas de regresión que modifican copias del contenido y comprueban que CI rechaza saltos, explicaciones eliminadas y revisiones obsoletas.

También se ejecutaron los 39 ejemplos Python publicados en Python 3.12 y 3.15 y el ejemplo de ramas y fusión de Git en directorios temporales con entradas controladas y resultados esperados. Esta prueba corre en CI y comprueba las operaciones de lista, referencias, matrices, recursión, archivos, excepciones y los contratos de los proyectos.

## Alcance de la conclusión

Se corrigieron los vacíos identificados y los controles pasan sobre el contenido de esta versión. No se afirma una garantía absoluta: una coincidencia textual no demuestra comprensión, una pregunta no demuestra transferencia, y un requisito omitido por todos los autores no puede descubrirse solamente siguiendo el grafo. La revisión independiente y las pruebas con principiantes siguen siendo trabajo editorial necesario. Los errores futuros deben producir nuevas correcciones y pruebas, no una renovación automática de la huella.

## Acceso independiente y revisión de entradas

Las introducciones a Internet, cliente/servidor y datos básicos son autosuficientes y no requieren completar juegos o gestores de tareas en Python. Algoritmia empieza por diseño sin sintaxis Python. La implementación posterior explica Python, variables, asignación, listas, índices, recorridos y condiciones; los siete repasos compartidos siguen disponibles como apoyo. La validación obliga a proporcionar repasos para futuros conceptos transversales usados en lecciones publicadas.

Las referencias entre rutas permanecen en el grafo académico; el acceso exige los pasos de la propia ruta. La orientación opcional explora tres preguntas iniciales y sirve para recomendar acompañamiento, no para acreditar experiencia ni completar lecciones.

El control de publicación ahora rechaza código ejecutable en una entrada conceptual, requisitos distintos entre mapa y contenido, requisitos internos colocados después, un tronco principal dependiente de una especialización opcional, ejemplos sin razonamiento/condiciones visibles y bloques Python sin ejemplo comprobable. Las pruebas de regresión recrean esas omisiones. La asociación semántica entre una pregunta y su concepto sigue necesitando revisión editorial: los identificadores por sí solos no prueban esa relación.
