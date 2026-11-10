# Dirección de producto acordada

Este documento conserva las decisiones aprobadas y su implementación: rutas con entrada independiente, apoyos contextuales, orientación opcional y la interfaz de la primera propuesta: mapa conectado, laboratorio lateral y tarjetas de especialidades. La identidad elegida combina una T, un perfil ilustrado y el símbolo de terminal, recreados a partir de la referencia aportada por el usuario.

## Acceso para principiantes y personas con experiencia

1. Todas las rutas permiten comenzar desde su primera lección publicada. Completar otra ruta no constituye una condición de entrada.
2. La progresión obligatoria se aplica dentro del recorrido principal elegido: práctica resuelta y comprobación aprobada para avanzar. Las ramas opcionales conservan su carácter opcional.
3. Los conocimientos de otras rutas se presentan como recomendaciones y repasos por concepto, disponibles en el punto donde se necesitan. Se conserva la trazabilidad de requisitos académicos para detectar vacíos conceptuales.
4. Dentro de una lección, quien ya conoce el tema puede resolver directamente la práctica y la comprobación. Demostrarlo permite avanzar; declarar experiencia no concede finalizaciones, evidencias ni XP.
5. Fundamentos es el comienzo recomendado para quienes nunca han programado. La recomendación mantiene libre la elección de ruta.
6. Los temas todavía no desarrollados siguen en preparación. Abrir una ruta no convierte sus temas planificados en contenido disponible.
7. La orientación opcional de tres preguntas explora los conceptos iniciales de la ruta para recomendar apoyos. No bloquea el acceso ni sustituye las actividades de la secuencia obligatoria.

Ejemplos: un desarrollador Backend puede comenzar Frontend sin completar Fundamentos; un desarrollador Frontend puede comenzar Backend y repasar SQL cuando lo necesite, sin cursar previamente toda Bases de datos. El mismo criterio se aplica a Algoritmia e IA.

## Fundamentos y lógica con JavaScript como primer lenguaje

Decisión del usuario, 9 de noviembre de 2026. El primer público previsto es RIWI Medellín. Fundamentos debe convertirse en una ruta integrada para personas que nunca han programado, con JavaScript desde el primer contacto hasta el desarrollo aplicado avanzado. La lógica se explica y practica junto al lenguaje. Python conserva su ruta independiente y no es un requisito de entrada.

El material de RIWI compartido por el usuario documenta la sesión 6 y los minirretos 9–12 de la semana 1 de Algoritmia 2. Menciona otras tres semanas, pero no aporta sus contenidos desarrollados. No se presenta esa muestra como el currículo completo ni se atribuyen a RIWI las ampliaciones propias de TeslaCode. Según ese fragmento, Algoritmia 2 utiliza PSeInt antes del módulo de JavaScript; elegir JavaScript desde cero para TeslaCode es la dirección solicitada por el usuario.

Se adopta la idea de minirretos encadenados que construyen productos, reforzando la enseñanza que precede a cada reto. La persona debe entender el problema, el vocabulario, la sintaxis y las herramientas antes de aplicarlos. No se presupone conocimiento de variables, funciones, terminal, HTML ni métodos de objetos. Las instrucciones explican incluso cómo escribir y ejecutar el primer programa y cómo reconocer su salida.

Cada concepto tendrá un lugar explícito de introducción, explicación, ejemplo ejecutable, práctica guiada y aplicación autónoma. La revisión también inspeccionará los conocimientos usados en pistas, soluciones, código inicial y casos de prueba; no basta con comprobar los títulos del temario. Los proyectos integran lo enseñado y los nuevos conocimientos aparecen primero en una lección previa. La completitud se evalúa dentro del alcance declarado, mediante trazabilidad, revisión técnica y pruebas con principiantes; no se promete ausencia absoluta de vacíos por tener muchos temas o pasar pruebas automáticas.

