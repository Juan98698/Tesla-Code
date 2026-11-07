# TeslaCode

Academia interactiva de programación en español. Combina rutas visuales, lecciones por etapas (aprender, practicar y comprobar), simuladores y proyectos. El sitio funciona como archivos estáticos con módulos ES: no necesita backend, cuenta, claves de API ni compilación.

## Desarrollo

Requiere una línea LTS verificada: **Node.js 24 o 26**. La versión preferida está fijada en `.node-version` y `.nvmrc` (actualmente 26.13.0); CI prueba ambas líneas. `engine-strict` rechaza versiones fuera de ese rango. Para los ejemplos se recomienda Python 3.15; también se comprueba compatibilidad con Python 3.12, que sigue recibiendo correcciones de seguridad.

```sh
npm ci
npm start
```

El servidor escucha en el puerto 3000. Abre el sitio mediante HTTP, no mediante `file://`. Las dependencias de npm sirven para desarrollo y pruebas. Los ejercicios de Python descargan bajo demanda una distribución fijada de Pyodide desde jsDelivr; el inicio y la lectura de lecciones no descargan ese motor.

```sh
npm run check        # Contenido, dependencias curriculares y pruebas del dominio
npm run technology:check # Vigencia de revisiones y líneas de soporte
npm run technology:check -- --online # Contraste con registros y calendario oficiales
npm run test:e2e     # Chromium: navegación, aprendizaje, simuladores y accesibilidad
npm run test:cache   # Actualización con caché previa y progreso existente
npm run test:access  # Entradas libres, orientación, repasos y secuencia interna
npm run test:module  # Piloto del módulo inicial: 17 lecciones, escritorio y móvil
npm run test:python  # Primer módulo Python completo, ejecución real y recuperación del progreso
npm run test:coverage # Cobertura global y por módulo (Node 24/26)
npm run test:all     # Todos los controles anteriores, ejemplos y recorridos
npm run format      # Formato consistente
python3 tests/python-examples.py # Ejemplos del curso (requiere Python 3)
```

Para las pruebas de navegador se usa Chromium del sistema si existe. En otra máquina:

```sh
npx playwright install chromium
npm run test:e2e
```

También puedes indicar `CHROMIUM_PATH`. Las pruebas levantan y cierran servidores entre los puertos 4317 y 4322. No uses esos puertos para otro servicio durante la ejecución. [CONTRIBUTING.md](CONTRIBUTING.md) distingue la comprobación rápida de la batería completa.

## Qué está disponible

- Siete mapas: Fundamentos, Algoritmia, Python, Frontend, Backend, Bases de datos e IA.
- **102 lecciones publicadas de 411 temas planificados** con explicación, ejemplos razonados, condiciones explícitas, práctica, pistas y evaluación. Los demás temas se muestran como **en preparación**, sin simular que incluyen un curso.
- **Fundamentos: 68 de 68 lecciones publicadas**, desde Primeros pasos hasta Experto. Incluye Python, Git, colecciones, objetos, diseño, pruebas, concurrencia, seguridad, observabilidad y proyectos integradores. La cobertura publicada no equivale a una validación independiente del aprendizaje.
- IA: nueve lecciones introductorias sobre modelos, inferencia, LLM, prompts, contexto, memoria, evaluación, difusión/flow matching, conceptos siguientes/LCM y criterios de proyecto. El mapa técnico distingue aplicaciones, modelos, difusión, investigación y producción.
- Algoritmia: **12 de 45 lecciones**: once del núcleo conceptual y en pseudocódigo, hasta invariantes, y un laboratorio Python opcional con código ejecutable. Cada una tiene tres prácticas. El laboratorio no bloquea el núcleo ni presupone conocer el lenguaje.
- Python: **7 de 67 lecciones**: un primer módulo desde cero hasta un presupuesto con entradas variables. Enseña cada instrucción antes de utilizarla, con predicción, reparación y construcción; incluye doce actividades de código. Los diez módulos restantes están planificados.
- Frontend, Backend y Bases de datos tienen dos lecciones publicadas cada una. Todas las rutas tienen entrada libre; la progresión obligatoria se conserva dentro de cada una, separada de sus dependencias académicas.
- Laboratorios de variables, ciclos, condicionales, segmentación de texto y señal/ruido; proyectos de propinas y adivinación; intérprete acotado de pseudocódigo.

Las simulaciones de IA son didácticas y locales: no ejecutan modelos ni consumen APIs. El editor de pseudocódigo acepta asignaciones numéricas, aritmética y `mostrar`. Los ejercicios marcados como Python ejecutan código real con **Pyodide 314.0.7 / Python 3.14.2**, muestran casos y errores y permiten detener, restaurar el código inicial y conservar borradores. El motor tiene límites de tiempo/salida y capacidades distintas de una instalación local; los ejemplos de hilos y otros proyectos de Fundamentos siguen siendo prácticas locales.

## Progreso

Se conserva en `localStorage`, con migración del formato anterior. Una lección nueva se completa al resolver sus prácticas y lograr al menos 80 % en una comprobación. Las preguntas y opciones cambian de orden. Cada pregunta correcta otorga XP una sola vez; completar una lección agrega una recompensa única. Las dificultades por concepto se calculan a partir del último intento de cada lección, sin presentarlas como una certificación de dominio.

Se puede guardar una lección, exportar el progreso en JSON e importar una copia con vista previa, combinación sin duplicar recompensas y opción de deshacer. El archivo no incluye borradores de código. No hay cuentas ni sincronización automática. Si el almacenamiento está bloqueado, la sesión funciona en memoria y comunica que no pudo guardar; no se aplica una importación sin poder conservar un respaldo.

## Interfaz y acompañamiento

Vista de trabajo en grafito con mapa conectado, laboratorio lateral, computadora holográfica y tarjetas de especialidades. Incluye ejemplos locales por ruta, animaciones pausables y temas claro/oscuro. La identidad conserva el perfil realista azul/cian de la referencia. Puedes elegir explicaciones paso a paso o empezar por la práctica; la orientación opcional y los repasos no conceden logros.

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

Se puede servir en GitHub Pages desde la raíz de `main`. La navegación por fragmentos permite entrar directamente a una ruta o lección sin configurar redirecciones del servidor. Los recursos usan rutas relativas y funcionan bajo un subdirectorio de proyecto. La publicación no se ejecuta desde las herramientas de desarrollo.

El diseño y los textos nuevos son originales. Se tomaron como referencias de producto las rutas de academias y los mapas interactivos; no se incorporaron materiales de Platzi ni de roadmap.sh. Para LCM se enlaza la implementación y el artículo originales de Meta en la lección correspondiente.
