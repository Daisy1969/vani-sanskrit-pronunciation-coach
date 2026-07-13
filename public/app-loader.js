import * as vocabularyModule from './vocabulary.js';

globalThis.__VANI_VOCABULARY_MODULE__ = vocabularyModule;

const partCount = 7;
const sourceParts = await Promise.all(
  Array.from({ length: partCount }, async (_, index) => {
    const name = `./app-parts/part${String(index).padStart(2, '0')}.txt?v=8.0.1`;
    const response = await fetch(new URL(name, import.meta.url));
    if (!response.ok) throw new Error(`Unable to load ${name}: ${response.status}`);
    return response.text();
  })
);

const moduleUrl = URL.createObjectURL(new Blob([sourceParts.join('')], { type: 'text/javascript' }));
try {
  await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}
