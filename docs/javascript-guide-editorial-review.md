# Revisión editorial de las fichas JavaScript

Revisión técnica y editorial asistida del 27 de noviembre de 2026. Se revisan las 33 fichas del catálogo, sus enunciados, código, ejemplos, pistas y bases. Las 78 lecciones de Fundamentos conservan sus contratos, IDs, entregas y requisitos de avance. Esta revisión corrige las carencias detectadas en las fichas de consulta; no se utiliza el piloto como sustituto de preparar el material.

## Resultado y límites

Las fichas contienen problema, entrada, resultado, efecto sobre los datos, usos y criterios de elección. Cada primer ejemplo tiene un razonamiento; se agregan ejemplos cuando aparece otra forma o efecto que necesita demostración. Las fichas contienen 85 ejemplos; junto con los talleres, reúnen 168 actividades y 458 casos. Los ejemplos pertenecen a las fichas; la cuenta de actividades incluye los talleres anteriores y excluye las actividades originales de las 78 lecciones.

La correspondencia contiene 102 habilidades con explicación, ejemplo y práctica localizados. Cada ficha añade una aplicación con editor vacío que admite soluciones equivalentes. Los problemas de integración abarcan registros, reportes, compras, agenda y temporizadores. En la agenda se combinan inserciones, retiradas, reemplazo y consultas sobre una copia; sus casos comprueban que una consulta conserve su versión después de nuevos cambios. No se exige una cantidad uniforme de actividades por ficha.

Los IDs guided, bug y challenge conservan sus contratos originales. Las nuevas actividades tienen IDs propios. Los ejemplos anteriores mantienen sus claves de predicción; los nuevos tienen identificadores explícitos. La consulta sigue sin conceder XP ni reemplazar entregas del proyecto.

## Organización

- Recorrido desde cero: las 78 lecciones publicadas, en su secuencia original.
- Consulta y usos prácticos: 27 fichas, con las bases académicas enlazadas. Se pueden buscar y abrir libremente.
- Matemáticas especializadas: seis fichas opcionales de logaritmos, ángulos, hiperbólicas, enteros de 32 bits, formatos flotantes y suma precisa. No aparecen como pasos previos a while ni a funciones de JavaScript.

Las aplicaciones con funciones enlazan explícitamente la lección de funciones y retorno entre sus bases. Las demás dependencias se enumeran por ficha en la matriz complementaria. La agrupación solo organiza la consulta. Las referencias a las lecciones continúan utilizando el control de acceso de la ruta; no se migra ni se recalcula progreso.

## Decisiones y razonamiento

Los ejercicios que entrenan una operación pueden pedir su sintaxis expresamente. Las aplicaciones adicionales parten de un contrato y un editor vacío, con los criterios que de verdad necesita el problema. La comparación entre map, filter, find, some, every, reduce y ciclos usa datos de catálogo y compra; distingue colección, registro, booleano y acumulado.

Cada ficha ofrece una pregunta de decisión y criterios de autorrevisión. La respuesta se guarda bajo teslacode:topic-reasoning:v1:ID en este navegador, separada de progreso, entregas y bitácoras. Se conserva al filtrar, cambiar de tema y volver a cargar. No se califica su significado ni se acredita comprensión por contener palabras. Como los borradores de consulta, esta explicación no se incluye en la copia de progreso existente.

## Verificación editorial y técnica

editorialCoverage registra el alcance y las correspondencias de estas tablas. El validador comprueba que existan secciones, ejemplos y actividades y que las operaciones anunciadas se usen en el código mediante Acorn. También comprueba el contrato didáctico, los usos, el razonamiento del ejemplo y una aplicación sin restricción automática del método. La existencia estructural no determina por sí sola si una explicación es suficiente: se revisó el contenido antes de publicar esta ampliación.

Los ejemplos y soluciones se ejecutan; se comprueban contraejemplos, preservación de argumentos y diferencias de tipo. Los temporizadores usan scheduling real y awaitResult; no se prueban por una duración exacta. El navegador contrasta además el aislamiento, cancelación, retorno asíncrono, referencias y controles. Las funciones Math recientes conservan su detección de disponibilidad. Los resultados observados se registran en implementation-status.md.

La revisión docente independiente y el piloto con principiantes continúan pendientes. Deben contrastar explicación de decisiones, ayuda utilizada, transferencia y retención. Esta entrega no afirma cubrir todas las APIs de JavaScript ni todos los dominios matemáticos.

## Localización

