import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { indexRoute, includeArchives, isPublished } from '../js/domain/curriculum.js';

export function tutorKnowledge(root = '.') {
  const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  const routes = includeArchives(
    read('content/curriculum/index.json').routes.map((id) =>
      indexRoute(read(`content/curriculum/${id}.json`)),
    ),
  );
  const lessons = routes.flatMap((route) =>
    route.lessons.filter(isPublished).map((meta) => {
      const lesson = read(`content/lessons/${route.id}/${meta.id}.json`);
      const dom = new JSDOM(`<body>${lesson.html}</body>`);
      dom.window.document
        .querySelectorAll('script,style,iframe,form,input,button')
        .forEach((node) => node.remove());
      dom.window.document
        .querySelectorAll('p,h2,h3,li,pre,section,br')
        .forEach((node) => node.append('\n'));
      const explanation = dom.window.document.body.textContent
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()
        .slice(0, 18000);
      dom.window.close();
      return {
        key: `${route.id}/${meta.id}`,
        route: route.id,
        routeName: route.name,
        id: meta.id,
        title: meta.title,
        outcome: lesson.outcome,
        archived: Boolean(route.archivedEdition),
        concepts: meta.concepts,
        text: explanation,
      };
    }),
  );
  const serialized = JSON.stringify(lessons);
  return { revision: createHash('sha256').update(serialized).digest('hex').slice(0, 16), lessons };
}
export function buildTutorKnowledge(root = '.', check = false) {
  const output = resolve(root, 'server/tutor/knowledge-data.json');
  const bytes = JSON.stringify(tutorKnowledge(root)) + '\n';
  if (check) {
    if (readFileSync(output, 'utf8').replaceAll('\r\n', '\n') !== bytes)
      throw Error('El contexto del tutor está desactualizado. Ejecuta npm run tutor:knowledge.');
  } else {
    mkdirSync(resolve(root, 'server/tutor'), { recursive: true });
    writeFileSync(output, bytes);
  }
  console.log(
    `✓ Contexto docente del tutor ${check ? 'verificado' : 'generado'}; sin evaluaciones ni soluciones de actividades.`,
  );
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  buildTutorKnowledge('.', process.argv.includes('--check'));
