# TeslaCode

Plataforma web para aprender programación con rutas completas, de cero a avanzado, sin vacíos conceptuales. Sitio estático: sin dependencias ni paso de compilación.

## Estructura

```
index.html              Estructura de la página
css/                    tokens (temas), base y componentes
js/
  main.js               Punto de entrada: une los módulos
  core/                 Utilidades: DOM, bus de eventos, almacenamiento
  domain/               Reglas puras: temario, desbloqueo, corrección, XP y rachas
  repositories/         Carga de contenido (JSON bajo demanda)
  features/             Interfaz: catálogo, lección, quiz, gamificación
  widgets/              Simuladores y juegos de cada lección
content/
  curriculum/           Un JSON por ruta: niveles, lecciones y conceptos
  lessons/<ruta>/       Un JSON por lección: requisitos, HTML, quiz y widget
tools/validate-content.mjs   Validador de contenido (también corre en CI)
```

## Patrones aplicados

- **Repository:** `content-repository.js` y `storage.js` ocultan de dónde vienen el contenido y el progreso.
- **Strategy:** `domain/grading.js` tiene un corrector por tipo de pregunta.
- **Observer:** `core/events.js`; el quiz emite eventos y la gamificación reacciona sin acoplarse.
- **Carga diferida:** las lecciones y los widgets se descargan solo cuando se usan.

## Agregar una lección

1. En `content/curriculum/<ruta>.json`, cambia el `status` de la lección a `"published"`.
2. Crea `content/lessons/<ruta>/<id>.json` con `id`, `requires` (conceptos ya enseñados), `html`, `quiz` (mínimo 4 preguntas) y, si hace falta, `widget`.
3. Si usa un widget nuevo, créalo en `js/widgets/` y regístralo en `js/widgets/index.js`.
4. Ejecuta `node tools/validate-content.mjs`. Falla si usas un concepto antes de enseñarlo.

## Ejecutar en local

Los módulos ES y `fetch` requieren un servidor, no funciona abriendo el archivo directamente:

```
npx serve .
```

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a un repositorio.
2. En Settings → Pages, elige "Deploy from a branch", rama `main` y carpeta `/ (root)`.
3. El sitio queda en `https://<usuario>.github.io/<repositorio>/`.

El progreso (XP, racha y lecciones aprobadas) se guarda en `localStorage`, en el navegador de cada persona.
