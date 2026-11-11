# Atmósfera de TeslaCode

El usuario aportó `TeslaTres.png` (1672×941; 2.122.866 bytes) y `gemini_generated_video_bf9a2b67.mp4` (1280×720; 24 fps; 240 fotogramas; 10,026667 s; 5.250.390 bytes), desde su carpeta Downloads. No se sobrescribieron esos originales. La conversión no añade una licencia ni acredita términos de su generador.

`media.json` identifica los archivos de entrega, dimensiones, tamaños y SHA-256 del video:

- Fondo WebP: 1672×941, 229.352 bytes. Se reutiliza en todas las vistas.
- Cartel WebP del primer fotograma: 1920×1080, 22.046 bytes; solo se solicita al abrir la introducción.
- MP4 H.264: 1920×1080, 24 fps, 240 fotogramas, 10,026667 s y 10.280.328 bytes. Se copió la pista AAC original completa sin recodificarla. El índice `moov` está al principio para reproducción progresiva.

Se extrajo cada fotograma del original, se amplió con Lanczos y se aplicó nitidez moderada (`unsharp=5:5:0.3:3:3:0`). La codificación H.264 utiliza aproximadamente 8 Mb/s y conserva el cuadro entero. Una ampliación de 720p no recupera detalle nativo inexistente; no se presenta como video nativo Full HD ni como reconstrucción por IA.

La presentación usa `object-fit: cover` sin límites de tamaño que produzcan franjas. Llena la pantalla sin deformar la proporción; en formatos distintos de 16:9 se recorta parte del entorno. En vertical el punto de encuadre acompaña el desplazamiento de Tesla mediante los eventos nativos de reproducción, sin otro bucle de animación. La duración y el archivo codificado no cambian al ajustar la pantalla.

Procesamiento realizado fuera de la aplicación con Chrome, canvas y FFmpeg/Media Foundation disponibles en el equipo. No hay codificadores, modelos de ampliación ni dependencias gráficas nuevas en la descarga del sitio. Los prototipos de baja calidad y una conversión VP9 que falló al decodificar se descartaron de los recursos de entrega.

La reproducción real de la entrega se verificó hasta el evento `ended`: 240 fotogramas, sin fotogramas descartados en esa comprobación local. Las pruebas de navegador vuelven a comprobar dimensiones, encuadre, duración y transición en escritorio y móvil emulado. Esto no mide una conexión móvil real.

## Fondo auxiliar para el giro de la cabeza

`tesla-cleanplate-8946b68e5b.webp` (1024×576; 86.616 bytes) contiene el laboratorio sin la persona. Se generó con la herramienta integrada **imagegen**, usando `tesla-world-fee05fe4b1.webp` como referencia; no se utilizó CLI. El PNG generado se conservó en `C:/Users/Juan manuel/.codex/generated_images/01a1c193-8874-78a1-9db5-2f538ab9226a/exec-8888ae8f-cb50-4f8d-9e6b-3513d7232a27.png`. La entrega WebP se redujo y codificó con canvas de Chrome. No se sustituyeron el fondo original ni los rasgos de Tesla: el rostro animado conserva los píxeles de la fotografía aportada.

`tesla-head-mask.svg` (512×288; 554 bytes) delimita cabeza y cuello mediante una silueta vectorial. Ambos recursos se solicitan únicamente al activar el seguimiento con ratón; permiten ocultar la posición anterior de la cabeza sin arrastrar el laboratorio. La animación gira una malla de relieve con ángulos moderados, sin estirar las coordenadas de la fotografía. No es un modelo completo para vistas de perfil o giros de 360°.

Prompt final de imagegen:

> Use case: precise-object-edit. Asset type: clean background plate for animating an existing photographic bust. Edit the supplied wide blue Nikola Tesla laboratory illustration. Remove Nikola Tesla entirely (head, hair, neck, suit, arms), revealing only the continuing dark navy electrical laboratory and blue atmospheric sky behind him. Preserve the original camera, landscape framing and aspect ratio, towers, Tesla coils, technical blueprints, cyan electrical arcs, blue lighting and overall layout. No person, no face, no head, no text. The area formerly occupied by his head must become seamless dark blue stormy laboratory sky. Keep all pre-existing laboratory elements outside the figure as faithful as possible, without adding new focal objects. This is a background plate, not a redesign; the original face will be composited separately in the application.
