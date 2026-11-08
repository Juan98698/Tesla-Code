# Publicar contenido con coherencia

1. Define el objetivo observable: qué podrá predecir, construir o explicar el estudiante.
2. Declara los conocimientos usados en `dependsOn` y `requiresConcepts` y justifícalos en `dependencyRationale`. `progressionRequires` expresa el orden obligatorio de la propia ruta. No copies automáticamente el tema anterior al grafo académico.
3. Registra los conceptos nuevos en `content/concepts.json`: `id`, `label`, `introducedBy`, `status`. Incluye sus IDs en `teaches` de la lección que los introduce. Reutiliza el ID al volver a evaluar un concepto existente.
4. Crea `content/lessons/<ruta>/<id>.json`. Incluye `outcome`, `html`, `requiresConcepts`, al menos cuatro preguntas, fuentes y tres prácticas que combinen comprensión, ayuda guiada y transferencia. Los IDs de preguntas y actividades deben ser estables para no otorgar XP de nuevo por un cambio de orden.
5. Agrega un ejemplo trabajado y una práctica de transferencia. No uses en el reto una operación que no hayas explicado. Si introduces una herramienta externa, explica cómo acceder a ella y cómo comprobar el resultado.
6. Las preguntas declaran `concept` con un ID del registro. Tipos: `choice` (`options`, `answer`), `order` (`steps`) o `text` (`answers`). `answer` indexa el orden original; la interfaz conserva esa identidad al barajar.
7. Las prácticas usan `text` (`answers`) o `python` (`starter`, `solution` y `cases`), con `hint` y `explanation`. Python ejecutable no es un tipo de pregunta del quiz. Para añadir otro motor hay que extender la vista, el adaptador, la validación y las pruebas.
8. Los widgets se registran en `js/widgets/index.js`. Explica qué simulan y sus límites. Si se montan dentro del HTML existente, conserva sus IDs de enlace; los widgets `*-lab` reciben un contenedor independiente.
9. Cambia `status` a `published` solo cuando archivo, requisitos, conceptos y actividades estén completos. Un requisito en preparación bloquea publicación. `kind: optional` identifica profundización: no puede ser paso obligatorio ni requisito académico de una lección principal.
10. Ejecuta `npm run check`, `npm run test:e2e` y `npm run format`. Revisa también exactitud, ambigüedad, accesibilidad y adecuación a una persona principiante.

`requiresConcepts` documenta conocimientos ya introducidos; el validador comprueba su procedencia por el grafo. No analiza semánticamente cada párrafo ni descubre requisitos omitidos por el autor. La revisión editorial debe contrastar explicación, ejemplo, práctica, evaluación y proyecto.

Las fuentes externas se enlazan con HTTPS en `sources`. Redacta contenido propio y respeta licencias; no copies cursos, gráficos o mapas de otras plataformas sin autorización.

`content/editorial-backlog.json` conserva 83 publicaciones heredadas que todavía requieren revisión de profundidad y fuentes. No se añaden publicaciones nuevas a esa excepción. Al revisar una, completa sus prácticas y referencias y retírala del registro. El mínimo de tres actividades es verificable, pero repetir tres preguntas equivalentes no cumple la intención pedagógica. La revisión debe juzgar qué aprende y transfiere cada una, sin imponer un número de palabras como prueba de calidad.

## Control obligatorio de publicación

Los mapas declaran `requiresConcepts` incluso para los temas en preparación. El validador exige que el punto de introducción del concepto sea un antecesor alcanzable y que no haya ciclos. Una lección publicada no puede depender de una que todavía esté en preparación.

Cada concepto en `teaches` de una lección publicada necesita una entrada `coverage` en su archivo de contenido:

```json
{
  "coverage": {
    "ruta.concepto": {
      "explanationExcerpt": "Fragmento literal de la explicación que define el concepto.",
      "assessmentIds": ["pregunta-especifica"]
    }
  }
}
```

El fragmento debe existir en el texto actual; las preguntas deben existir y declarar ese concepto. Esta es trazabilidad de explicación y evaluación, no una prueba automática de que el fragmento o la pregunta sean pedagógicamente suficientes. La práctica de la lección puede integrar varios conceptos y no equivale a una prueba independiente de cada uno.

