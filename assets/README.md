# Recursos visuales

El emblema conserva el rostro detallado y la composición T/perfil/terminal de la referencia aportada por el usuario. La computadora holográfica pertenece a la propuesta visual anterior y se conserva con sus maestros. El rediseño del 9 de noviembre de 2026 utiliza una escena CSS 3D con controles HTML y un laboratorio legible.

Los PNG son maestros generados a partir de esas instrucciones. Los PNG y los WebP anteriores quedan disponibles como fuentes recuperables; la escena no descarga la imagen de la computadora ni un motor gráfico.

La portada utiliza directamente el retrato frontal `ideaHolograma.png` aportado por el usuario el 9 de noviembre de 2026 (1199 × 1312 px, RGBA, 1 933 541 B). Sustituye la ilustración SVG anterior y conserva sus rasgos, cabello, ojos, bigote, traje e iluminación azul. La hoja de referencias adicional orienta el movimiento; sus poses de cuerpo completo no se incorporan al sitio. Los originales permanecen en Descargas.

`hologram/nikola-reference.webp` es una conversión del retrato a 512 × 560 px, calidad 88, alfa 100 y esfuerzo 6 con Sharp 0.35.5 del entorno de herramientas: 90 060 B. Se conserva la transparencia, sin regenerar ni retocar el rostro y sin instalar dependencias en el proyecto. El recurso se sirve desde el propio sitio, con carga diferida y la misma edición de caché que los módulos.

El renderizador nativo WebGL de `js/features/tesla-renderer.js` proyecta esta imagen sobre un relieve frontal ligero y desplaza la textura de los iris dentro de máscaras suaves. Dibuja bajo demanda y limita la resolución a DPR 2. La misma imagen funciona como alternativa estática en táctil, movimiento reducido, pausa y fallo de WebGL; al salir de pantalla se detiene el renderizado. Los siete controles de rutas siguen siendo HTML independiente.

El 9 de noviembre de 2026 el usuario aportó `TeslaGifCode.webp`: 800 × 450 px, 77 fotogramas de 33 ms, bucle de 2541 ms y 3 705 132 B. La navegación utiliza derivados de ese mismo archivo, sin regenerar el retrato: encuadre central cuadrado, 128 × 128 px, WebP de calidad 72 para la animación y 85 para el primer fotograma estático. La conversión se hizo con Sharp 0.35.5 del entorno de herramientas, sin añadir dependencias al proyecto ni modificar el original de Descargas.

- `brand/teslacode-spin.webp`: 168 744 B, conserva los 77 fotogramas, sus tiempos y el bucle; 95,4 % menos que el original.
- `brand/teslacode-still.webp`: 3998 B. Es el favicon y la alternativa para pausa, logo fuera de pantalla, pestaña oculta, movimiento reducido, ahorro de datos o fallo de la animación.

El logo visible solicita la animación en todas las secciones, incluidas las rutas, el laboratorio, el progreso y las lecciones. El logo oculto por el diseño responsive conserva la imagen estática y la pestaña oculta detiene el giro. Se mantiene un único montaje en la navegación para continuar al cambiar de vista y reutilizar el archivo cacheado. Hay un botón de pausa permanente en la cabecera. La marca mide 96 px en la barra lateral, 56 px en la barra compacta y 48–56 px en móvil/tableta, usando los mismos archivos optimizados. El fondo negro azulado y el borde cian se mantienen también en el tema claro. El original aportado permanece en su ubicación del usuario y no forma parte de la descarga del sitio.
