# Implementación del plan de mejora

Fecha: 7 de noviembre de 2026. Este registro contrasta el trabajo con [el diagnóstico original](diagnostico-plataforma.md) y [el plan integral](plan-mejora-plataforma.md). Describe una primera entrega funcional; no declara finalizadas todas las fases ni sustituye una revisión docente.

## Resultado disponible

| Área               | Cambio comprobable                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Python             | Nueva ruta independiente de 67 temas, con un primer módulo de siete lecciones publicadas hasta un presupuesto. Las otras 60 siguen en preparación.                                                                 |
| Algoritmia         | Once lecciones principales conceptuales/en pseudocódigo y un laboratorio Python opcional. Publicado Análisis hasta invariantes; teorema maestro queda después como profundización.                                 |
| Práctica           | Las 19 lecciones de Python/Algoritmia tienen tres actividades y fuentes. Trece actividades ejecutan Python real: doce en Python y una en Algoritmia.                                                               |
| Acceso y secuencia | Todas las rutas conservan entrada libre. `progressionRequires` regula pasos internos; `dependsOn`/`requiresConcepts` representan conocimientos. Los laboratorios opcionales no bloquean el núcleo.                 |
| Dependencias       | Algoritmia conecta colas/pilas con recorridos, prioridad con Dijkstra y ordenamiento con Kruskal; elimina los vínculos artificiales hash→colas y grafos→tries. Python presenta clases/subclases antes de unittest. |
| Ejecución          | Pyodide bajo demanda, editor con borrador/restauración, casos visibles, ejecutar/detener, salida y errores. Worker dentro de marco con origen aislado; cancelación al navegar.                                     |
| Progreso           | Importación validada v1/v2 con vista previa, combinación, respaldo previo y deshacer. Reimportar una copia no duplica XP. IDs y logros anteriores conservados.                                                     |
| Publicación futura | Fuentes y tres prácticas como mínimo estructural. Registro explícito de 83 publicaciones heredadas pendientes de profundización. Huellas incluyen orden y justificación de dependencias.                           |
| Colaboración       | Guía rápida sin exigir Chromium/Python para `check`; requisitos de la batería completa separados. Estilos nuevos del editor en `practice.css`.                                                                     |

El catálogo pasa de 90/343 a 102/411 publicaciones/temas. Añadir el mapa Python amplía el alcance pendiente; no se presenta como una mejora artificial del porcentaje. Hay 46 lecciones con fuentes y 140 actividades en total. Son datos de cobertura, no evidencia de aprendizaje.

## Evidencia técnica y sus límites

Verificación local de esta entrega: 96 pruebas unitarias aprobadas; 28 módulos cubiertos, con 99,12 % de líneas, 94,61 % de ramas y 97,75 % de funciones. El recorrido general renderiza las 102 lecciones y resuelve sus 140 actividades. También pasan los recorridos independientes de Fundamentos, Algoritmia y Python, la actualización de caché y las comprobaciones automáticas de accesibilidad. Entorno local: Node 24.22.1 y CPython 3.12.14; no se atribuye ejecución local de Node 26 a este lote.

- Pruebas unitarias de dominio, adaptadores, componentes y herramientas; cobertura global y por archivo, sin reducir umbrales.
- Soluciones de todos los ejercicios Python ejecutadas en la distribución fijada. Casos incorrectos, errores de sintaxis, excepciones, entrada insuficiente, salida excesiva y soluciones equivalentes.
- Recorridos de Python desde cero en escritorio y móvil, con comprobaciones, bloqueos, persistencia, navegación durante ejecución y accesibilidad automática en ambos temas.
- Pruebas de recuperación: archivo corrupto, tamaño/versión inválidos, vista previa, cancelación, respaldo, deshacer, combinación repetida y fallo de almacenamiento.
- 44 programas visibles probados con CPython 3.12.14 y un ejemplo Git. La comprobación adicional en Pyodide cubrió 43 programas; el ejemplo de hilos permanece local.

Las revisiones registran autoría asistida y revisión independiente pendiente. Las actualizaciones de huellas por migración de metadatos no se presentan como una nueva revisión de profundidad de las otras rutas. Las pruebas del navegador no equivalen a un piloto con estudiantes. También se ejecutó un programa con archivos obtenidos de la CDN real a través del proxy verificado del entorno; no es una medición representativa de una conexión móvil.

Deshacer no restaura una copia antigua si ya hay nuevos logros, intentos o favoritos posteriores a la importación. En ese caso conserva ambos, explica el motivo y evita perder el trabajo posterior.

El motor usa Pyodide 314.0.7, que declara Python 3.14.2. Requiere conexión para la descarga inicial. No incluye cuota dura de memoria ni compatibilidad universal con paquetes, hilos, procesos o servicios del sistema. Los casos son visibles y el progreso es local: la plataforma no emite una certificación protegida contra manipulación.

## Estado del plan completo

| Fase                           | Estado                    | Pendiente concreto                                                                                                                                                                                                                      |
| ------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0: alcance y confianza        | Parcial                   | Elegir licencias y documentar derechos de recursos; el inventario está en `assets-and-licensing.md`. No se concedieron derechos ni eliminaron maestros.                                                                                 |
| P1: grafo conceptual           | Parcial                   | Modelo separado en siete rutas; revisión semántica realizada para Algoritmia y el mapa Python. Falta contrastar las dependencias y profundidad de las restantes especialidades.                                                         |
| P2: Algoritmia/Python/práctica | Primer lote implementado  | Completar Python tras el presupuesto y Algoritmia tras invariantes, con la misma disciplina editorial y pruebas. La medición publicada explica conteos en pseudocódigo; un laboratorio de reloj necesita su propio diseño reproducible. |
| P3: aprendizaje y recuperación | Recuperación implementada | Revisión independiente, piloto con participantes, retención y ajustes derivados de evidencia real. No hay equivalencias automáticas de acreditación entre rutas.                                                                        |
| P4: catálogo                   | En desarrollo por módulos | 309 temas planificados pendientes; profundizar las 83 publicaciones heredadas del registro editorial. Priorizar resultados integradores, sin rellenar lecciones para aumentar cifras.                                                   |
| P5: mantenimiento              | Preparación               | Auditoría completa de CSS, medición en móviles/conexiones representativas, destino recuperable de PNG y ampliaciones avanzadas de algoritmos.                                                                                           |

## Siguiente lote

1. Python: comparaciones → decisiones → listas/índices → for → while → funciones → proyecto de resumen de datos. Explicar cada construcción antes del ejercicio y añadir casos de límite y fallos frecuentes.
2. Algoritmia: estructuras lineales y análisis de sus operaciones, manteniendo pseudocódigo como núcleo y código real como aplicación opcional.
3. Revisar Fundamentos empezando por listas, funciones, recursión, errores y proyectos; retirar entradas del registro editorial solo con evidencia.
4. Contrastar el módulo inicial con una persona docente y participantes de los perfiles previstos. Incorporar sus hallazgos antes de replicar el patrón sin cambios a todas las rutas.

Los puentes existentes se reutilizan como repasos. Las nuevas lecciones de Python responden a objetivos propios y no se acreditan automáticamente por coincidencia de títulos. El contenido no redactado permanece visible como planificación.
