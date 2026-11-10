# IA generativa: recorrido, enseñanza y verificación

Decisión del usuario y revisión asistida del 10 de noviembre de 2026. La ruta comienza sin programación ni matemáticas previas. LLM, modelos de difusión y NCM son contenido central. IA generativa conecta las familias; no se obliga a combinarlas cuando una tarea no las necesita.

El mapa contiene **96 temas en 13 bloques**. Están publicadas las **13 lecciones de exploración**, con 52 prácticas, 39 casos de análisis que incluyen 95 decisiones y 68 preguntas. Las otras **83 lecciones siguen en preparación**: su presencia en el mapa no representa contenido ni integración disponible. Se conservan los 73 IDs anteriores y se añaden 23 pasos; no se eliminan temas para mejorar porcentajes.

## Secuencia y dependencias

1. **Comprender y comprobar:** programa, entradas y salidas; modelos; datos, entrenamiento e inferencia; probabilidad introductoria; LLM; instrucciones; contexto y recuperación; evaluación y proyecto documental.
2. **Exploración visual y conceptual:** píxeles y semillas antes de difusión; vectores, codificación y reconstrucción antes de NCM/LCM; proyecto de selección y justificación.
3. **Programación para aplicaciones:** aritmética; ejecución y datos en JavaScript; decisiones; repeticiones; funciones; colecciones; errores y módulos; asincronía; HTTP y protección de credenciales; vectores para recuperación.
4. **Aplicaciones generativas:** instrucciones; APIs; contratos y herramientas; seguridad; geometría de embeddings; contexto; búsqueda, recuperación y RAG; evaluación; agentes y multimodalidad. La seguridad precede a acciones y herramientas autónomas.
5. **Python para estudiar modelos:** ejecución, valores y nombres; control; colecciones; funciones, archivos y errores; entornos científicos; cliente HTTP. La sintaxis no se presupone por haber aprendido JavaScript.
6. **Matemáticas y cálculo:** álgebra y funciones; probabilidad; estadística; álgebra lineal; NumPy; cálculo y optimización; pandas. Cada herramienta utiliza operaciones presentadas previamente.
7. **Datos:** visualización, limpieza, separación y características. La separación de conjuntos precede a transformaciones que puedan producir fuga de información.
8. **Aprendizaje automático:** métricas, modelos de referencia, regresión, clasificación, árboles, métodos adicionales, generalización y proyecto predictivo.
9. **Redes:** neuronas, pérdida y entrenamiento; tensores y autograd; regularización; convolución; representaciones latentes; secuencias; atención y Transformers; proyecto.
10. **LLM en profundidad:** corpus y objetivos; arquitectura; adaptación; alineación y preferencias; evaluación y contaminación; inferencia eficiente; proyecto de asistente con casos reproducibles.
11. **Difusión técnica:** procesos directo e inverso; arquitecturas y latentes; flow matching; muestreo y condicionamiento; adaptación, evaluación y proyecto visual. Requiere probabilidad, optimización y redes, además de la exploración inicial.
12. **NCM/LCM:** representaciones de frases y SONAR; predicción conceptual; difusión semántica; evaluación; proyecto comparativo con generación por tokens. La variante basada en difusión exige haber estudiado su fundamento técnico.
13. **Productos y operación:** sesgos y revisión de impacto; reproducibilidad y MLOps; servicio de inferencia; despliegue; observabilidad y recursos; privacidad y condiciones de uso; proyecto final.

En esta ruta NCM significa Modelado de Conceptos Siguientes. LCM identifica el trabajo concreto de Meta; su concepto operacional es una frase representada en SONAR. El nombre no demuestra comprensión humana ni superioridad universal. Las fuentes del trabajo y de las herramientas se contrastan al publicar cada lección.

`progressionRequires` expresa el orden de estudio. `dependsOn`, `requiresConcepts` y `dependencyRationale` identifican los conocimientos usados. Los conceptos se registran con su punto de introducción; el orden, los ciclos, las referencias y la publicación de los pasos previos se validan automáticamente. Esto no sustituye la revisión semántica del contenido.

## Patrón obligatorio de cada lección

