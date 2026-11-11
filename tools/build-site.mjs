import { cpSync, mkdirSync, rmSync, existsSync, lstatSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

// A public allowlist keeps secrets, backend code, tests and local skills out of hosting.
export const PUBLIC_FILES = ['index.html', 'js', 'css', 'content', 'assets'];
function checkPublicPath(path) {
  const info = lstatSync(path);
  if (info.isSymbolicLink())
    throw Error('Los recursos públicos no deben enlazar archivos fuera del paquete.');
  if (info.isDirectory()) for (const name of readdirSync(path)) checkPublicPath(join(path, name));
}
export function buildSite(root = '.') {
  const workspace = resolve(root),
    output = join(workspace, 'dist');
  if (
    output !== resolve(workspace, 'dist') ||
    (existsSync(output) && lstatSync(output).isSymbolicLink())
  )
    throw Error('El destino público no es una carpeta segura del proyecto.');
  for (const path of PUBLIC_FILES) checkPublicPath(join(workspace, path));
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
  for (const path of PUBLIC_FILES)
    cpSync(join(workspace, path), join(output, path), { recursive: true, dereference: false });
  console.log('✓ Sitio público preparado en dist/; claves y servidor quedan fuera de la descarga.');
  return output;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  buildSite();
