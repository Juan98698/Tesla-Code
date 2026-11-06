// Solo informa: nunca firma ni actualiza revisiones automáticamente.
import { readFileSync } from 'node:fs';
import { digest, lessonDigest } from './pedagogy.mjs';
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const registry = read('content/concepts.json').concepts;
const requested = process.argv[2];
for (const rid of read('content/curriculum/index.json').routes) {
  const route = read(`content/curriculum/${rid}.json`);
  if (!requested || requested === rid) console.log(`route:${rid} ${digest(route)}`);
  for (const meta of route.levels.flatMap((level) => level.lessons)) {
    const key = `${rid}/${meta.id}`;
    if (meta.status === 'published' && (!requested || requested === key))
      console.log(
        `lesson:${key} ${lessonDigest(meta, read(`content/lessons/${key}.json`), registry)}`,
      );
  }
}