| Paso                   | Evidencia que debe producir                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Explicación desde cero | Definiciones, propósito, límites y conocimientos requeridos. Las siglas se explican antes de depender de ellas.                         |
| Ejemplo resuelto       | Problema, razonamiento, resultado y condiciones visibles. Los números inventados se identifican.                                        |
| Comprensión            | Predicción o distinción inicial, sin otorgar dominio por abrir una pista.                                                               |
| Práctica guiada        | Aplicación a un caso con datos suficientes y ayuda progresiva.                                                                          |
| Error para corregir    | Identificación de la causa y corrección coherente con el contrato.                                                                      |
| Reto independiente     | Situación nueva con criterios de aceptación y una entrega comprobable.                                                                  |
| Comprobación           | Preguntas asociadas a los conceptos explicados; todos los ejercicios y al menos 80 % del cuestionario para completar una lección nueva. |

En la exploración, las tres prácticas posteriores a la comprensión utilizan `case-study`: situación, documentos o registros, decisiones y devoluciones. La aceptación exige todas las decisiones correctas; una respuesta parcial muestra qué revisar. Se barajan las opciones conservando su identidad. El informe final reúne las decisiones con las justificaciones de referencia y se puede seleccionar y copiar.

Este motor evalúa un **análisis estructurado**, no interpreta escritura libre ni califica un prompt por coincidencia de palabras. Los retos tienen casos nuevos y distractores asociados a errores concretos. La explicación oral o escrita con palabras propias necesita revisión humana y se solicita como complemento. El proyecto documental y el de selección de solución producen informes que conectan hechos, criterios, fallos y alcance de la conclusión.

## Alcance de los laboratorios

- Token-lab segmenta texto de forma ilustrativa; no calcula tokens facturados ni precios.
- El laboratorio visual mezcla una figura y ruido fijos; no entrena ni ejecuta difusión o flow matching.
- Los casos contienen documentos y salidas preparados. No se atribuyen inferencias, embeddings ni experimentos LCM ejecutados por el navegador.
- La exploración no descarga pesos ni runtimes de modelos y no necesita claves, cuentas ni datos personales.
- Las integraciones reales y los experimentos técnicos solo se publicarán con instrucciones de entorno, límites de recursos, contratos, fuentes y resultados comprobados.

## Conservación y revisión

Las nueve URLs publicadas anteriormente conservan sus IDs y su historial. No se borran XP ni finalizaciones históricas. Los cuatro pasos añadidos tienen identidades nuevas y no se acreditan por logros anteriores. Una finalización antigua conserva su significado histórico; no demuestra haber realizado las actividades agregadas. Para una lección sin finalizar se exigen ahora las cuatro prácticas.

Las nueve lecciones revisadas salen de la excepción editorial y las cuatro nuevas cumplen los requisitos de publicación. Las revisiones de mapa y lecciones son **asistidas**, con huellas del contenido actual. La revisión independiente y el piloto con principiantes siguen pendientes. Los temas técnicos en preparación necesitan su propia autoría y revisión antes de publicarse.

La aceptación incluye validación de contenido, pruebas del motor de casos, progresión desde cero en navegador, conservación de progreso, móvil, teclado y accesibilidad automática. Las pruebas estructurales no certifican ausencia absoluta de vacíos: los hallazgos de docentes y principiantes deben incorporarse al grafo y a las explicaciones.

## Inventario del mapa

El listado siguiente corresponde a los IDs del catálogo; el estado visible diferencia publicación y preparación.

### 01 · Comprender IA y aprender a comprobar

Empezar sin código, distinguir datos y modelos y practicar con evidencia.

- Qué es la inteligencia artificial — publicada (`que-es-la-inteligencia-artificial`).
- Datos, entrenamiento e inferencia — publicada (`datos-entrenamiento-e-inferencia`).
- Azar, porcentajes y elecciones: preparar la generación — publicada (`probabilidad-para-generacion`).
- LLM: tokens, contexto y generación — publicada (`llm-tokens-y-contexto`).
- Instrucciones claras y verificación — publicada (`prompts-y-verificacion`).
- Contexto, memoria y recuperación — publicada (`contexto-memoria-y-recuperacion`).
- Evaluar un sistema generativo — publicada (`evaluar-sistemas-generativos`).
- Proyecto: auditar un asistente documental — publicada (`proyecto-asistente-documental`).

### 02 · Difusión, NCM y un proyecto comparativo

Explorar las familias generativas con los conceptos necesarios y límites explícitos.

- Antes de generar imágenes: píxeles, ruido y semillas — publicada (`imagenes-pixeles-y-semillas`).
- Difusión: del ruido a una señal — publicada (`difusion-de-ruido-a-imagen`).
- De frases a números: representar y reconstruir — publicada (`frases-vectores-y-significado`).
- NCM: conceptos siguientes y Large Concept Models — publicada (`conceptos-siguientes-y-lcm`).
- Proyecto: elegir y justificar una solución generativa — publicada (`elegir-proyecto-ia`).

