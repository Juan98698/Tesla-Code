# Revisión editorial de Math y consultas de JavaScript

Revisión técnica asistida del 26 de noviembre de 2026, ampliada editorialmente el 27 de noviembre. Se contrasta la referencia de [Math en MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) con el catálogo y con ejecuciones reales. El alcance es el objeto Math documentado: 37 funciones y ocho constantes numéricas. La consulta reúne 111 entradas, con 78 lecciones reutilizadas y 33 fichas. Las fichas y talleres complementarios suman 168 actividades y 458 casos; no se cuentan aquí las actividades originales de las 78 lecciones.

La [revisión editorial de las 33 fichas](javascript-guide-editorial-review.md) amplía usos prácticos y separa la matemática especializada del recorrido desde cero.

## Cómo se localiza la evidencia

Los IDs corresponden a [javascript-guides.json](../content/learning/javascript-guides.json). sections contiene la explicación; example y examples, el código, su resultado u observación y el razonamiento; guided, bug y challenge conservan la práctica apoyada, reparación y situación nueva. practices contiene actividades adicionales identificadas, según lo que requiere cada tema. La [correspondencia complementaria](javascript-learning-topics.md) registra las bases y la secuencia completa de cada ficha.

mathCoverage localiza cada función en una sección, un ejemplo que la usa y una práctica comprobable. El validador analiza código con Acorn: escribir el nombre en un comentario no cuenta como ejemplo. La matriz automatizada detecta ausencias estructurales; la revisión del texto y de los casos debe valorar si enseñan lo prometido. Los ejercicios de integración de Math plantean otras situaciones numéricas; no sustituyen las entregas acumulativas del proyecto de Fundamentos.

## Funciones de Math

| Operación y fuente                                                                                                    | Explicación localizada                                               | Ejemplo ejecutable | Práctica localizada |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------ | ------------------- |
| [Math.abs()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/abs)               | `consulta-math-extremos`: «Distancia y dirección»                    | example            | `guided`            |
| [Math.acos()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acos)             | `consulta-math-angulos`: «Las funciones inversas»                    | example            | `math-inversas`     |
| [Math.acosh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acosh)           | `consulta-math-hiperbolicas`: «Deshacer la relación»                 | example            | `guided`            |
| [Math.asin()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asin)             | `consulta-math-angulos`: «Las funciones inversas»                    | example            | `math-inversas`     |
| [Math.asinh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asinh)           | `consulta-math-hiperbolicas`: «Deshacer la relación»                 | example            | `guided`            |
| [Math.atan()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan)             | `consulta-math-angulos`: «Las funciones inversas»                    | example            | `math-inversas`     |
| [Math.atanh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atanh)           | `consulta-math-hiperbolicas`: «Deshacer la relación»                 | example            | `guided`            |
| [Math.atan2()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2)           | `consulta-math-angulos`: «Una dirección con dos coordenadas»         | example            | `challenge`         |
| [Math.cbrt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cbrt)             | `consulta-math-potencias`: «Deshacer cuadrados y cubos»              | example            | `guided`            |
| [Math.ceil()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil)             | `consulta-math-redondeos`: «floor y ceil»                            | example            | `guided`            |
| [Math.clz32()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32)           | `consulta-math-enteros32`: «Contar ceros iniciales»                  | example            | `guided`            |
| [Math.cos()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cos)               | `consulta-math-angulos`: «Seno, coseno y tangente»                   | example            | `guided`            |
| [Math.cosh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cosh)             | `consulta-math-hiperbolicas`: «Otra familia de relaciones»           | example            | `guided`            |
| [Math.exp()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/exp)               | `consulta-math-logaritmos`: «La base natural»                        | example / examples | `challenge`         |
| [Math.expm1()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/expm1)           | `consulta-math-logaritmos`: «Valores cercanos a cero»                | example / examples | `challenge`         |
| [Math.f16round()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/f16round)     | `consulta-math-flotantes`: «f16round reduce más la precisión»        | example            | `guided`            |
| [Math.floor()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor)           | `consulta-math-redondeos`: «floor y ceil»                            | example            | `guided`            |
| [Math.fround()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround)         | `consulta-math-flotantes`: «fround conserva una fracción aproximada» | example            | `guided`            |
| [Math.hypot()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot)           | `consulta-math-potencias`: «Una distancia de varias dimensiones»     | example            | `challenge`         |
| [Math.imul()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul)             | `consulta-math-enteros32`: «Multiplicar con imul»                    | example            | `challenge`         |
| [Math.log()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log)               | `consulta-math-logaritmos`: «La base natural»                        | example / examples | `math-dominio-log`  |
| [Math.log1p()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p)           | `consulta-math-logaritmos`: «Valores cercanos a cero»                | example / examples | `challenge`         |
| [Math.log2()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2)             | `consulta-math-logaritmos`: «Deshacer una potencia»                  | example / examples | `guided`            |
| [Math.log10()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log10)           | `consulta-math-logaritmos`: «Deshacer una potencia»                  | example / examples | `guided`            |
| [Math.max()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max)               | `consulta-math-extremos`: «Comparar varios argumentos»               | example            | `guided`            |
| [Math.min()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/min)               | `consulta-math-extremos`: «Comparar varios argumentos»               | example            | `guided`            |
| [Math.pow()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow)               | `consulta-math-potencias`: «Una potencia cuenta factores»            | example            | `guided`            |
| [Math.random()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)         | `consulta-math-random`: «Qué devuelve random»                        | example / examples | `math-muestra-real` |
| [Math.round()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round)           | `consulta-math-redondeos`: «round y los empates»                     | example            | `guided`            |
| [Math.sign()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign)             | `consulta-math-extremos`: «Distancia y dirección»                    | example            | `guided`            |
| [Math.sin()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin)               | `consulta-math-angulos`: «Seno, coseno y tangente»                   | example            | `guided`            |
| [Math.sinh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh)             | `consulta-math-hiperbolicas`: «Otra familia de relaciones»           | example            | `guided`            |
| [Math.sqrt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sqrt)             | `consulta-math-potencias`: «Deshacer cuadrados y cubos»              | example            | `guided`            |
| [Math.sumPrecise()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sumPrecise) | `consulta-math-suma-precisa`: «Qué ofrece sumPrecise»                | example            | `guided`            |
| [Math.tan()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tan)               | `consulta-math-angulos`: «Seno, coseno y tangente»                   | example            | `math-tangente`     |
| [Math.tanh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tanh)             | `consulta-math-hiperbolicas`: «Otra familia de relaciones»           | example            | `guided`            |
| [Math.trunc()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc)           | `consulta-math-redondeos`: «trunc y los negativos»                   | example            | `guided`            |

