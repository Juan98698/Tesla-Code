# Colaborar con TeslaCode

Usa Node 24 o 26 y ejecuta `npm ci`. Con nvm, `nvm install` y `nvm use` seleccionan la versión de `.nvmrc`. Node 22 puede seguir soportado por Node.js, pero no forma parte de la matriz de esta edición; la restricción del proyecto es deliberada. No hace falta instalar Python ni Chromium para empezar a editar o ejecutar `npm run check`.

`npm run check` valida recursos, contenido y pruebas unitarias. Incluye el motor Python real de la dependencia npm fijada: una vez instalado, esas pruebas no descargan el runtime de una CDN. Para desarrollo visual, `npm start` abre el servidor en el puerto 3000.

La batería completa requiere Python de la línea admitida, Git y Chromium:

```sh
npx playwright install chromium
npm run test:all
npm run format:check
```

En Linux, si faltan bibliotecas de Chromium, utiliza la instalación con dependencias de Playwright o el navegador del sistema. `CHROMIUM_PATH` permite seleccionar el ejecutable. CI ya prepara Python y Chromium. Un fallo por falta de esas herramientas es un requisito del entorno; no implica que una lección sea incorrecta.

Antes de entregar cambios:

1. Lee [la guía editorial](docs/content-guide.md) si cambias contenido y [la arquitectura](docs/architecture.md) si cambias comportamiento.
2. Conserva IDs de lecciones, preguntas y actividades para proteger el progreso. Separa cambios de contrato de simples cambios de presentación.
3. Ejecuta las pruebas pertinentes. Para un cambio del ejecutor usa unidades, `npm run test:python`, `npm run test:console` y `npm run test:javascript`; para navegación, `test:access` y `test:e2e`.
4. Aplica `npm run format`, que también actualiza la edición de recursos. Revisa el diff y las huellas editoriales; no renueves aprobaciones para ocultar un fallo.
5. Describe comportamiento, verificación y limitaciones en la pull request.

No incorpores materiales de terceros sin documentar su permiso. El titular todavía debe elegir las licencias del código y del contenido; [el inventario de procedencia](docs/assets-and-licensing.md) registra lo que falta. No se presume cesión de derechos por el hecho de enviar una contribución.
