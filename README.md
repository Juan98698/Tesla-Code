# TeslaCode

Academia interactiva de programación en español. Combina rutas visuales, lecciones por etapas (aprender, practicar y comprobar), simuladores y proyectos. El sitio funciona como archivos estáticos con módulos ES: no necesita backend, cuenta, claves de API ni compilación.

## Desarrollo

Requiere Node.js >=20; CI usa Node.js 22.

```sh
npm ci
npm start
```

El servidor escucha en el puerto 3000. Abre el sitio mediante HTTP, no mediante `file://`. Las dependencias de npm son herramientas de desarrollo; no se cargan en la aplicación.

```sh
npm run check        # Contenido, dependencias curriculares y pruebas del dominio
npm run test:e2e     # Chromium: navegación, aprendizaje, simuladores y accesibilidad
npm run test:module  # Piloto del módulo inicial: 17 lecciones, escritorio y móvil
npm run test:coverage # Cobertura de los 18 módulos de aplicación (Node >=22)
npm run test:all     # Todos los controles anteriores, ejemplos y recorridos
npm run format      # Formato consistente
python3 tests/python-examples.py # Ejemplos del curso (requiere Python 3)
```

Para las pruebas de navegador se usa Chromium del sistema si existe. En otra máquina:

```sh
npx playwright install chromium
npm run test:e2e
```

También puedes indicar `CHROMIUM_PATH`. Las pruebas levantan y cierran su propio servidor en el puerto 4317 (recorridos generales) o 4318 (piloto). No uses esos puertos para otro servicio durante la ejecución.

## Qué está disponible

- Seis mapas de rutas: Fundamentos, Algoritmia, Frontend, Backend, Bases de datos e IA.
- **83 lecciones publicadas** con explicación, práctica, pistas y evaluación. Los demás temas se muestran como **en preparación**, sin simular que incluyen un curso.
- **Fundamentos completo: 68 lecciones**, desde Primeros pasos hasta Experto. Incluye Python, Git, colecciones, objetos, diseño, pruebas, concurrencia, seguridad, observabilidad y proyectos integradores.
- IA: siete lecciones introductorias sobre modelos, inferencia, LLM, prompts, difusión, conceptos siguientes/LCM y criterios de proyecto. El mapa técnico distingue aplicaciones, modelos, difusión, investigación y producción.
- Primeras dos lecciones de las otras cuatro especializaciones, con requisitos entre rutas.
- Laboratorios de variables, ciclos, condicionales, segmentación de texto y señal/ruido; proyectos de propinas y adivinación; intérprete acotado de pseudocódigo.

Las simulaciones de IA son didácticas y locales: no ejecutan modelos ni consumen APIs. El editor acotado acepta asignaciones numéricas, aritmética y `mostrar`; no ejecuta Python o JavaScript arbitrarios. Los proyectos de Python se reproducen localmente siguiendo las instrucciones.

## Progreso

Se conserva en `localStorage`, con migración del formato anterior. Una lección nueva se completa al resolver sus prácticas y lograr al menos 80 % en una comprobación. Las preguntas y opciones cambian de orden. Cada pregunta correcta otorga XP una sola vez; completar una lección agrega una recompensa única. Las dificultades por concepto se calculan a partir del último intento de cada lección, sin presentarlas como una certificación de dominio.

Se puede guardar una lección y exportar una copia del progreso en JSON. No hay cuentas, sincronización entre dispositivos ni importación automática del archivo. Si el almacenamiento está bloqueado, la sesión funciona en memoria y comunica que no pudo guardar.

## Organización y ampliación

Consulta [arquitectura](docs/architecture.md), [mapa curricular](docs/curriculum.md) y [guía editorial](docs/content-guide.md) y [auditoría conceptual](docs/pedagogical-audit.md).

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

## Publicación

Se puede servir en GitHub Pages desde la raíz de `main`. La navegación por fragmentos permite entrar directamente a una ruta o lección sin configurar redirecciones del servidor. Los recursos usan rutas relativas y funcionan bajo un subdirectorio de proyecto. La publicación no se ejecuta desde las herramientas de desarrollo.

El diseño y los textos nuevos son originales. Se tomaron como referencias de producto las rutas de academias y los mapas interactivos; no se incorporaron materiales de Platzi ni de roadmap.sh. Para LCM se enlaza la implementación y el artículo originales de Meta en la lección correspondiente.