### 03 · Programar aplicaciones desde cero

Preparar cada construcción de JavaScript, HTTP y los cálculos necesarios antes de integrar servicios.

- Números, proporciones y unidades para experimentar — en preparación (`aritmetica-para-ia`).
- JavaScript: ejecutar, nombrar y convertir datos — en preparación (`javascript-valores-para-ia`).
- JavaScript: condiciones y decisiones — en preparación (`javascript-decisiones-para-ia`).
- JavaScript: repetir y recorrer datos — en preparación (`javascript-repeticiones-para-ia`).
- JavaScript: funciones y contratos — en preparación (`javascript-funciones-para-ia`).
- JavaScript: listas, objetos y datos estructurados — en preparación (`javascript-colecciones-para-ia`).
- JavaScript: errores, módulos y pruebas pequeñas — en preparación (`javascript-errores-y-modulos-para-ia`).
- JavaScript: promesas y operaciones asíncronas — en preparación (`javascript-asincronia-para-ia`).
- HTTP, JSON y clientes de modelos en JavaScript — en preparación (`http-y-javascript-para-ia`).
- Preparar embeddings: coordenadas y producto punto — en preparación (`vectores-para-recuperacion`).

### 04 · Construir aplicaciones generativas

Aplicar modelos con contratos, evidencia, permisos y evaluación antes de automatizar acciones.

- Ingeniería de prompts — en preparación (`ingenieria-de-prompts`).
- APIs de modelos — en preparación (`apis-de-modelos`).
- Salidas estructuradas y herramientas — en preparación (`salidas-estructuradas-y-herramientas`).
- Seguridad de aplicaciones con IA — en preparación (`seguridad-de-aplicaciones-con-ia`).
- Geometría básica de embeddings — en preparación (`geometria-de-embeddings`).
- Ingeniería de contexto y memoria — en preparación (`ingenieria-de-contexto`).
- Embeddings y búsqueda semántica — en preparación (`embeddings-y-busqueda-semantica`).
- Búsqueda híbrida y reranking — en preparación (`recuperacion-hibrida-y-reranking`).
- RAG — en preparación (`rag`).
- Evaluación de recuperación y respaldo — en preparación (`evaluacion-de-recuperacion`).
- Agentes — en preparación (`agentes`).
- Evaluación de herramientas y agentes — en preparación (`evaluar-herramientas-y-agentes`).
- Modelos multimodales — en preparación (`modelos-multimodales`).
- Evaluar aplicaciones con LLM — en preparación (`evaluar-aplicaciones-con-llm`).

### 05 · Python y herramientas para estudiar modelos

Aprender la sintaxis necesaria y preparar un entorno reproducible sin depender del curso antiguo.

- Python desde cero: programa, valores y nombres — en preparación (`python-primer-programa-ia`).
- Python: decisiones y repeticiones explicadas — en preparación (`python-control-ia`).
- Python: colecciones, índices y recorridos — en preparación (`python-colecciones-ia`).
- Python: funciones, módulos, archivos y errores — en preparación (`python-funciones-y-archivos-ia`).
- Python para ciencia de datos — en preparación (`python-para-ciencia-de-datos`).
- HTTP, JSON y clientes de modelos en Python — en preparación (`http-y-python-para-ia`).

### 06 · Matemáticas y cálculo con datos

Pasar de aritmética a álgebra, probabilidad, estadística, matrices y optimización con ejemplos comprobables.

- Álgebra, funciones y notación para IA — en preparación (`algebra-y-funciones-para-ia`).
- Probabilidad — en preparación (`probabilidad`).
- Estadística — en preparación (`estadistica`).
- Álgebra lineal esencial — en preparación (`algebra-lineal-esencial`).
- NumPy y vectorización — en preparación (`numpy-y-vectorizacion`).
- Cálculo y optimización — en preparación (`calculo-y-optimizacion`).
- pandas y análisis de datos — en preparación (`pandas-y-analisis-de-datos`).

### 07 · Preparar datos sin contaminar la evaluación

Limpiar, visualizar y separar datos antes de entrenar; documentar decisiones.

- Visualización de datos — en preparación (`visualizacion-de-datos`).
- Limpieza y exploración — en preparación (`limpieza-y-exploracion`).
- Dividir y evaluar datos — en preparación (`dividir-y-evaluar-datos`).
- Ingeniería de características — en preparación (`ingenieria-de-caracteristicas`).