Los registros están en [javascript-guides.json](../content/learning/javascript-guides.json). example identifica el primer ejemplo; los otros IDs están en examples. guided, bug y challenge identifican las actividades originales; los demás IDs están en practices. La aplicación de cada ficha se enumera después de su tabla.

## Operador ternario: elegir un valor con ? :

ID: `consulta-ternario`. Alcance: Elegir entre dos valores después de comprender if y else.

Usa un ternario para dos valores breves. Para enviar un mensaje, registrar una acción y cambiar varios datos en una rama, escribe if/else con instrucciones separadas.

| Habilidad                 | Apartado explicativo | Ejemplo | Práctica |
| ------------------------- | -------------------- | ------- | -------- |
| Condición y valor elegido | Leer sus tres partes | example | `guided` |

Aplicación adicional con editor vacío: `ternario-etiqueta`. Criterio de autorrevisión: Distingue valor devuelto de acciones ejecutadas. Indica qué ocurre en la frontera y evita condiciones anidadas difíciles de leer.

## switch, case, break y default

ID: `consulta-switch`. Alcance: Seleccionar una alternativa por coincidencia exacta sin ejecutar accidentalmente la siguiente.

Elige switch para claves concretas. Para un precio entre límites, if/else if expresa directamente las comparaciones de rango.

| Habilidad          | Apartado explicativo | Ejemplo | Práctica        |
| ------------------ | -------------------- | ------- | --------------- |
| Selección estricta | Seguir la estructura | example | `guided`        |
| Agrupar opciones   | Agrupar opciones     | example | `switch-grupos` |

Aplicación adicional con editor vacío: `switch-grupos`. Criterio de autorrevisión: Comprueba tipos, caso desconocido y salidas de cada rama. Explica dónde termina la selección y cuándo agruparías etiquetas.

## Valores truthy y falsy: condiciones implícitas

ID: `consulta-truthy`. Alcance: Distinguir un dato de su interpretación booleana, incluidos cero y texto vacío.

Usa una regla explícita para cantidades y longitudes. La interpretación booleana no sustituye validar tipo, rango o espacios.

| Habilidad           | Apartado explicativo     | Ejemplo | Práctica |
| ------------------- | ------------------------ | ------- | -------- |
| Conversión booleana | Convertir explícitamente | example | `guided` |

Aplicación adicional con editor vacío: `truthy-stock`. Criterio de autorrevisión: Incluye cero, texto cero, vacío y arreglo vacío. Separa presencia, tipo y contenido.

## do…while: ejecutar antes de comprobar

ID: `consulta-do-while`. Alcance: Distinguir un ciclo que puede ejecutar cero veces de uno que ejecuta al menos una.

Elige do…while si el contrato exige la primera vuelta. Si cero intentos es válido, while o for resultan más adecuados.

| Habilidad           | Apartado explicativo | Ejemplo | Práctica |
| ------------------- | -------------------- | ------- | -------- |
| Condición posterior | Leer la sintaxis     | example | `guided` |

Aplicación adicional con editor vacío: `do-primer-intento`. Criterio de autorrevisión: Describe cuándo se comprueba la condición y cuál actualización garantiza terminar. Contrasta el límite cero.

## forEach: una acción por cada elemento

ID: `consulta-for-each`. Alcance: Usar un callback para realizar acciones sin confundir forEach con map o un ciclo interrumpible.

Para obtener otra lista usa map; para encontrar y detenerte, find o for…of. forEach no espera promesas ni admite break dentro del callback.

| Habilidad             | Apartado explicativo               | Ejemplo           | Práctica |
| --------------------- | ---------------------------------- | ----------------- | -------- |
| Callback por elemento | Una función llamada por el arreglo | example           | `guided` |
| Retorno y acción      | Elegir la herramienta              | `foreach-retorno` | `bug`    |

Aplicación adicional con editor vacío: `foreach-elegir-salida`. Criterio de autorrevisión: Aclara si buscas un retorno o un efecto y si debes parar o esperar. Una función callback no implica asincronía.

## for…in: recorrer claves de un objeto

ID: `consulta-for-in`. Alcance: Distinguir claves y valores y filtrar propiedades propias.

Para valores de arreglos usa for…of. Para propiedades propias puedes preferir Object.keys/entries; si usas for…in, considera Object.hasOwn.

