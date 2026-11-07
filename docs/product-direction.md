# Dirección de producto acordada

Este documento conserva las decisiones aprobadas y su implementación: rutas con entrada independiente, apoyos contextuales, orientación opcional e interfaz minimalista con computadora holográfica. La identidad elegida combina una T, un perfil ilustrado y el símbolo de terminal, recreados a partir de la referencia aportada por el usuario.

## Acceso para principiantes y personas con experiencia

1. Todas las rutas permiten comenzar desde su primera lección publicada. Completar otra ruta no constituye una condición de entrada.
2. La progresión obligatoria se aplica dentro del recorrido principal elegido: práctica resuelta y comprobación aprobada para avanzar. Las ramas opcionales conservan su carácter opcional.
3. Los conocimientos de otras rutas se presentan como recomendaciones y repasos por concepto, disponibles en el punto donde se necesitan. Se conserva la trazabilidad de requisitos académicos para detectar vacíos conceptuales.
4. Dentro de una lección, quien ya conoce el tema puede resolver directamente la práctica y la comprobación. Demostrarlo permite avanzar; declarar experiencia no concede finalizaciones, evidencias ni XP.
5. Fundamentos es el comienzo recomendado para quienes nunca han programado. La recomendación mantiene libre la elección de ruta.
6. Los temas todavía no desarrollados siguen en preparación. Abrir una ruta no convierte sus temas planificados en contenido disponible.
7. La orientación opcional de tres preguntas explora los conceptos iniciales de la ruta para recomendar apoyos. No bloquea el acceso ni sustituye las actividades de la secuencia obligatoria.

Ejemplos: un desarrollador Backend puede comenzar Frontend sin completar Fundamentos; un desarrollador Frontend puede comenzar Backend y repasar SQL cuando lo necesite, sin cursar previamente toda Bases de datos. El mismo criterio se aplica a Algoritmia e IA.

## Dirección visual elegida

- Interfaz minimalista con fondo grafito, texto legible, espacio libre y acentos de azul eléctrico/cian.
- Computadora holográfica como elemento protagonista del inicio. La lluvia de código inspirada en Matrix permanece dentro de su pantalla y muestra ejemplos relacionados con la ruta elegida.
- Información progresiva: inicio, mapa y lección muestran el detalle pertinente a cada etapa; el mapa completo y el laboratorio se abren al elegirlos.
- Movimiento lento y brillo contenido. Durante la lectura, los efectos se atenúan y quedan estáticos. Se respeta la preferencia de movimiento reducido y se ofrece una versión ligera para móvil.
- La ilustración no implica que exista un asistente de IA ni un entorno de ejecución de lenguajes que la plataforma no haya implementado.
- El rayo se sustituye por el emblema T/perfil/terminal, con fondo transparente y una variante SVG simplificada para el favicon. Los archivos de identidad se encuentran en `assets/brand/`.

## Guía de implementación

1. Separar los requisitos académicos de las condiciones de acceso. Mantener los conceptos y sus fuentes de introducción aunque una referencia entre rutas pase a ser una recomendación.
2. Centralizar la decisión de acceso y sus motivos en el dominio. Aplicarla de manera consistente al catálogo, mapa, recomendaciones, búsqueda y enlaces directos.
3. Preservar el progreso existente y la distinción entre contenido publicado y planificado. No simular cursos completados para desbloquear entradas.
4. Reutilizar los repasos por concepto, evitando versiones duplicadas que puedan divergir entre especialidades.
5. Verificar entrada sin progreso a cada ruta, secuencia interna, ayudas entre rutas, acceso por URL, ramas opcionales y conservación de logros anteriores.
6. Desarrollar la presentación mediante componentes y estilos coherentes en escritorio y móvil. Integrar el símbolo definitivo en navegación, favicon y demás usos de marca.