### 08 · Aprendizaje automático y modelos de referencia

Construir bases de comparación, medir generalización y justificar la selección.

- Métricas y validación — en preparación (`metricas-y-validacion`).
- Regresión lineal y logística — en preparación (`regresion-lineal-y-logistica`).
- Árboles y bosques — en preparación (`arboles-y-bosques`).
- Boosting — en preparación (`boosting`).
- Métodos por distancia y márgenes — en preparación (`metodos-por-distancia-y-margenes`).
- Aprendizaje no supervisado — en preparación (`aprendizaje-no-supervisado`).
- Sobreajuste y selección de modelos — en preparación (`sobreajuste-y-seleccion-de-modelos`).
- Proyecto: modelo predictivo — en preparación (`proyecto-modelo-predictivo`).

### 09 · Redes y representaciones aprendidas

Entender pérdida, optimización y arquitecturas antes de usar frameworks y modelos mayores.

- Redes neuronales — en preparación (`redes-neuronales`).
- Entrenamiento — en preparación (`entrenamiento`).
- PyTorch — en preparación (`pytorch`).
- Regularización y buenas prácticas — en preparación (`regularizacion-y-buenas-practicas`).
- Redes convolucionales — en preparación (`redes-convolucionales`).
- Representaciones latentes y autoencoders — en preparación (`representaciones-latentes`).
- Secuencias y texto — en preparación (`secuencias-y-texto`).
- Transformers y atención — en preparación (`transformers-y-atencion`).
- Proyecto: clasificador con aprendizaje profundo — en preparación (`proyecto-clasificador-con-aprendizaje-profundo`).

### 10 · LLM: funcionamiento, adaptación y eficiencia

Profundizar en atención, objetivos de entrenamiento, alineación, adaptación y pruebas.

- Datos y objetivos de preentrenamiento de LLM — en preparación (`datos-y-preentrenamiento-llm`).
- Cómo funcionan los LLM — en preparación (`como-funcionan-los-llm`).
- Ajuste fino — en preparación (`ajuste-fino`).
- Alineación, preferencias y límites de los evaluadores — en preparación (`alineacion-y-preferencias-llm`).
- Evaluar LLM: cobertura, contaminación y regresiones — en preparación (`evaluacion-y-contaminacion-llm`).
- Inferencia eficiente y evaluación de costos — en preparación (`inferencia-y-optimizacion-llm`).
- Proyecto: asistente con LLM y evaluación reproducible — en preparación (`proyecto-asistente-llm`).

### 11 · Ingeniería de modelos de difusión

Implementar y evaluar generación visual después de probabilidad, redes y espacios latentes.

- Procesos directo e inverso — en preparación (`procesos-directo-e-inverso`).
- Arquitecturas y espacios latentes — en preparación (`arquitecturas-difusion`).
- Flow matching y flujos rectificados — en preparación (`flow-matching-y-flujos-rectificados`).
- Muestreo y condicionamiento — en preparación (`muestreo-y-condicionamiento`).
- Ajuste y evaluación de generación visual — en preparación (`ajuste-y-evaluacion-difusion`).
- Proyecto: generación visual reproducible — en preparación (`proyecto-generador-visual`).

### 12 · NCM y Large Concept Models

Estudiar predicción en espacios de frases y su conexión con difusión sin atribuir comprensión humana.

- Embeddings de frases y SONAR — en preparación (`embeddings-de-frases`).
- Predicción del siguiente concepto — en preparación (`prediccion-conceptual`).
- Difusión en espacios de conceptos — en preparación (`difusion-en-conceptos`).
- Evaluación y límites de LCM — en preparación (`evaluar-lcm`).
- Proyecto: comparar predicción conceptual y generación por tokens — en preparación (`proyecto-prediccion-conceptual`).

### 13 · Productos, evaluación y operación

Integrar las familias estudiadas en proyectos con límites, evidencia, permisos y mediciones.

- Sesgos, equidad y ética — en preparación (`sesgos-equidad-y-etica`).
- MLOps — en preparación (`mlops`).
- Servir un modelo con un contrato HTTP — en preparación (`servicio-de-inferencia`).
- Despliegue de modelos — en preparación (`despliegue-de-modelos`).
- Observabilidad y costos — en preparación (`observabilidad-y-costos`).
- Normativa y privacidad — en preparación (`normativa-y-privacidad`).
- Proyecto final: producto con IA — en preparación (`proyecto-final-producto-con-ia`).