| Habilidad           | Apartado explicativo                   | Ejemplo | Práctica |
| ------------------- | -------------------------------------- | ------- | -------- |
| Recorrer claves     | Un objeto relaciona claves con valores | example | `guided` |
| Propiedades propias | Limitarse a propiedades propias        | example | `guided` |

Aplicación adicional con editor vacío: `forin-reporte`. Criterio de autorrevisión: Explica clave frente a valor y propiedad propia frente a heredada. Comprueba objeto vacío y cantidades cero.

## Elegir entre while, for, for…of y forEach

ID: `consulta-elegir-recorrido`. Alcance: Relacionar la estructura con la parada, los índices, los valores y las acciones.

while expresa una condición; for ayuda con índices; for…of visita valores y permite parar. map, filter y reduce anuncian resultados distintos. Consulta sus bases antes de usarlos.

| Habilidad            | Apartado explicativo | Ejemplo                 | Práctica             |
| -------------------- | -------------------- | ----------------------- | -------------------- |
| Transformar          | Valores y acciones   | `elegir-transformacion` | `elegir-nombres`     |
| Seleccionar todos    | Valores y acciones   | `elegir-seleccion`      | `elegir-disponibles` |
| Encontrar uno        | Valores y acciones   | `elegir-seleccion`      | `elegir-primero`     |
| Comprobar existencia | Valores y acciones   | `elegir-seleccion`      | `elegir-booleanos`   |
| Comprobar todos      | Valores y acciones   | `elegir-seleccion`      | `elegir-booleanos`   |
| Acumular             | Valores y acciones   | `elegir-acumulacion`    | `elegir-compra`      |

Aplicación adicional con editor vacío: `elegir-compra`. Criterio de autorrevisión: Indica la salida, si debes visitar todos los elementos, cómo tratar el vacío y si necesitas índice. Justifica por el contrato, no por preferencia.

## Plantillas de texto con interpolación

ID: `consulta-plantillas`. Alcance: Construir mensajes con valores y expresiones sin confundir delimitadores.

Calcula antes las reglas complejas y luego presenta sus resultados. Las plantillas no convierten por sí solas un precio a un formato monetario.

| Habilidad              | Apartado explicativo  | Ejemplo | Práctica |
| ---------------------- | --------------------- | ------- | -------- |
| Interpolar expresiones | Leer la interpolación | example | `guided` |

Aplicación adicional con editor vacío: `plantilla-confirmar`. Criterio de autorrevisión: Identifica los delimitadores y cada expresión. Predice espacios, saltos de línea y tipo final.

## Desestructurar objetos y arreglos

ID: `consulta-desestructuracion`. Alcance: Extraer datos con nombres, posiciones y valores por defecto.

Las llaves eligen propiedades y los corchetes posiciones. Usa un alias si el nombre local entra en conflicto; un respaldo no reemplaza null ni cero.

| Habilidad                     | Apartado explicativo                    | Ejemplo               | Práctica             |
| ----------------------------- | --------------------------------------- | --------------------- | -------------------- |
| Propiedades, alias y respaldo | Alias y valores por defecto paso a paso | `destruct-alias`      | `destruct-respaldo`  |
| Posiciones                    | Nombres y posiciones                    | `destruct-posiciones` | `destruct-par`       |
| Referencia compartida         | Ausencia y copia                        | `destruct-referencia` | `destruct-compartir` |

Aplicación adicional con editor vacío: `destruct-configuracion`. Criterio de autorrevisión: Distingue alias de propiedad, undefined de null, y referencia compartida de copia. Comprueba el resultado con propiedad ausente, cero y dato explícito.

## Spread y rest: expandir y reunir valores

ID: `consulta-spread-rest`. Alcance: Distinguir los usos de ... y conservar los datos originales.

Usa spread para expandir y rest para reunir; identifica el contexto de los puntos. Para cambiar un objeto anidado, copia también el nivel que vas a modificar.

| Habilidad          | Apartado explicativo                 | Ejemplo            | Práctica            |
| ------------------ | ------------------------------------ | ------------------ | ------------------- |
| Expandir una lista | El mismo símbolo con dos intenciones | example            | `guided`            |
| Copiar niveles     | Copiar el nivel que sí cambia        | `spread-anidado`   | `spread-actualizar` |
| Reunir argumentos  | Reunir argumentos                    | `rest-argumentos`  | `challenge`         |
| Reunir propiedades | Copiar el nivel que sí cambia        | `rest-propiedades` | `rest-separar`      |

Aplicación adicional con editor vacío: `spread-actualizar`. Criterio de autorrevisión: Señala qué contenedor es nuevo y qué referencia sigue compartida. Distingue argumentos separados de un único arreglo.

