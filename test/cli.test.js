import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

for (const flag of ['--version', '-v']) {
  test(`${flag} prints the package version without rendering cards`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vitrine-cli-'));
    try {
      const result = spawnSync(process.execPath, [cli, flag], { cwd: dir, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, `${version}\n`);
      assert.equal(result.stderr, '');
      assert.deepEqual(await readdir(dir), []);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}

test('--help documents both version flags', () => {
  const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /-v, --version\s+Print the version/);
  assert.equal(result.stderr, '');
});