## Constantes

Son propiedades numéricas, sin paréntesis. Se explican y se usan en los ejemplos de su familia; las prácticas de potencias, ángulos y crecimiento las aplican cuando corresponden al problema.

| Constante y fuente                                                                                            | Explicación localizada                               | Ejemplo |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------- |
| [Math.E](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/E)             | `consulta-math-logaritmos`: «La base natural»        | example |
| [Math.LN2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LN2)         | `consulta-math-logaritmos`: «Las constantes de base» | example |
| [Math.LN10](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LN10)       | `consulta-math-logaritmos`: «Las constantes de base» | example |
| [Math.LOG2E](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LOG2E)     | `consulta-math-logaritmos`: «Las constantes de base» | example |
| [Math.LOG10E](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LOG10E)   | `consulta-math-logaritmos`: «Las constantes de base» | example |
| [Math.PI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI)           | `consulta-math-angulos`: «Medir un giro»             | example |
| [Math.SQRT1_2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/SQRT1_2) | `consulta-math-potencias`: «Constantes y dominio»    | example |
| [Math.SQRT2](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/SQRT2)     | `consulta-math-potencias`: «Constantes y dominio»    | example |

## Decisiones y fronteras revisadas

- Redondeos: enteros, positivos, negativos y empates; floor y trunc no son equivalentes. El cero con signo se explica y se observa con Object.is.
- Extremos: magnitud frente a dirección, intervalo acotado, vacíos de min/max, NaN e infinitos. Pasar un arreglo es distinto de expandir sus elementos; se enlazan las bases antes de esa aplicación.
- Azar: muestra real en [0, 1), escala, desplazamiento, rango decimal, entero con máximo exclusivo y entero con ambos extremos incluidos. Se explica el sesgo de round y se prueban muestras preparadas. La aproximación de Number puede alcanzar una frontera tras una transformación decimal; la advertencia no cambia el contrato de Math.random. Los casos no certifican uniformidad ni aptitud criptográfica.
- Precisión: Number.isFinite/isInteger/isSafeInteger, NaN, Infinity, tolerancias, Number.EPSILON, presentación con toFixed y signo del cero. Las tareas no presentan EPSILON ni sumPrecise como solución universal para dinero.
- Potencias, raíces y crecimiento: signo, dominio real, unidades, inversas y desbordamiento. Las comparaciones aproximadas usan tolerancia o una presentación decimal explícita.
- Ángulos: radianes antes de seno/coseno/tangente, dominio y rango principal de inversas, orden (y, x) y cuadrante de atan2. Las singularidades se explican antes de excluirlas del contrato de una práctica.
- Representación: bits desde cero, signo, reducción a 32 bits y pérdida de información. fround y f16round conservan el tipo Number; no son truncamiento ni una conversión de la variable a otro tipo JavaScript.
- sumPrecise: cancelación, orden, colección vacía, tipos admitidos y precisión que ya se perdió en los datos de entrada. No se introduce un reemplazo silencioso mediante reduce.