## Object.keys, values y entries

ID: `consulta-claves-valores`. Alcance: Elegir si necesitas claves, valores o pares al recorrer un registro.

Escoge según la información que necesitas. No sumes nombres de propiedades para obtener cantidades ni supongas un orden de negocio por la enumeración.

| Habilidad | Apartado explicativo              | Ejemplo         | Práctica    |
| --------- | --------------------------------- | --------------- | ----------- |
| Claves    | Convertir propiedades en arreglos | `objetos-orden` | `challenge` |
| Valores   | Convertir propiedades en arreglos | `objetos-orden` | `bug`       |
| Pares     | Recorrer pares                    | example         | `guided`    |

Aplicación adicional con editor vacío: `objetos-lineas`. Criterio de autorrevisión: Relaciona claves, valores y pares con la pregunta. Considera objeto vacío, cero y propiedades heredadas.

## Expresiones regulares: patrones de texto

ID: `consulta-regexp`. Alcance: Comprobar un formato pequeño distinguiendo coincidencia parcial y completa.

Para buscar una palabra literal, includes suele ser suficiente. Usa patrones pequeños y verificables; la forma de un texto no valida sus reglas de negocio.

| Habilidad             | Apartado explicativo                    | Ejemplo                    | Práctica            |
| --------------------- | --------------------------------------- | -------------------------- | ------------------- |
| Comprobar forma       | Definir el formato completo             | example                    | `guided`            |
| Extraer coincidencias | Extraer y sustituir además de comprobar | `regex-extraer`            | `regex-numeros`     |
| Sustituir             | Extraer y sustituir además de comprobar | `regex-reemplazar`         | `regex-separadores` |
| Localizar             | Extraer y sustituir además de comprobar | `regex-posicion-separador` | `regex-posicion`    |
| Dividir               | Extraer y sustituir además de comprobar | `regex-posicion-separador` | `regex-dividir`     |

Aplicación adicional con editor vacío: `regex-separadores`. Criterio de autorrevisión: Explica anclajes, repeticiones y banderas usadas. Comprueba ausencia, coincidencia parcial y texto completo; evita prometer validar cualquier correo con un patrón pequeño.

## push, pop, shift, unshift, slice y splice

ID: `consulta-array-cambios`. Alcance: Separar los métodos que cambian un arreglo de los que devuelven una copia.

Elige primero si necesitas cambiar el original. En slice el segundo dato es una posición final excluida; en splice es una cantidad de elementos retirados.

| Habilidad             | Apartado explicativo                | Ejemplo        | Práctica                 |
| --------------------- | ----------------------------------- | -------------- | ------------------------ |
| Añadir al final       | Añadir y retirar                    | example        | `guided`                 |
| Retirar del final     | Añadir y retirar                    | example        | `array-pop`              |
| Añadir al principio   | Añadir y retirar                    | `array-frente` | `array-unshift`          |
| Retirar del principio | Añadir y retirar                    | `array-frente` | `challenge`              |
| Copiar tramo          | Copiar un tramo                     | `array-slice`  | `bug`                    |
| Reemplazar tramo      | Cambiar un tramo                    | `array-splice` | `array-splice-reemplazo` |
| Insertar sin retirar  | Posición, cantidad y valor devuelto | `array-splice` | `array-insertar`         |

Aplicación adicional con editor vacío: `array-agenda`. Criterio de autorrevisión: Explica posición, cantidad y retorno. Revisa vacío, primer/último elemento, índice negativo y referencia compartida al copiar objetos.

## try, catch, throw y finally

ID: `consulta-try-catch`. Alcance: Investigar un error y responder de forma controlada sin ocultarlo.

Usa if para una alternativa prevista y try/catch para una operación que puede lanzar. Una promesa rechazada debe esperarse o manejarse en su propio flujo.

| Habilidad              | Apartado explicativo       | Ejemplo          | Práctica    |
| ---------------------- | -------------------------- | ---------------- | ----------- |
| Capturar una excepción | Una operación puede fallar | example          | `guided`    |
| Lanzar un rechazo      | Crear un rechazo explícito | `error-propagar` | `challenge` |

Aplicación adicional con editor vacío: `error-recuperar`. Criterio de autorrevisión: Señala dónde se interrumpe el flujo y qué continúa en finally. Evita silencios y retornos de finally que oculten el fallo.

## Leer código antiguo: var, let y const

