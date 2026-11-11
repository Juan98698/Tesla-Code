# TeslaCode

Academia interactiva de programación en español. Combina rutas visuales, lecciones por etapas (aprender, practicar y comprobar), simuladores y proyectos. El aprendizaje funciona con archivos estáticos y módulos ES, sin cuentas ni claves de API. El tutor de IA opcional utiliza una función de servidor en Vercel para conectar con Gemini.

## Desarrollo

Requiere una línea LTS verificada: **Node.js 24 o 26**. La versión preferida está fijada en `.node-version` y `.nvmrc` (actualmente 26.13.0); CI prueba ambas líneas. `engine-strict` rechaza versiones fuera de ese rango. Para los ejemplos se recomienda Python 3.15; también se comprueba compatibilidad con Python 3.12, que sigue recibiendo correcciones de seguridad.

```sh
npm ci
npm start
```

El servidor escucha en el puerto 3000. Abre el sitio mediante HTTP, no mediante `file://`. `npm start` genera `dist/` y sirve únicamente ese paquete público; `.env.local`, el servidor, las pruebas y las skills quedan fuera. Al editar el código, reconstruye el sitio o reinicia el servidor. Si sigue abierto el servidor anterior, detenlo primero con Ctrl+C. Las dependencias de npm sirven para desarrollo y pruebas. Los ejercicios de Python descargan bajo demanda una distribución fijada de Pyodide desde jsDelivr; el inicio y la lectura de lecciones no descargan ese motor.

Para activar **Tesla Tutor**, configura `GEMINI_API_KEY` en `.env.local` o como secreto de Vercel. El chat se carga al abrirlo y no lee ni envía automáticamente el código del editor. En producción necesita contadores compartidos de Upstash Redis para limitar el consumo entre instancias. Consulta la [guía de configuración y alcance](docs/tutor-gemini.md). Sin configuración, el aprendizaje continúa y el panel informa que la IA no está conectada.

```sh
npm run check        # Contenido, dependencias curriculares y pruebas del dominio
npm run technology:check # Vigencia de revisiones y líneas de soporte
npm run technology:check -- --online # Contraste con registros y calendario oficiales
npm run test:e2e     # Chromium: navegación, aprendizaje, simuladores y accesibilidad
npm run test:cache   # Actualización con caché previa y progreso existente
npm run test:access  # Entradas libres, orientación, repasos y secuencia interna
npm run test:module  # Piloto de la edición anterior: 17 lecciones, escritorio y móvil
npm run test:python  # Primer módulo Python completo, ejecución real y recuperación del progreso
npm run test:console # Consola, entradas, errores y ejemplos en escritorio y móvil
npm run test:javascript # Primer módulo JavaScript: ocho lecciones desde cero y motor real aislado
npm run test:coverage # Cobertura global y por módulo (Node 24/26)
npm run test:atmosphere # Intro Full HD completa, fondo global y controles accesibles
npm run test:tutor   # Tutor contra HTTP real con proveedor simulado, ambos temas y móvil
npm run tutor:smoke  # Una consulta real a Gemini con la clave local; consume cuota
npm run test:all     # Todos los controles anteriores, ejemplos y recorridos
npm run format      # Formato consistente
npm run test:examples # Ejemplos Python y Git (requiere Python y Bash)
```

Para las pruebas de navegador se usa Chromium del sistema si existe. En otra máquina:

```sh
npx playwright install chromium
npm run test:e2e
```

También puedes indicar `CHROMIUM_PATH`. Las pruebas levantan y cierran servidores entre los puertos 4317 y 4337. No uses esos puertos para otro servicio durante la ejecución. [CONTRIBUTING.md](CONTRIBUTING.md) distingue la comprobación rápida de la batería completa.

En Windows las pruebas detectan Chrome o Edge si Chromium de Playwright no está instalado. Las capturas se guardan en la carpeta temporal del sistema. En PowerShell, si el lanzador `npm.ps1` apunta a una instalación global inaccesible, usa `npm.cmd` con los mismos argumentos. `npm run test:examples` selecciona `python` en Windows y `python3` en otros sistemas; puedes indicar otro ejecutable con `PYTHON`. El ejemplo Git requiere Bash: en Windows se busca el de Git for Windows, y `BASH_PATH` permite seleccionar otro. No se utiliza automáticamente el lanzador de WSL.

`npm run test:progress` verifica aprendizaje paralelo en dos pestañas, conservación del progreso desde una tercera y recompensas únicas.