## Métodos y estructuras de las consultas anteriores

Se revisan los contratos existentes sin duplicar lecciones ni modificar logros. e1/e2 y a1/a2/a3 son sufijos de los IDs indicados; «aplicar» es la actividad independiente. En la consulta, la práctica se guarda bajo topics/ y no acredita la entrega original.

| Consulta                     | Explicación y ejemplos                                                                               | Práctica y aplicación                          | Contraste conceptual                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| .map()                       | js-transformar-map: «Cómo funciona», «Ejemplo razonado» y «Otra escritura del mismo contrato»; e1/e2 | a1/a2/a3 y js-transformar-map-aplicar          | Callback, valor e índice, retorno, orden y nuevo arreglo; contraste con ciclo                  |
| .filter(), find, some, every | js-filtrar-encontrar: los mismos tres apartados; e1/e2                                               | a1/a2/a3 y js-filtrar-encontrar-aplicar        | Arreglo, valor o booleano; cero frente a ausencia y colección vacía                            |
| .reduce()                    | js-reducir-acumulador: los mismos tres apartados; e1/e2                                              | a1/a2/a3 y js-reducir-acumulador-aplicar       | Acumulador, retorno e inicial; colección vacía y contraste con ciclo                           |
| .includes()                  | consulta-includes: sections, example y ejemplo de texto normalizado                                  | guided/bug/challenge e includes-desde-posicion | Arreglo frente a texto, tipo, referencia, NaN, posición inicial y mayúsculas                   |
| .entries()                   | consulta-claves-valores y consulta-entries-iteradores: sections y example                            | guided/bug/challenge en ambas                  | Propiedad propia frente a índice y clave de Map; arreglo de pares frente a iterador consumible |
| Pilas                        | js-pila-de-cambios: tres apartados y e1/e2                                                           | a1/a2/a3 y js-pila-de-cambios-aplicar          | LIFO y conservación de historial al deshacer/rehacer                                           |
| Colas y recorridos           | js-pila-y-cola: tres apartados y «Una pila visita primero a los descendientes»; e1/e2/e3             | a1/a2/a3 y js-pila-y-cola-aplicar              | FIFO frente a LIFO; retirar primero/último y recorrido por niveles                             |

La matriz original de las 78 lecciones sigue en [fundamentos-correspondencia-editorial.md](fundamentos-correspondencia-editorial.md). Esta revisión no afirma cubrir todos los métodos de Array, todas las APIs del navegador ni todos los usos de las estructuras.

## Compatibilidad y revisión pendiente

La disponibilidad se detecta en el navegador del estudiante. Node 26.12.1 de esta comprobación no implementa sumPrecise; el Chromium de pruebas sí lo implementa. Las pruebas unitarias no lo sustituyen ni simulan su precisión: el recorrido del navegador ejecuta los ejemplos y prácticas reales. Si falta sumPrecise o f16round, se puede leer y escuchar la ficha, con un aviso de compatibilidad y sin ofrecer un ejecutor engañoso.

Implementados: contenido, relaciones, búsqueda, ejecución, pistas, borradores y aviso de compatibilidad. La verificación ejecutada se registra en [implementation-status.md](implementation-status.md). La revisión docente independiente y el piloto con principiantes siguen pendientes para contrastar claridad, ritmo, transferencia y retención. No se acredita comprensión por coincidencia de salida o por pasar CI, ni se promete ausencia absoluta de vacíos.