ID: `consulta-var`. Alcance: Reconocer diferencias de alcance sin adoptar var como opción inicial.

Para código nuevo usa const o let según la necesidad de reasignar. Aprende var para interpretar código existente; evita depender de lecturas anteriores a la declaración.

| Habilidad             | Apartado explicativo        | Ejemplo              | Práctica |
| --------------------- | --------------------------- | -------------------- | -------- |
| Declaración y alcance | Alcance de bloque y función | `var-inicializacion` | `guided` |

Aplicación adicional con editor vacío: `var-ramas`. Criterio de autorrevisión: Distingue alcance de bloque y de función. Comprueba ambas ramas y la lectura previa a la inicialización.

## Prototipos y propiedades propias

ID: `consulta-prototipos`. Alcance: Seguir de dónde obtiene un objeto una propiedad y distinguir herencia de copia.

No cambies prototipos incorporados para resolver una utilidad local. Si solo necesitas transportar datos, un objeto sencillo suele expresar mejor el contrato.

| Habilidad                   | Apartado explicativo         | Ejemplo | Práctica |
| --------------------------- | ---------------------------- | ------- | -------- |
| Crear relación de prototipo | Crear una relación explícita | example | `guided` |
| Reconocer propiedad propia  | Crear una relación explícita | example | `guided` |

Aplicación adicional con editor vacío: `proto-propia`. Criterio de autorrevisión: Traza la búsqueda y distingue heredar, ocultar y copiar. Incluye propiedad ausente y comprobación de propiedad propia.

## Math, redondeo y números seguros

ID: `consulta-math`. Alcance: Elegir cómo redondear y reconocer cuándo una cuenta necesita una regla explícita.

Lee primero las reglas de redondeo y precisión. Las funciones especializadas se consultan cuando un modelo las necesita; no son requisitos para empezar con ciclos.

| Habilidad                    | Apartado explicativo                | Ejemplo                | Práctica    |
| ---------------------------- | ----------------------------------- | ---------------------- | ----------- |
| Leer una llamada de redondeo | Leer una llamada de Math desde cero | example                | `guided`    |
| Redondear capacidad          | Herramientas para calcular          | example                | `bug`       |
| Medir magnitud               | Limitar y medir                     | `math-distancia-intro` | `challenge` |

Aplicación adicional con editor vacío: `math-elegir-regla`. Criterio de autorrevisión: Especifica unidad y regla de decisión. Contrasta entero, fracción y negativo antes de confiar en una fórmula.

## Temporizadores, retrasos y cancelación

ID: `consulta-temporizadores`. Alcance: Programar una tarea posterior y comprender que el retraso no garantiza una hora exacta.

setTimeout programa una vez y setInterval repite. Para tareas asíncronas que no deben solaparse, espera su fin antes de programar la siguiente.

| Habilidad             | Apartado explicativo                  | Ejemplo           | Práctica       |
| --------------------- | ------------------------------------- | ----------------- | -------------- |
| Programar una vez     | Programar sin bloquear                | example           | `guided`       |
| Cancelar lo pendiente | Conservar el identificador y cancelar | `timer-cancelar`  | `timer-aviso`  |
| Repetir con límite    | Esperar y limpiar                     | `timer-intervalo` | `timer-parada` |
| Liberar intervalo     | Conservar el identificador y cancelar | `timer-intervalo` | `timer-parada` |

Aplicación adicional con editor vacío: `timer-aviso`. Criterio de autorrevisión: Distingue programación, ejecución y cancelación. No bases la corrección en una hora exacta y asegura una parada explícita.

## Encadenamiento opcional ?. y coalescencia ??

ID: `consulta-opcional-nullish`. Alcance: Consultar datos que pueden faltar y conservar valores válidos como cero.

Usa validación explícita cuando necesites asegurar el tipo. || sirve para otra regla: reemplaza cualquier valor falsy, incluido cero.

| Habilidad              | Apartado explicativo             | Ejemplo            | Práctica          |
| ---------------------- | -------------------------------- | ------------------ | ----------------- |
| Consultar una ausencia | Una ausencia concreta            | example            | `guided`          |
| Llamar opcionalmente   | Posiciones y llamadas opcionales | `opcional-llamada` | `opcional-accion` |

Aplicación adicional con editor vacío: `opcional-reporte`. Criterio de autorrevisión: Comprueba ausencia de cada nivel, cero y vacío. Explica la diferencia entre evitar una consulta inválida y validar el dato.

