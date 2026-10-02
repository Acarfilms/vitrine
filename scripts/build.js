// Bundles the action into dist/ so it runs on the runner's own Node with nothing to install.
// CI fails if dist/ is out of date, so run this after changing anything in src/.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const path = (relative) => fileURLToPath(new URL(`../${relative}`, import.meta.url));

await build({
  entryPoints: [path('src/action.js')],
  outfile: path('dist/index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node24',
  legalComments: 'none',
  // yaml ships CommonJS for Node; give its require() calls something to resolve against.
  banner: { js: "import { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);" },
  logLevel: 'info',
});

// The bundle leaves out the dependencies' license files, so collect them next to it.
const notices = [
  ['Inter', 'src/assets/Inter-OFL.txt'],
  ['Simple Icons', 'node_modules/simple-icons/LICENSE.md'],
  ['yaml', 'node_modules/yaml/LICENSE'],
];
const sections = await Promise.all(notices.map(async ([name, file]) => {
  const license = await readFile(path(file), 'utf8');
  return `${name}\n${'-'.repeat(name.length)}\n\n${license.trim()}\n`;
}));
await writeFile(path('dist/licenses.txt'), sections.join('\n\n'));