`content/pedagogy-reviews.json` conserva una revisión explícita de cada mapa y lección publicada, con autor, notas y controles de requisitos, definiciones, ejemplos, evaluación, práctica y reglas de lenguaje. La huella incluye el contenido, su alcance, requisitos y conceptos utilizados. Si cambian, la revisión anterior deja de ser válida y CI falla.

Para una publicación o modificación:

1. Contrasta todos los conocimientos usados en explicación, código, actividad y quiz. Declara o enseña los que falten; no basta con que aparezcan en el título de otra lección.
2. Revisa definiciones, casos límite, supuestos de entrada, diferencias de lenguaje y coincidencia con el simulador. Comprueba los ejemplos en el lenguaje correspondiente.
3. Actualiza cobertura y realiza la revisión de los seis controles. Registra notas concretas y quién revisó, distinguiendo revisión asistida de revisión independiente.
4. Consulta `node tools/review-digests.mjs ruta/leccion` para la huella actual; para el mapa usa `node tools/review-digests.mjs ruta`. El comando solo informa: no aprueba ni firma automáticamente nada.
5. Actualiza la revisión después de revisarla, no para silenciar un error. Ejecuta `npm run check` y las pruebas de navegador. Los requisitos futuros también necesitan revisión del mapa.

La revisión inicial es asistida por Codex; su estado de revisión independiente se declara pendiente. Un hash vigente prueba que el contenido no cambió desde esa revisión, no que carezca de cualquier posible vacío conceptual. Al incorporar nuevos conocimientos detectados en pruebas con principiantes, actualiza el grafo, las explicaciones y las revisiones.

## Ejemplos ejecutables

Las lecciones declaran sus programas Python en `examples` con `id`, `language: "python"`, `code` y `stdout`. El código debe coincidir con el bloque mostrado; el runner lo ejecuta en un directorio temporal y comprueba la salida, además de los casos de contrato de los proyectos. Cada ejemplo compatible recibe automáticamente un panel «Probar este ejemplo en la consola». Para un lenguaje nuevo agrega primero un runner y sus pruebas. El ejercicio Git usa `gitExample` y se verifica en un repositorio temporal sin remotos.

Declara `stdin: ["dato", "otro dato"]` cuando el ejemplo requiera entradas iniciales para `input()`. Se muestran en el editor de entradas y se usan también al verificar el ejemplo con Pyodide. Si necesita capacidades locales como hilos, declara `environment: "local"` y un `environmentNote` que explique cómo ejecutarlo en el equipo. No marques como local un ejemplo para ocultar un error: contrasta la capacidad con las limitaciones del motor y conserva su comprobación con CPython. El entorno predeterminado es el navegador; `npm test` ejecuta todos sus ejemplos declarados con el motor fijado.

## Versiones, fuentes y revisión técnica

### Actividades de código real

Un contrato mínimo de programa con entradas y salida exacta:

```json
{
  "id": "sumar",
  "type": "python",
  "concept": "python.tipos-y-conversiones.2",
  "prompt": "Lee dos enteros y muestra su suma.",
  "starter": "# Escribe tu solución.\n",
  "solution": "a = int(input())\nb = int(input())\nprint(a + b)",
  "cases": [
    { "name": "Positivos", "stdin": ["2", "3"], "stdout": "5\n" },
    { "name": "Negativos", "stdin": ["-4", "-2"], "stdout": "-6\n" }
  ],
  "hint": "input devuelve texto; conviértelo antes de sumar.",
  "explanation": "La suma debe depender de ambas entradas."
}
```

`stdin` proporciona los textos de cada llamada a `input`; un mensaje como `input("Número: ")` forma parte de la salida. `globals` puede aportar variables del enunciado, como `{"datos": [-8, -3]}`, siempre explicando su procedencia. Para funciones, `entrypoint` identifica el nombre, y cada caso declara `args` y `expected`, comparados como valores JSON. No se comparan coincidencias textuales del código con la solución de referencia.