## &&, || y cortocircuito: qué se evalúa

ID: `consulta-cortocircuito`. Alcance: Seguir qué operando se devuelve y cuándo se omite una expresión.

Usa if para acciones que conviene seguir paso a paso. Para reemplazar solo null/undefined consulta ??; no descartes cero sin justificarlo.

| Habilidad                  | Apartado explicativo              | Ejemplo            | Práctica         |
| -------------------------- | --------------------------------- | ------------------ | ---------------- |
| Valores y evaluación       | Evaluar solo lo necesario         | example            | `guided`         |
| Observar llamadas evitadas | Escribir decisiones comprensibles | `corto-evaluacion` | `corto-llamadas` |

Aplicación adicional con editor vacío: `corto-nombre`. Criterio de autorrevisión: Predice tanto el valor final como las expresiones ejecutadas. Diferencia falsy, ausencia y un booleano explícito.

## includes(): pertenencia en arreglos y búsqueda en texto

ID: `consulta-includes`. Alcance: Comprobar si un valor o fragmento aparece, obteniendo un booleano sin confundirlo con una posición.

Para localizar un registro por una propiedad usa find/some con un predicado; para patrones variables consulta expresiones regulares.

| Habilidad          | Apartado explicativo      | Ejemplo | Práctica                  |
| ------------------ | ------------------------- | ------- | ------------------------- |
| Pertenencia exacta | Una pregunta de sí o no   | example | `guided`                  |
| Posición inicial   | Desde qué posición buscar | example | `includes-desde-posicion` |

Aplicación adicional con editor vacío: `includes-opciones`. Criterio de autorrevisión: Distingue tipo e identidad, posición cero y ausencia. Explica desde dónde se busca y cómo se tratan las mayúsculas.

## entries(): pares de arreglos y Map

ID: `consulta-entries-iteradores`. Alcance: Recorrer posiciones y valores de un arreglo o claves y valores de un Map, distinguiendo iteradores y arreglos.

Usa values si solo interesa contenido y entries si necesitas ambas piezas. No trates un iterador agotado como un arreglo reutilizable.

| Habilidad        | Apartado explicativo    | Ejemplo        | Práctica           |
| ---------------- | ----------------------- | -------------- | ------------------ |
| Pares de arreglo | Posición y valor juntos | example        | `guided`           |
| Pares de Map     | Pares de un Map         | `entries-mapa` | `challenge`        |
| Consumir pasos   | Un iterador se consume  | `entries-next` | `entries-consumir` |

Aplicación adicional con editor vacío: `entries-consumir`. Criterio de autorrevisión: Identifica el tipo de clave, el contenedor y el estado de consumo. Comprueba vacío y claves numéricas frente a texto.

## Math.floor, ceil, round y trunc: cuatro reglas de redondeo

ID: `consulta-math-redondeos`. Alcance: Elegir una regla con positivos, negativos y empates, distinguiendo redondear de formatear.

Selecciona por la dirección exigida en el problema. trunc se acerca a cero; floor baja en la recta numérica y difiere con negativos.

| Habilidad  | Apartado explicativo  | Ejemplo | Práctica |
| ---------- | --------------------- | ------- | -------- |
| Math.floor | floor y ceil          | example | `guided` |
| Math.ceil  | floor y ceil          | example | `guided` |
| Math.round | round y los empates   | example | `guided` |
| Math.trunc | trunc y los negativos | example | `guided` |

Aplicación adicional con editor vacío: `redondeo-bloques`. Criterio de autorrevisión: Explica unidad, vecinos enteros, dirección y empate. La respuesta debe respetar la regla incluso con cero o negativos.

## Math.min, max, abs y sign: límites y distancias

ID: `consulta-math-extremos`. Alcance: Seleccionar extremos, limitar un valor y separar magnitud y signo.

Usa un extremo para comparar, abs para magnitud y sign para dirección. Antes de limitar un dato, comprueba que sus límites y su tipo tienen sentido.

| Habilidad | Apartado explicativo       | Ejemplo | Práctica |
| --------- | -------------------------- | ------- | -------- |
| Math.min  | Comparar varios argumentos | example | `guided` |
| Math.max  | Comparar varios argumentos | example | `guided` |
| Math.abs  | Distancia y dirección      | example | `guided` |
| Math.sign | Distancia y dirección      | example | `guided` |

Aplicación adicional con editor vacío: `math-intervalo-control`. Criterio de autorrevisión: Separa diferencia, magnitud y dirección. Incluye extremos, límites iguales y desplazamiento cero.

