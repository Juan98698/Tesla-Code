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
