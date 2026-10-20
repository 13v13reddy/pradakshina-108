import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'state.js', 'sw.js', 'manifest.webmanifest', 'assets']) {
  await cp(path.join(root, file), path.join(dist, file), { recursive: true });
}
await writeFile(path.join(dist, '.nojekyll'), '');
console.log('Built static app in dist/ (no dependencies).');