## Math.pow, sqrt, cbrt e hypot: potencias y raíces

ID: `consulta-math-potencias`. Alcance: Interpretar exponentes, raíces y distancias antes de llamar a sus funciones.

Distingue elevar de multiplicar y raíz cuadrada de cúbica. Para una raíz cúbica negativa usa cbrt; documenta la unidad de la distancia.

| Habilidad  | Apartado explicativo                | Ejemplo | Práctica    |
| ---------- | ----------------------------------- | ------- | ----------- |
| Math.pow   | Una potencia cuenta factores        | example | `guided`    |
| Math.sqrt  | Deshacer cuadrados y cubos          | example | `guided`    |
| Math.cbrt  | Deshacer cuadrados y cubos          | example | `guided`    |
| Math.hypot | Una distancia de varias dimensiones | example | `challenge` |

Aplicación adicional con editor vacío: `math-desplazamiento`. Criterio de autorrevisión: Relaciona fórmula con el problema. Comprueba cero, signo, dominio y un caso cuyo resultado puedas calcular a mano.

## Math.random(): azar, intervalos y enteros

ID: `consulta-math-random`. Alcance: Separar una muestra aleatoria de su transformación y comprobar los extremos del intervalo.

Separa generar la muestra de transformarla. Para una selección criptográfica se necesita otra herramienta; para probar una fórmula utiliza muestras preparadas.

| Habilidad   | Apartado explicativo | Ejemplo | Práctica            |
| ----------- | -------------------- | ------- | ------------------- |
| Math.random | Qué devuelve random  | example | `math-muestra-real` |

Aplicación adicional con editor vacío: `azar-elegir-opcion`. Criterio de autorrevisión: Explica escala, desplazamiento y máximo excluido o incluido. Distingue comprobar el rango de demostrar uniformidad.

## Number: precisión, NaN, Infinity y formato decimal

ID: `consulta-numeros-precision`. Alcance: Validar el tipo y los límites del número y distinguir cálculo, comparación aproximada y presentación.

Define unidades y tolerancias antes de comparar aproximaciones. Usa enteros seguros cuando el contrato cuenta unidades exactas; EPSILON no es una corrección universal.

| Habilidad          | Apartado explicativo                   | Ejemplo                | Práctica            |
| ------------------ | -------------------------------------- | ---------------------- | ------------------- |
| Finitud            | NaN e infinitos                        | example                | `guided`            |
| NaN                | NaN e infinitos                        | example                | `numero-nan`        |
| Entero             | Enteros y enteros seguros              | `precision-predicados` | `guided`            |
| Entero seguro      | Enteros y enteros seguros              | example                | `guided`            |
| Formato como texto | Formatear no cambia el tipo de cálculo | example                | `bug`               |
| Cero con signo     | Cero con signo                         | example                | `numero-cero-signo` |

Aplicación adicional con editor vacío: `numero-sensor`. Criterio de autorrevisión: Revisa tipo, rango, error admitido y cero. Explica por qué NaN y un texto numérico requieren decisiones diferentes.

## Math.exp y logaritmos: crecimiento e inversas

ID: `consulta-math-logaritmos`. Alcance: Interpretar un logaritmo como exponente y comprobar su base y dominio.

Elige la base que corresponde al modelo. No uses log como sustituto de dividir y no memorices una fórmula sin explicar sus unidades y dominio.

| Habilidad  | Apartado explicativo    | Ejemplo | Práctica           |
| ---------- | ----------------------- | ------- | ------------------ |
| Math.exp   | La base natural         | example | `challenge`        |
| Math.expm1 | Valores cercanos a cero | example | `challenge`        |
| Math.log   | La base natural         | example | `math-dominio-log` |
| Math.log1p | Valores cercanos a cero | example | `challenge`        |
| Math.log2  | Deshacer una potencia   | example | `guided`           |
| Math.log10 | Deshacer una potencia   | example | `guided`           |

Aplicación adicional con editor vacío: `log-escala`. Criterio de autorrevisión: Conecta potencia e inversa; incluye la base, el dominio y una comprobación con tolerancia.

## Math.PI, trigonometría y ángulos en radianes

ID: `consulta-math-angulos`. Alcance: Relacionar grados y radianes con posiciones y recuperar una dirección sin intercambiar ejes.

Convierte grados antes de llamar a sin/cos/tan. Si conoces ambas coordenadas, atan2 conserva el cuadrante mejor que una división aislada.