La consola JavaScript usa el motor del navegador y se inicia al ejecutar. Esta entrega admite programas síncronos, salida de `console.log` y `prompt()` adaptado a entradas precargadas; no abre diálogos. Ofrece ejecutar, comprobar, detener, limpiar, restaurar y borradores. Las prácticas comprueban comportamiento con casos visibles, no igualdad textual del código. DOM, módulos ES, asincronía, Node y terminal se incorporarán con sus entornos específicos.

## Qué está disponible

- Siete mapas: Fundamentos, Algoritmia, Python, Frontend, Backend, Bases de datos e IA.
- **46 lecciones publicadas en los recorridos actuales**, más **68 en la edición anterior de Fundamentos**, conservadas con sus enlaces y logros. El inventario completo tiene 459 entradas, incluidas las archivadas y los bloques futuros. Los temas pendientes aparecen **en preparación**.
- **Fundamentos con JavaScript: primer módulo completo de ocho lecciones**, 15 ejemplos ejecutables, 24 ejercicios de código y 40 preguntas. Enseña editor y consola, textos/números, secuencia, errores/comentarios, const, let, operaciones, lectura de entradas y conversión antes del proyecto de tarjeta y plan de práctica. Los otros 17 bloques permanecen en preparación; sus entradas representan bloques por desarrollar, no lecciones ya redactadas.
- La edición anterior conserva sus 68 lecciones desde Primeros pasos hasta Experto. Se consulta desde el mapa de Fundamentos y desde sus URLs originales. Sus finalizaciones y XP permanecen; no acreditan las nuevas prácticas JavaScript.
- Primeros pasos (edición anterior): sus dos lecciones incluyen fuentes, ejemplos razonados, errores frecuentes y tres actividades cada una: comprensión, práctica guiada y transferencia. La revisión asistida reduce la deuda editorial a 81 lecciones; la revisión independiente sigue pendiente.
- IA: 13 lecciones de exploración desde cero, con 52 prácticas, 39 casos de evidencia y 68 preguntas. LLM, difusión y NCM son centrales. El mapa de 96 temas añade puentes de JavaScript, Python y matemáticas, ingeniería y proyectos; 83 temas siguen en preparación. Consulta el [temario y sus límites](docs/ia-curriculum.md).
- Algoritmia: **12 de 45 lecciones**: once del núcleo conceptual y en pseudocódigo, hasta invariantes, y un laboratorio Python opcional con código ejecutable. Cada una tiene tres prácticas. El laboratorio no bloquea el núcleo ni presupone conocer el lenguaje.
- Python: **7 de 67 lecciones**: un primer módulo desde cero hasta un presupuesto con entradas variables. Enseña cada instrucción antes de utilizarla, con predicción, reparación y construcción; incluye doce actividades de código. Los diez módulos restantes están planificados.
- Frontend, Backend y Bases de datos tienen dos lecciones publicadas cada una. Todas las rutas tienen entrada libre; la progresión obligatoria se conserva dentro de cada una, separada de sus dependencias académicas.
- Laboratorios de variables, ciclos, condicionales, segmentación de texto y señal/ruido; proyectos de propinas y adivinación; intérprete acotado de pseudocódigo.

Las simulaciones de IA son didácticas y locales: no ejecutan modelos ni consumen APIs. El editor de pseudocódigo acepta asignaciones numéricas, aritmética y `mostrar`. Las trece prácticas Python y los 43 ejemplos compatibles incluyen una consola con **Pyodide 314.0.7 / Python 3.14.2**. **Ejecutar código** muestra lo impreso y los errores; permite proporcionar entradas para `input()`, detener y limpiar la consola. **Comprobar ejercicio** evalúa los casos publicados y puede acreditar la práctica; experimentar por sí solo no concede progreso. Los borradores se conservan y se puede restaurar el código inicial.

El motor tiene límites de tiempo/salida y capacidades distintas de una instalación local. El ejemplo de hilos explica cómo ejecutarlo en el equipo; los comandos de terminal y Git siguen siendo locales. Cada ejecución Python en el navegador empieza de nuevo y sus archivos son temporales.

## Progreso

Se conserva en `localStorage`, con migración del formato anterior. Una lección nueva se completa al resolver sus prácticas y lograr al menos 80 % en una comprobación. Las preguntas y opciones cambian de orden. Cada pregunta correcta otorga XP una sola vez; completar una lección agrega una recompensa única. Las dificultades por concepto se calculan a partir del último intento de cada lección, sin presentarlas como una certificación de dominio.

Se puede guardar una lección, exportar el progreso en JSON e importar una copia con vista previa, combinación sin duplicar recompensas y opción de deshacer. El archivo no incluye borradores de código. No hay cuentas ni sincronización automática. Si el almacenamiento está bloqueado, la sesión funciona en memoria y comunica que no pudo guardar; no se aplica una importación sin poder conservar un respaldo.

