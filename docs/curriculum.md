# Currículo y recorrido

## Tronco común

1. Primeros pasos: archivo, carpeta, extensión, editor, ejecución y salida.
2. Inicio: máquina, información, algoritmos, variables, tipos, operadores, entrada/salida, legibilidad, trazas y depuración.
3. Básico: decisiones, lógica, ciclos, funciones, alcance y casos límite.
4. Puente: Python real, diferencias respecto al pseudocódigo y primeros commits con Git.
5. Intermedio: listas, matrices, cadenas, diccionarios, conjuntos, búsqueda, recursión, módulos, archivos, excepciones y proyecto de tareas.
6. Avanzado: clases, encapsulamiento, herencia, composición, programación funcional, complejidad, pruebas, ramas, revisión y proyecto de biblioteca.
7. Experto: patrones, los cinco principios SOLID, refactorización, arquitectura, concurrencia, rendimiento, seguridad, observabilidad, CI/CD y proyecto final.

Los siete niveles de Fundamentos están publicados: 68 lecciones. El piloto automatizado cubre las 17 lecciones de Primeros pasos e Inicio; no equivale a una prueba con estudiantes reales.

Todas las rutas permiten empezar por su primera lección publicada, con una entrada conceptual sin requisitos previos. Fundamentos es el comienzo recomendado para principiantes. Los pasos previos de la misma ruta regulan su progresión; las referencias a otras rutas documentan conocimientos recomendados y no bloquean el acceso. Los siete repasos compartidos de Python, variables, listas y condiciones aparecen al implementar en Algoritmia, después del diseño. La orientación opcional sugiere explicaciones o práctica sin conceder finalizaciones.

## Inicio de Algoritmia

1. Algoritmos: problema, pasos y resultado, sin código.
2. Método para resolver problemas.
3. Diseñar con secuencias, decisiones y repeticiones en pseudocódigo explicado.
4. Trazar y comprobar antes de programar.
5. Funciones, recursión y terminación, en pseudocódigo.
6. Medir tiempo y memoria, con un modelo de coste explícito.
7. Funciones matemáticas, potencias y logaritmos.
8. Big O, Ω y Θ.
9. Analizar ciclos y recurrencias.
10. Razonamiento, contraejemplos e inducción.
11. Corrección con invariantes.

Estas once lecciones están publicadas. Un duodécimo laboratorio opcional traduce el máximo a Python, explica la sintaxis desde cero y permite ejecutarlo con casos. Se habilita después de la traza y no bloquea el núcleo. El teorema maestro queda como profundización posterior a recurrencias e inducción. Los IDs anteriores se conservan, sin conceder finalizaciones artificiales.

`progressionRequires` conserva el orden de aprendizaje y `dependsOn`/`requiresConcepts` describen los conocimientos utilizados. En Algoritmia, los recorridos de grafos enlazan colas y pilas, Dijkstra enlaza prioridad y Kruskal ordenamiento. Grafos deja de exigir tries y tablas hash deja de exigir colas. La revisión semántica completa de los otros mapas heredados sigue pendiente.

## Python desde cero

El mapa tiene 67 temas en once bloques. Está publicado el primero: qué es un programa → ejecutar y leer → operaciones → variables → texto/entrada → tipos/conversiones → presupuesto. Son siete lecciones con tres actividades cada una; desde la segunda se ejecutan programas en el navegador. Los diez bloques siguientes continúan con control, colecciones, funciones/módulos, archivos, pruebas, entorno, objetos, mecanismos avanzados, integración y proyecto final.

No se exige haber cursado Fundamentos o Algoritmia. La introducción mínima de clases se sitúa antes de unittest; el modelado de objetos se profundiza después. Ordenar con `key` enseña explícitamente pasar una función como argumento. Los decoradores propios y los cierres se reservan para una etapa posterior. Los temas avanzados siguen en preparación: el mapa no se presenta como un curso completo ya disponible.

Se conserva el puente de Fundamentos como repaso disponible. No se acreditan automáticamente lecciones entre rutas: compartir conocimientos o un resultado de orientación no demuestra haber superado los nuevos objetivos y prácticas.

En las demás especialidades, accesibilidad precede a CSS y React, las pruebas HTTP de backend se aprenden después del contrato OpenAPI y antes de persistencia/arquitectura, y la seguridad de aplicaciones con IA precede a agentes y uso autónomo de herramientas. La exfiltración de datos privados se distingue de la contaminación entre datos de entrenamiento y evaluación.

## IA: distintos objetivos, distintas dependencias

La exploración inicial no exige código: modelos y datos, entrenamiento/inferencia, tokens/contexto, prompts/verificación, contexto/memoria/recuperación, evaluación por casos, difusión/flow matching, modelado de conceptos y selección de proyecto.

Después se separan recorridos técnicos:

- **Aplicaciones:** Python y datos del tronco común → APIs → salidas estructuradas/herramientas → geometría y gestión del contexto → embeddings → recuperación híbrida y reranking → RAG → evaluación de recuperación → agentes y evaluación de herramientas → multimodalidad. No exige recorrer toda la formación de entrenamiento de modelos.
- **Modelos:** Python científico → álgebra antes de NumPy → optimización, probabilidad y estadística → preparación de datos → ML → redes → Transformers → arquitectura y ajuste de LLM.
- **Difusión:** redes convolucionales e introducción a difusión → procesos directo/inverso → arquitecturas y espacios latentes → flow matching y flujos rectificados → muestreo/condicionamiento → adaptación y evaluación.
- **Conceptos:** arquitectura de LLM y embeddings → representaciones de frases/SONAR → predicción conceptual → difusión semántica (que también exige difusión técnica) → evaluación y límites.
- **Producción:** evaluación aplicada después de RAG. MLOps añade como requisito el proyecto predictivo; luego despliegue, costos, privacidad y proyecto final.

NCM se usa en la conversación como Modelado de Conceptos Siguientes. En el contenido se distingue ese enfoque de la familia concreta LCM del trabajo de Meta. Allí el concepto se representa mediante una frase codificada; no se equipara a razonamiento humano ni se anuncia reemplazo universal de LLM.

## Criterios de aprendizaje

Cada lección publicada debe aportar una explicación, ejemplo, práctica con pista, comprobación y objetivo concreto. La práctica y una comprobación >=80 % completan la lección. El puntaje por sí solo no demuestra transferencia ni retención a largo plazo.

Los proyectos de código incluyen criterios de aceptación y casos para reproducir localmente. Las prácticas breves de la plataforma comprueban partes concretas; no se presentan como revisión automática del proyecto completo. La revisión humana y pruebas de usabilidad con principiantes siguen siendo necesarias.

El mapa contiene más temas que las lecciones disponibles: se muestra el estado real de cada uno. La ampliación editorial debería continuar con los siguientes módulos de cada especialidad antes de habilitar dependencias posteriores.

## Actualidad técnica

Las lecciones y los temas en preparación enlazan tecnologías de `content/technology-policy.json`. Los contenidos disponibles tienen revisión técnica con fuentes, plazos y un alcance explícito de pruebas. La nueva planificación frontend distingue efectos externos, acciones de formularios, fronteras servidor/cliente, caché y revalidación. Backend presenta GraphQL/gRPC, microservicios y Kubernetes como especializaciones opcionales que no bloquean su tronco principal.
