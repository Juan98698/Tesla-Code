# Tesla Tutor: configuración y alcance

El panel «Pregúntale a Tesla» se carga al abrirlo. Ofrece explicación desde cero, pistas, ayuda para leer errores y miniprácticas. Conserva en memoria las últimas tres parejas de pregunta/respuesta por lección, hasta ocho conversaciones; muestra como máximo veinte mensajes por conversación. Cerrar no borra la conversación y recargar sí. «Borrar conversación» limpia el historial de esa lección. No escribe logros, prácticas, evaluaciones ni XP.

## Primera prueba en tu equipo

1. Entra en [Google AI Studio](https://aistudio.google.com/), inicia sesión y abre API Keys. Copia una clave o crea una nueva para tu proyecto. [Instrucciones oficiales](https://ai.google.dev/gemini-api/docs/api-key).
2. Copia `.env.example` a `.env.local` si aún no existe. Coloca la clave después de `GEMINI_API_KEY=` y guarda. No la pegues en un chat ni en JavaScript del navegador.
3. Ejecuta `npm start` y abre `http://127.0.0.1:3000`. El servidor sirve únicamente `dist/`; `.env.local` está ignorado por Git y queda fuera del sitio público.
4. Pulsa «Pregúntale a Tesla» y envía una pregunta. Puedes comprobar una única consulta real desde la terminal con `npm run tutor:smoke`. Este comando usa la API y consume su cuota; no imprime claves ni errores privados del proveedor.

El modelo inicial es `gemini-3.5-flash-lite`, configurable mediante `GEMINI_MODEL`. La disponibilidad, las cuotas y el tratamiento de datos dependen del proyecto y plan de Google. Consulta [modelos](https://ai.google.dev/gemini-api/docs/models), [tarifas](https://ai.google.dev/gemini-api/docs/pricing) y [deprecaciones](https://ai.google.dev/gemini-api/docs/deprecations) antes de cambiarlo. Crear una clave no garantiza que un modelo concreto esté habilitado.

El modo local utiliza contadores en memoria, adecuados para desarrollo. No simula respuestas si falta la clave: el panel comunica que la IA todavía no está conectada. El motor real de Gemini se mantiene separado de los simuladores didácticos de la ruta de IA.

### Si aparece desconectado en localhost

Un commit no activa la API local. Detén el servidor anterior con Ctrl+C y ejecuta `npm start` en la raíz del proyecto. Abre `http://127.0.0.1:3000`; un servidor estático como Live Server o `serve` no ejecuta `api/tutor.mjs`, aunque muestre correctamente la interfaz. Después de cambiar `.env.local`, reinicia el servidor.

`npm run tutor:doctor` comprueba la presencia de la clave, la configuración local y la API del puerto configurado, sin mostrar secretos ni consumir consultas de Gemini. Distingue la preparación local de los contadores compartidos exigidos en Vercel. Que la configuración esté lista no demuestra una consulta al proveedor; esa prueba se hace con el chat o `npm run tutor:smoke`.

## Dónde modificar el comportamiento

- **Personalidad y enseñanza:** `server/tutor/knowledge.mjs`, función `tutorPrompt()`. Aquí se definen tono, explicación desde cero, uso de pistas, longitud orientativa, límites y las instrucciones de cada modo. `selectKnowledge()` decide qué lecciones se usan como referencia.
- **Botones y textos del panel:** `js/features/tutor-chat.js`, objeto `modes` y plantilla del diálogo. Cambiar estos textos no reemplaza las instrucciones del servidor.
- **Modelo y generación:** `server/tutor/gemini.mjs`; el modelo puede cambiarse con `GEMINI_MODEL` sin editar código. Las cuotas se configuran mediante las variables documentadas abajo.

Reinicia el servidor local después de editar las instrucciones. En Vercel hace falta desplegar la nueva versión. Prueba el cambio con una duda inicial, un error de código y una petición de solución completa; comprueba que siga explicando sin asumir conocimientos previos. El retrato del tutor reutiliza `assets/hologram/nikola-reference.webp`, derivado de la imagen aportada por el propietario, y se solicita al abrir el panel.

## Publicar en Vercel

1. Importa el repositorio en un proyecto de Vercel. Framework: **Other**. La configuración del repositorio establece `npm run build` y directorio de salida `dist`.
2. En **Settings → Environment Variables**, configura `GEMINI_API_KEY` y, si deseas cambiarlo, `GEMINI_MODEL`. Márcalos para los entornos que vayas a utilizar. Nunca uses un prefijo de variable pública para la clave.
3. Añade una integración **Upstash Redis** desde Storage/Marketplace de Vercel. Configura `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` con sus credenciales REST. Esta base guarda únicamente contadores de uso; no almacena preguntas, código ni respuestas. Revisa el plan y las cuotas de esa integración al crearla.
4. Crea `TUTOR_IP_HASH_SECRET` con un valor aleatorio de al menos 32 caracteres. Puedes generarlo localmente con `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` y guardarlo como secreto en Vercel.
5. En `TUTOR_ALLOWED_ORIGINS`, indica los orígenes exactos de la web, separados por comas y sin rutas ni barra final, por ejemplo `https://tusitio.vercel.app`. El servidor también admite los dominios de producción y despliegue que Vercel proporciona mediante sus variables de sistema.
6. Realiza el despliegue y prueba una pregunta real desde el dominio publicado. Actualizar variables requiere aplicarlas mediante un nuevo despliegue. Comprueba la respuesta, el estado de las cuotas y el funcionamiento de detener/reintentar.

La función está en `api/tutor.mjs`, con lógica privada en `server/tutor/`. Vercel ejecuta esa función; GitHub Pages solo puede alojar la parte estática. Puedes conservar GitHub Pages cambiando `content/tutor-config.json` para que `endpoint` sea la URL HTTPS completa de la función en Vercel e incluyendo el origen de Pages en `TUTOR_ALLOWED_ORIGINS`.

## Contenido y método docente

`npm run tutor:knowledge` genera `server/tutor/knowledge-data.json` a partir de las explicaciones publicadas, sus títulos y objetivos. No incorpora cuestionarios, respuestas de evaluación, soluciones, tests ni borradores del estudiante. La validación comprueba que ese índice corresponda al contenido actual; vuelve a generarlo después de editar lecciones.

Cada consulta envía el identificador de la lección actual y hasta seis mensajes previos. El servidor valida esos datos, selecciona la explicación actual y como máximo una lectura anterior de la misma ruta, relacionada por su título u objetivos; no propone lecciones futuras como apoyo. Una consulta general selecciona hasta dos lecturas publicadas. La interfaz enlaza únicamente esas lecturas verificadas, separadas de la respuesta generada. El código del editor no se envía automáticamente: el estudiante debe pegarlo o pulsar «Tomar código del editor» y enviar la pregunta.

Las instrucciones del tutor favorecen vocabulario explicado, ejemplos breves y preguntas de comprensión; en modo pista evita la solución final. Son instrucciones a un modelo probabilístico, no una garantía absoluta de comportamiento. Hay que evaluar respuestas reales con dudas de principiantes, errores frecuentes y peticiones adversarias antes de presentar su calidad docente como validada. El modelo no dispone de herramientas, ejecución de código ni navegación web. No se presenta como fuente de actualidad verificada.

Las respuestas admiten títulos, listas, énfasis y bloques de código inertes, construidos como texto y elementos DOM seguros, sin insertar HTML del modelo ni ejecutar sus instrucciones. Un stream interrumpido se marca como incompleto y no se agrega al contexto conversacional confirmado. Las respuestas truncadas muestran su límite. Cambiar de lección cierra y cancela la consulta activa; cada lección conserva su propio historial local.

## Consumo, privacidad y límites

Valores iniciales: 20 consultas por minuto y conexión, 200 por día y conexión, 1000 por día para el proyecto. Se ajustan con `TUTOR_PER_MINUTE`, `TUTOR_PER_IP_DAY` y `TUTOR_GLOBAL_DAY`. Una conexión compartida por un grupo de RIWI comparte esas cuotas; no son límites de una cuenta individual. Los días de las cuotas son UTC y no cambian la racha local del estudiante.

En producción los contadores son compartidos mediante una operación atómica en Redis; no se sustituyen silenciosamente por memoria de una función. Si faltan credenciales o falla el servicio de cuotas, no se consulta Gemini. Cada intento aceptado reserva una consulta, incluso si el proveedor falla después. El proveedor puede cobrar trabajo iniciado aunque el estudiante pulse detener.

Se limitan cuerpo HTTP a 24 KB, pregunta a 2000 caracteres, código a 4000, historial a seis mensajes de 1800 caracteres, salida solicitada a 1400 tokens y texto recibido a 12000 caracteres. El servidor interrumpe consultas de más de 28 segundos. Estas cotas limitan uso, no constituyen un presupuesto monetario exacto. Las cuotas y controles del proveedor y de la plataforma de alojamiento siguen siendo relevantes.

La IP se utiliza para contar solicitudes y se transforma mediante HMAC diario antes de guardarla en Redis; no se guardan IPs en claro en esos contadores. El código de TeslaCode no registra conversaciones ni la clave. Google recibe el contenido enviado y aplica sus propias condiciones y tratamiento de datos. Borrar el historial de la página no elimina posibles registros de los proveedores.

La lista CORS permite los orígenes configurados, pero no autentica personas ni bloquea clientes ajenos al navegador. Para exposición pública más amplia se pueden añadir las reglas de protección del Firewall de Vercel o autenticación; no se presenta el tutor anónimo como un servicio sin posibilidad de abuso. Las cuotas compartidas siguen limitando las solicitudes al modelo.

## Verificación

`npm run test:coverage` incluye frontend, adaptadores, protocolo y servidor del tutor. Comprueba límites, JSON y roles inválidos, CORS, configuración ausente, cuotas, cancelación, errores del proveedor, streams partidos y exclusión de soluciones del índice.

`npm run test:tutor` construye el sitio público y recorre el panel contra un servidor HTTP real en escritorio/móvil, con respuestas de Gemini simuladas en la frontera de red. Verifica carga diferida, contexto, consentimiento al compartir código, streaming, reintento, detener, foco, progreso intacto, temas y WCAG automático. Comprueba además que no se publiquen secretos/servidor y que el video conserve soporte HTTP Range. Esta prueba no acredita una respuesta de Gemini ni una instancia de Redis reales; esas conexiones requieren la configuración del propietario y su comprobación específica.
