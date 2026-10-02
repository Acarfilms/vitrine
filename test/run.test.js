import assert from 'node:assert/strict';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { run } from '../src/run.js';

async function workspace(config) {
  const dir = await mkdtemp(join(tmpdir(), 'vitrine-'));
  await writeFile(join(dir, 'vitrine.yml'), config);
  return dir;
}

const quiet = () => {};

test('removes cards the config no longer makes and leaves other files alone', async () => {
  const dir = await workspace('hero:\n  name: Ada\n');
  const out = join(dir, 'cards');
  await run({ config: join(dir, 'vitrine.yml'), out, readme: join(dir, 'README.md'), warn: quiet });
  await writeFile(join(out, 'link-old.svg'), '<svg/>');
  await writeFile(join(out, 'notes.svg'), '<svg/>');

  const { removed } = await run({ config: join(dir, 'vitrine.yml'), out, readme: join(dir, 'README.md'), warn: quiet });
  assert.deepEqual(removed, ['link-old.svg']);
  assert.deepEqual((await readdir(out)).sort(), ['hero.svg', 'notes.svg']);
});

test('keeps the last activity card when it was skipped for lack of a token', async () => {
  const dir = await workspace('activity: true\n');
  const out = join(dir, 'cards');
  await run({ config: join(dir, 'vitrine.yml'), out, readme: join(dir, 'README.md'), warn: quiet });
  await writeFile(join(out, 'activity-dark.svg'), '<svg/>');

  const { removed } = await run({ config: join(dir, 'vitrine.yml'), out, readme: join(dir, 'README.md'), warn: quiet });
  assert.deepEqual(removed, []);
});

test('image paths in the markup are relative to the README', async () => {
  const dir = await workspace('hero:\n  name: Ada\n');
  const { markup } = await run({
    config: join(dir, 'vitrine.yml'),
    out: join(dir, 'profile', 'cards'),
    readme: join(dir, 'profile', 'README.md'),
    warn: quiet,
  });
  assert.match(markup, /<img src="cards\/hero.svg"/);
});
