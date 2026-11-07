# Publicar una edición coherente

Una página puede actualizar su HTML y sus imágenes mientras conserva módulos JavaScript de una edición anterior en la caché HTTP. En ese caso puede mostrar una identidad nueva con una portada y unas reglas de acceso antiguas. La validación con un navegador vacío no reproduce ese problema.

## Recursos de una misma edición

`tools/version-assets.mjs` calcula una huella del HTML, módulos, estilos, contenido y recursos. El índice incorpora esa huella en sus estilos, iconos y entrada JavaScript, y un import map asigna todos los módulos locales a URLs con la misma edición. También se versionan los módulos de los laboratorios que se cargan bajo demanda.

`assetUrl` aplica la edición del documento a imágenes y peticiones de contenido. El repositorio conserva su caché de promesas dentro de una sesión, pero las peticiones JSON usan `cache: no-store` y la URL de la edición para evitar datos anteriores del navegador o de un intermediario. `serve.json` pide revalidación HTTP sin borrar almacenamiento ni logros.

- `npm run assets:version`: regenera el índice después de cambiar recursos.
- `npm run assets:check`: rechaza ediciones incompletas o desactualizadas.
- `npm run format`: formatea y actualiza la edición automáticamente.
- `npm start`: actualiza la edición antes de servir la aplicación.

El import map usa rutas relativas y no necesita un empaquetador. Los hashes normalizan saltos de línea de archivos de texto y rutas, y `.gitattributes` fija LF para las fuentes. Los archivos generados se incluyen en el commit; CI verifica que correspondan al contenido publicado.

## Regresión con caché previa

`npm run test:cache` utiliza un servidor HTTP y un navegador real sin interceptar solicitudes. Precarga módulos y estilos antiguos con caché larga, además de un catálogo antiguo y un perfil de prueba con 180 XP y dos lecciones completadas. Una segunda navegación demuestra que esos recursos están realmente cacheados.

Después publica el índice actual en el mismo origen y comprueba que el grafo de módulos y el catálogo pertenecen a la nueva edición, que se puede entrar a las seis rutas y que las lecciones internas pendientes siguen bloqueadas. Los 180 XP y las finalizaciones anteriores se conservan. La fixture verifica compatibilidad; no representa haber cursado esas lecciones durante la prueba.

La actualización requiere que el servidor o el despliegue publique el nuevo índice. No se puede sustituir desde el repositorio una pestaña que siga ejecutando el documento anterior sin navegar o recargar. No hace falta borrar `localStorage` para actualizar la aplicación.
