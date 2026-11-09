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

## Condiciones para Python y ejemplos de otros lenguajes

El usuario respalda incorporar una ruta propia de Python con contenidos actuales. Su desarrollo debe partir de cero: ninguna lección que use Python, JavaScript u otro lenguaje puede presuponer experiencia previa no enseñada en el recorrido. La sintaxis, herramientas y conceptos necesarios se explican y practican antes de exigir su aplicación. Los apoyos deben estar disponibles también para quien entra directamente a una especialidad.

La profundidad y la secuencia entre lecciones son requisitos explícitos: el temario debe cubrir el alcance anunciado con explicaciones, ejemplos, errores frecuentes, práctica progresiva y proyectos integradores. Cada conocimiento necesario se introduce antes de utilizarlo; se revisa la continuidad dentro de cada módulo y entre módulos. Una lista extensa de títulos o explicaciones breves sin práctica suficiente no satisface esta condición.

La elección de versiones y herramientas debe contrastarse con fuentes oficiales y probarse en el entorno utilizado por el estudiante. Se mantienen revisiones de soporte y deprecaciones; no se considera obsoleto un fundamento por su antigüedad.

El [plan de mejora](plan-mejora-plataforma.md) propone un núcleo de Algoritmia en pseudocódigo y laboratorios Python complementarios, con evidencia separada de implementación. Esta modalidad todavía no está implementada ni modifica las reglas de progresión actuales.

## Dirección visual del estudio de exploración

- Rediseño solicitado el 9 de noviembre de 2026 para la presentación competitiva del proyecto: grafito, tipografía expresiva, acentos cian/lima y una escena de conocimiento con volumen. Se conservan el mapa de hitos a la izquierda, el laboratorio a la derecha y las especialidades debajo; en móvil, el laboratorio precede al mapa.
- Un núcleo CSS 3D conecta las siete rutas con controles reales. Elegir una actualiza el objetivo, los hitos, el ejemplo y el acceso a la lección; no concede progreso. La escena permite presentar la propuesta visual sin descargar un motor gráfico ni depender de WebGL. El laboratorio prioriza la lectura del código y sus resultados.
- El inicio presenta una vista de hitos y un laboratorio local por ruta. El mapa completo conserva todos los pasos y muestra con claridad qué contenido sigue en preparación. Las tarjetas de rutas incluyen enlaces directos para comenzar.
- Movimiento lento y brillo contenido, con respuesta al puntero solo en dispositivos adecuados. La escena se detiene fuera de pantalla, en pestañas ocultas y al pausar el efecto. Los dispositivos táctiles y la preferencia de movimiento reducido reciben la composición estática. Durante las lecciones no se monta la escena y los ejemplos razonados tienen una jerarquía propia.
- La escena no implica que exista un asistente de IA ni un entorno de ejecución de lenguajes que la plataforma no haya implementado. Los números del inicio proceden del catálogo real.
- El emblema T/perfil/terminal conserva el retrato realista, la iluminación eléctrica azul/cian y los circuitos de la referencia del usuario. La misma imagen se utiliza en marca e icono del navegador, sin sustituirla por un perfil plano. Hay maestros PNG y versiones WebP de entrega en `assets/brand/` y `assets/studio/`.

## Guía de implementación

1. Separar los requisitos académicos de las condiciones de acceso. Mantener los conceptos y sus fuentes de introducción aunque una referencia entre rutas pase a ser una recomendación.
2. Centralizar la decisión de acceso y sus motivos en el dominio. Aplicarla de manera consistente al catálogo, mapa, recomendaciones, búsqueda y enlaces directos.
3. Preservar el progreso existente y la distinción entre contenido publicado y planificado. No simular cursos completados para desbloquear entradas.
4. Reutilizar los repasos por concepto, evitando versiones duplicadas que puedan divergir entre especialidades.
5. Verificar entrada sin progreso a cada ruta, secuencia interna, ayudas entre rutas, acceso por URL, ramas opcionales y conservación de logros anteriores.
6. Desarrollar la presentación mediante componentes y estilos coherentes en escritorio y móvil. Integrar el símbolo definitivo en navegación, favicon y demás usos de marca.