| Habilidad  | Apartado explicativo              | Ejemplo | Práctica        |
| ---------- | --------------------------------- | ------- | --------------- |
| Math.sin   | Seno, coseno y tangente           | example | `guided`        |
| Math.cos   | Seno, coseno y tangente           | example | `guided`        |
| Math.tan   | Seno, coseno y tangente           | example | `math-tangente` |
| Math.asin  | Las funciones inversas            | example | `math-inversas` |
| Math.acos  | Las funciones inversas            | example | `math-inversas` |
| Math.atan  | Las funciones inversas            | example | `math-inversas` |
| Math.atan2 | Una dirección con dos coordenadas | example | `challenge`     |

Aplicación adicional con editor vacío: `angulo-orbita`. Criterio de autorrevisión: Identifica unidades, ejes, cuadrante y dominio. Comprueba direcciones conocidas y usa tolerancia para identidades.

## Math.sinh, cosh, tanh y sus inversas

ID: `consulta-math-hiperbolicas`. Alcance: Interpretar funciones hiperbólicas a partir de exponenciales y respetar sus dominios.

Comprende exp y log antes de esta familia. Estas funciones no reemplazan los ciclos ni son necesarias para construir formularios, listas o reportes.

| Habilidad  | Apartado explicativo       | Ejemplo | Práctica |
| ---------- | -------------------------- | ------- | -------- |
| Math.sinh  | Otra familia de relaciones | example | `guided` |
| Math.cosh  | Otra familia de relaciones | example | `guided` |
| Math.tanh  | Otra familia de relaciones | example | `guided` |
| Math.asinh | Deshacer la relación       | example | `guided` |
| Math.acosh | Deshacer la relación       | example | `guided` |
| Math.atanh | Deshacer la relación       | example | `guided` |

Aplicación adicional con editor vacío: `hiperbolica-validar-modelo`. Criterio de autorrevisión: Explica la relación matemática que estás representando y su dominio. Distingue una referencia especializada de una herramienta de uso general.

## Math.clz32 e imul: representación entera de 32 bits

ID: `consulta-math-enteros32`. Alcance: Interpretar bits, ceros iniciales y multiplicación con desbordamiento de 32 bits.

Para contar productos o calcular dinero usa el contrato numérico correspondiente; no adoptes imul porque su nombre parezca una multiplicación más precisa.

| Habilidad  | Apartado explicativo   | Ejemplo | Práctica    |
| ---------- | ---------------------- | ------- | ----------- |
| Math.clz32 | Contar ceros iniciales | example | `guided`    |
| Math.imul  | Multiplicar con imul   | example | `challenge` |

Aplicación adicional con editor vacío: `bits-contrato`. Criterio de autorrevisión: Explica representación, signo y pérdida de información. Incluye cero y un producto que desborda los 32 bits.

## Math.fround y f16round: precisión de 32 y 16 bits

ID: `consulta-math-flotantes`. Alcance: Distinguir redondear a un entero de aproximar un valor con otra precisión binaria.

Elige el formato por el contrato de datos. fround no equivale a floor ni f16round a imprimir menos cifras; comprueba disponibilidad del navegador.

| Habilidad     | Apartado explicativo                    | Ejemplo | Práctica |
| ------------- | --------------------------------------- | ------- | -------- |
| Math.fround   | fround conserva una fracción aproximada | example | `guided` |
| Math.f16round | f16round reduce más la precisión        | example | `guided` |

Aplicación adicional con editor vacío: `float-tolerancia`. Criterio de autorrevisión: Distingue valor, formato y presentación. Identifica error aceptable y qué hacer si el resultado deja de ser finito.

## Math.sumPrecise: sumar con atención a la cancelación

ID: `consulta-math-suma-precisa`. Alcance: Reconocer pérdida de información al acumular y comprobar disponibilidad antes de adoptar una API reciente.

Usa esta operación cuando la precisión de la suma forma parte del contrato y el entorno la admite. No sustituye elegir unidades o validar entradas.

| Habilidad       | Apartado explicativo  | Ejemplo | Práctica |
| --------------- | --------------------- | ------- | -------- |
| Math.sumPrecise | Qué ofrece sumPrecise | example | `guided` |

Aplicación adicional con editor vacío: `suma-aportes`. Criterio de autorrevisión: Distingue error de entrada e intermedio, comprueba disponibilidad y explica el resultado con vacío y aportes que se cancelan.