## Interfaz y acompañamiento

Un laboratorio eléctrico de Nikola Tesla acompaña todas las vistas con paneles de cristal, profundidad y símbolos de programación flotantes. El texto y las consolas mantienen fondos suficientes para leer en ambos temas. Las siete rutas siguen siendo botones accesibles, distribuidos alrededor del rostro completo. Una malla de relieve gira la cabeza fotografiada con ángulos moderados y desplaza los iris independientemente para seguir el cursor; no es un personaje 3D completo. El renderizador y sus recursos auxiliares se cargan al primer movimiento de ratón compatible y se detienen en reposo o fuera de pantalla; en táctil, movimiento reducido, ahorro de datos o fallo de WebGL conserva el fondo estático. El retrato frontal aportado por el propietario identifica al tutor en un panel de lectura ampliado. El LAB explica su objetivo, propone una prueba e interpreta el resultado.

La primera entrada al inicio muestra una introducción de 10 segundos, sin sonido hasta activarlo, con pausa y acceso directo al sitio. Termina con un fundido al fondo global. «Intro» permite repetirla. Se reproduce automáticamente una vez por sesión; no descarga video al entrar directamente a una lección, con ahorro de datos, movimiento reducido o animaciones pausadas. El MP4 de entrega ocupa 10,28 MB y conserva los 240 fotogramas y el audio original. Se reprocesó de 720p a 1920×1080 con nitidez moderada; no equivale a una grabación Full HD nativa. Llena la pantalla sin franjas ni deformación; el encuadre recorta el entorno según el formato y acompaña a Tesla en móvil.

La escena y los símbolos se detienen al ocultar la pestaña o pausar el movimiento. Puedes elegir explicaciones paso a paso o empezar por la práctica; la orientación opcional y los repasos no conceden logros. Consulta [procedencia y procesamiento de los medios](assets/atmosphere/README.md).

Consulta [la coherencia de publicación](docs/release-coherence.md) y [la dirección de producto](docs/product-direction.md) para las decisiones de acceso e identidad.

## Organización y ampliación

Consulta [arquitectura](docs/architecture.md), [mapa curricular](docs/curriculum.md) y [guía editorial](docs/content-guide.md) y [auditoría conceptual](docs/pedagogical-audit.md) y [política de actualidad](docs/technology-currency.md).

El [diagnóstico contrastado](docs/diagnostico-plataforma.md) conserva la línea base. El [plan integral](docs/plan-mejora-plataforma.md) prioriza profundidad, dependencias reales, práctica ejecutable y recorridos completos. El [registro de implementación](docs/implementation-status.md) distingue lo entregado de la cobertura, revisión independiente y mantenimiento todavía pendientes.

```text
content/curriculum/     Mapas, estados y requisitos de lecciones
content/concepts.json  Conceptos con ID y punto de introducción
content/lessons/        Explicaciones, prácticas y comprobaciones
js/domain/             Reglas de aprendizaje, progreso e intérprete
js/repositories/       Acceso a contenido
js/core/               DOM, almacenamiento y escape de texto
js/features/           Vistas y actividades
js/widgets/            Simulaciones de carga diferida
css/                   Tokens, base y componentes adaptables
tests/                Pruebas de dominio y navegador
```

El validador comprueba integridad, dependencias explícitas, fragmentos explicativos y evaluaciones por concepto, y vigencia de las revisiones mediante huellas de contenido. La suficiencia de las explicaciones, la precisión de los ejemplos y los requisitos omitidos necesitan revisión pedagógica humana.

Las publicaciones nuevas necesitan fuentes y al menos tres prácticas; `content/editorial-backlog.json` registra las publicaciones heredadas pendientes de ese estándar. Es un mínimo estructural, no una garantía automática de comprensión.

## Publicación

Vercel utiliza `vercel.json`, construye `dist/` y ejecuta `api/tutor.mjs` como función de servidor. Las claves se configuran como secretos del proyecto. También se puede publicar el contenido de `dist/` en GitHub Pages; para el tutor, configura la URL de la función de Vercel en `content/tutor-config.json` y su lista de orígenes permitidos. La navegación por fragmentos permite entrar directamente a una ruta o lección sin redirecciones del servidor. Los recursos estáticos funcionan bajo un subdirectorio. `npm run build` prepara el paquete; no lo publica.

El diseño y los textos nuevos son originales. Se tomaron como referencias de producto las rutas de academias y los mapas interactivos; no se incorporaron materiales de Platzi ni de roadmap.sh. Para LCM se enlaza la implementación y el artículo originales de Meta en la lección correspondiente.
