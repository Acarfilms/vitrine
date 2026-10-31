import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const path = (relative) => fileURLToPath(new URL(`../${relative}`, import.meta.url));

const emptyNodeFsPlugin = {
  name: 'empty-node-fs',
  setup(build) {
    build.onResolve({ filter: /^node:fs(\/promises)?$/ }, (args) => ({
      path: args.path,
      namespace: 'empty-fs',
    }));
    build.onLoad({ filter: /.*/, namespace: 'empty-fs' }, () => ({
      contents: 'export async function readFile() { throw new Error("readFile is not supported in browser"); }',
      loader: 'js',
    }));
  },
};

await build({
  entryPoints: [path('src/playground.js')],
  outfile: path('docs/playground.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2022'],
  plugins: [emptyNodeFsPlugin],
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
});

console.log('Playground built successfully: docs/playground.js');
