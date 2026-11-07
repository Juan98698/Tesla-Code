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

Frontend y Bases de datos parten de Básico. Backend y Algoritmia requieren el proyecto de Intermedio. Las dependencias viven en los datos y se muestran al seleccionar un nodo.

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
