import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import serve from 'serve-handler';
import { createTutorHandler, tutorReady } from '../server/tutor/handler.mjs';

export function createDevServer({
  root = resolve('dist'),
  handle = createTutorHandler(),
  port = 3000,
} = {}) {
  return createServer(async (incoming, outgoing) => {
    if (incoming.url?.split('?')[0] !== '/api/tutor') {
      return serve(incoming, outgoing, {
        public: root,
        directoryListing: false,
        headers: [
          {
            source: '**/*',
            headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }],
          },
        ],
      });
    }
    const controller = new AbortController();
    outgoing.once('close', () => {
      if (!outgoing.writableEnded) controller.abort();
    });
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers))
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(',') : value);
      headers.set('x-forwarded-for', incoming.socket.remoteAddress || '127.0.0.1');
      const body = ['GET', 'HEAD'].includes(incoming.method) ? undefined : Readable.toWeb(incoming);
      const request = new Request(
        `http://127.0.0.1:${incoming.socket.localPort || port}${incoming.url}`,
        {
          method: incoming.method,
          headers,
          body,
          signal: controller.signal,
          ...(body ? { duplex: 'half' } : {}),
        },
      );
      const response = await handle(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body)
        Readable.fromWeb(response.body)
          .on('error', () => outgoing.destroy())
          .pipe(outgoing);
      else outgoing.end();
    } catch {
      if (!outgoing.headersSent)
        outgoing.writeHead(500, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
      outgoing.end(
        JSON.stringify({
          error: { code: 'server_error', message: 'No se pudo procesar la consulta.' },
        }),
      );
    }
  });
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error('PORT debe ser un puerto válido.');
  const server = createDevServer({ port });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `El puerto ${port} ya está ocupado. Esta nueva instancia de TeslaCode no se inició.`,
      );
      console.error(
        'Detén el servidor anterior con Ctrl+C en su terminal y vuelve a ejecutar npm start.',
      );
      console.error(
        `Si ya tienes TeslaCode abierto, comprueba http://127.0.0.1:${port}/api/tutor.`,
      );
      console.error(
        `Para usar otro puerto en PowerShell: $env:PORT=${port < 65535 ? port + 1 : 3000}; npm start`,
      );
    } else {
      console.error('No se pudo iniciar TeslaCode. Código: ' + (error.code || 'desconocido'));
    }
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`TeslaCode: http://127.0.0.1:${port} · tutor con clave solo en el servidor`);
    console.log('Mantén esta terminal abierta. Para detener el servidor: Ctrl+C.');
    if (!tutorReady(process.env))
      console.log(
        'El tutor necesita configuración local. Guarda .env.local y revisa npm run tutor:doctor.',
      );
  });
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => server.close(() => process.exit(0)));
}