La ruta debe contar con consola JavaScript real, separando experimentar de comprobar y conservar progreso. El motor, los validadores, la versión del contenido y la compatibilidad con avances anteriores deben verificarse antes de sustituir las lecciones actuales. Un cambio de lenguaje no acredita automáticamente competencias nuevas. La [secuencia y las condiciones de entrega](plan-mejora-plataforma.md#fundamentos-y-lógica-con-javascript--prioridad-del-9-de-noviembre) forman parte del plan; esta decisión no declara implementada la migración.

## Condiciones para Python y ejemplos de otros lenguajes

El usuario respalda incorporar una ruta propia de Python con contenidos actuales. Su desarrollo debe partir de cero: ninguna lección que use Python, JavaScript u otro lenguaje puede presuponer experiencia previa no enseñada en el recorrido. La sintaxis, herramientas y conceptos necesarios se explican y practican antes de exigir su aplicación. Los apoyos deben estar disponibles también para quien entra directamente a una especialidad.

La profundidad y la secuencia entre lecciones son requisitos explícitos: el temario debe cubrir el alcance anunciado con explicaciones, ejemplos, errores frecuentes, práctica progresiva y proyectos integradores. Cada conocimiento necesario se introduce antes de utilizarlo; se revisa la continuidad dentro de cada módulo y entre módulos. Una lista extensa de títulos o explicaciones breves sin práctica suficiente no satisface esta condición.

La elección de versiones y herramientas debe contrastarse con fuentes oficiales y probarse en el entorno utilizado por el estudiante. Se mantienen revisiones de soporte y deprecaciones; no se considera obsoleto un fundamento por su antigüedad.

El [plan de mejora](plan-mejora-plataforma.md) conserva el antecedente de Algoritmia en pseudocódigo y laboratorios Python complementarios. La nueva prioridad de Fundamentos en JavaScript amplía la dirección editorial; las fases antiguas no se interpretan como una obligación de cursar Python primero. La implementación y las reglas vigentes se registran por separado.

## Dirección visual del estudio de exploración

- Rediseño solicitado el 9 de noviembre de 2026 para la presentación competitiva del proyecto: grafito, tipografía expresiva, acentos cian/lima y una escena de conocimiento con volumen. Se conservan el mapa de hitos a la izquierda, el laboratorio a la derecha y las especialidades debajo; en móvil, el laboratorio precede al mapa.
- Un Nikola Tesla holográfico estilizado conecta las siete rutas con controles reales. Su cabeza y sus pupilas siguen el cursor mediante SVG por capas y profundidad CSS, sin descargar un motor gráfico ni depender de WebGL. Elegir una ruta actualiza el objetivo, los hitos, el ejemplo y el acceso a la lección; no concede progreso. El laboratorio prioriza la lectura del código y sus resultados.
- El inicio presenta una vista de hitos y un laboratorio local por ruta. El mapa completo conserva todos los pasos y muestra con claridad qué contenido sigue en preparación. Las tarjetas de rutas incluyen enlaces directos para comenzar.
- Movimiento lento y brillo contenido, con respuesta al puntero solo en dispositivos adecuados. La escena se detiene fuera de pantalla, en pestañas ocultas y al pausar el efecto. Los dispositivos táctiles y la preferencia de movimiento reducido reciben la composición estática. Durante las lecciones no se monta la escena y los ejemplos razonados tienen una jerarquía propia.
- La escena no implica que exista un asistente de IA ni un entorno de ejecución de lenguajes que la plataforma no haya implementado. Los números del inicio proceden del catálogo real.
- El emblema T/perfil/terminal conserva el retrato realista, la iluminación eléctrica azul/cian y los circuitos de la referencia del usuario. La navegación utiliza el giro del WebP aportado por el usuario, optimizado a 128 px, con fondo oscuro y borde cian en ambos temas. El logo visible se anima en todas las secciones, con mayor tamaño y una pausa permanente en la cabecera; fuera de pantalla, con pausa, ahorro de datos o movimiento reducido se muestra el primer fotograma. Ese fotograma también es el favicon. Hay maestros PNG y versiones WebP de entrega en `assets/brand/` y `assets/studio/`.

El laboratorio extiende esta identidad con planos de construcción, tarjetas de retos elevadas y filtros de tipos/temas. El progreso utiliza un indicador circular sobre una plataforma, métricas reales, tarjetas de rutas y un espacio para copias recuperables. Ambas vistas responden al puntero en equipos adecuados y mantienen el contenido esencial en HTML.

## Guía de implementación

1. Separar los requisitos académicos de las condiciones de acceso. Mantener los conceptos y sus fuentes de introducción aunque una referencia entre rutas pase a ser una recomendación.
2. Centralizar la decisión de acceso y sus motivos en el dominio. Aplicarla de manera consistente al catálogo, mapa, recomendaciones, búsqueda y enlaces directos.
3. Preservar el progreso existente y la distinción entre contenido publicado y planificado. No simular cursos completados para desbloquear entradas.
4. Reutilizar los repasos por concepto, evitando versiones duplicadas que puedan divergir entre especialidades.
5. Verificar entrada sin progreso a cada ruta, secuencia interna, ayudas entre rutas, acceso por URL, ramas opcionales y conservación de logros anteriores.
6. Desarrollar la presentación mediante componentes y estilos coherentes en escritorio y móvil. Integrar el símbolo definitivo en navegación, favicon y demás usos de marca.