Toda actividad Python incorpora **Ejecutar código**, consola y entradas libres, además de **Comprobar ejercicio**. Ejecutar muestra la salida sin evaluar ni conceder progreso; comprobar usa exclusivamente los casos del autor y muestra sus resultados esperados y obtenidos. En una ejecución libre, una función debe llamarse explícitamente y `print()` muestra su resultado; definirla o devolver un valor con `return` no imprime por sí solo. Las entradas se escriben antes de ejecutar, una por línea; no se ofrece un terminal interactivo durante la ejecución. Cada programa empieza de nuevo y los archivos del navegador son temporales. Considera esas condiciones al redactar las instrucciones.

Usa varios datos cuando el contrato admita entradas variables; comprueba una solución equivalente y una implementación incorrecta representativa. No enseñes `input`, conversiones, índices o funciones por primera vez dentro del reto. `npm test` ejecuta todas las soluciones de referencia con el mismo runtime fijado; `npm run test:python` recorre el módulo en navegador real. Conserva las limitaciones de entorno y los supuestos visibles.

Todo tema declara `technologyRefs` con IDs de la política. Si está publicado, `technicalReview` debe incluir fechas vigentes, las mismas referencias, `policyDigest` y `testedVersions`. Una lista vacía significa que no se atribuye ejecución de un ejemplo dependiente de runtime. Las referencias de catálogo conservan `scope: reference-only`.

No copies una versión de catálogo al apartado de pruebas sin ejecutarla. Para afirmar compatibilidad de un SDK nuevo, amplía antes el formato de evidencia y el runner: actualmente las pruebas de contenido declaradas corresponden a ejemplos de la biblioteca estándar de Python. Las fechas no se renuevan automáticamente. Consulta `docs/technology-currency.md` para el procedimiento completo.

## Entrada independiente y repasos

`dependsOn` conserva el grafo académico. En ejecución, `progressionRequires` determina los pasos obligatorios; las referencias a otras rutas son recomendaciones. Toda lección publicada que utilice un concepto de otra ruta debe disponer de un `refresher` compartido en el registro del concepto: explicación, ejemplo y actividad con pista y devolución. El validador exige estos apoyos; se revisan junto a la lección mediante su huella semántica. Evita requisitos por haber completado un proyecto que no aporte conocimientos usados en el contenido.

La orientación inicial reutiliza tres preguntas de selección de la primera lección publicada. Si no hay tres, muestra que la orientación está en preparación y mantiene la entrada directa. Su resultado guía el acompañamiento y nunca concede progreso o créditos.

## Secuencia y ejemplos razonados

Cada ruta declara `entryApproach: "conceptual"`. Su primera lección publicada parte de cero, sin requisitos académicos previos ni bloques de lenguaje ejecutable. En Algoritmia el núcleo continúa en pseudocódigo después de problema, diseño y traza; Python es un laboratorio opcional con traducción instrucción por instrucción. La ruta Python enseña su lenguaje desde cero.

El orden visible debe colocar cada requisito interno antes de su consumidor. Un tema principal no puede exigir una especialización opcional. Las dependencias entre rutas siguen siendo recomendaciones acompañadas por repasos; no sustituyen una explicación necesaria.

Todo bloque `pre` declara `data-language`: `text`, `pseudocode`, `python`, `shell`, `http`, `sql`, `javascript` o `json`. La etiqueta identifica la representación, no habilita ejecución. Cada bloque Python requiere un ejemplo declarado con salida comprobable, ejecutado por CI.

Cada lección publicada incluye `learningDesign`:

```json
{
  "assumptions": ["Condiciones concretas de los datos o del entorno usadas en el ejemplo."],
  "workedExample": {
    "problem": "Fragmento visible que plantea una situación concreta.",
    "reasoning": "Fragmento visible que explica los pasos y por qué funcionan.",
    "result": "Fragmento visible con el resultado y su interpretación."
  },
  "transferActivityIds": ["aplicar"]
}
```

Los fragmentos y condiciones deben aparecer en el texto mostrado, y las actividades identificadas deben existir. `requiresConcepts` debe coincidir en mapa y contenido. Cada concepto evaluado se declara como enseñanza actual o requisito explícito: ya no basta con que aparezca en cualquier antecesor.

Estos controles rechazan omisiones verificables; no descubren automáticamente todo término sin explicar ni demuestran que una actividad transfiera conocimiento. Revisa las preguntas contra lo que realmente piden: por ejemplo, identificar `application/json` evalúa una cabecera, no el método HTTP. No registres una revisión mientras esa correspondencia no esté contrastada.
