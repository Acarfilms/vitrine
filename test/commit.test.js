import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { commit } from '../src/commit.js';

// Keep the developer's own git config (signing, hooks) out of the way.
process.env.GIT_CONFIG_GLOBAL = '/dev/null';
process.env.GIT_CONFIG_NOSYSTEM = '1';

const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=Ada', '-c', 'user.email=ada@example.com', ...args], { cwd, encoding: 'utf8' }).trim();

// A remote with one commit, and two clones of it: the runner, and someone else who pushes meanwhile.
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'vitrine-commit-'));
  const remote = join(root, 'remote.git');
  git(root, 'init', '--quiet', '--bare', '--initial-branch=main', remote);

  const seed = join(root, 'seed');
  git(root, 'clone', '--quiet', remote, seed);
  await writeFile(join(seed, 'README.md'), 'Hello\n');
  git(seed, 'add', '.');
  git(seed, 'commit', '--quiet', '-m', 'Start');
  git(seed, 'push', '--quiet', 'origin', 'HEAD:main');

  const clone = async (name) => {
    const dir = join(root, name);
    git(root, 'clone', '--quiet', remote, dir);
    return dir;
  };
  return { remote, runner: await clone('runner'), other: await clone('other') };
}

const writeCard = async (dir, content) => {
  await mkdir(join(dir, 'vitrine'), { recursive: true });
  await writeFile(join(dir, 'vitrine', 'hero.svg'), content);
};

const remoteFile = (remote, path) => git(remote, 'show', `main:${path}`);
const quiet = { log: () => {} };

test('commits and pushes the cards', async () => {
  const { remote, runner } = await setup();
  await writeCard(runner, '<svg>new</svg>');
  commit('vitrine', 'Update profile cards', { cwd: runner, ...quiet });
  assert.equal(remoteFile(remote, 'vitrine/hero.svg'), '<svg>new</svg>');
});

test('does nothing when the cards have not changed', async () => {
  const { remote, runner } = await setup();
  await writeCard(runner, '<svg>new</svg>');
  commit('vitrine', 'Update profile cards', { cwd: runner, ...quiet });

  const messages = [];
  commit('vitrine', 'Update profile cards', { cwd: runner, log: (m) => messages.push(m) });
  assert.deepEqual(messages, ['Cards are up to date.']);
  assert.equal(git(remote, 'rev-list', '--count', 'main'), '2');
});

test('tries again on top of commits that arrived while rendering', async () => {
  const { remote, runner, other } = await setup();
  await writeFile(join(other, 'README.md'), 'Edited meanwhile\n');
  git(other, 'commit', '--quiet', '-am', 'Edit the README');
  git(other, 'push', '--quiet');

  await writeCard(runner, '<svg>new</svg>');
  commit('vitrine', 'Update profile cards', { cwd: runner, ...quiet });

  assert.equal(remoteFile(remote, 'vitrine/hero.svg'), '<svg>new</svg>');
  assert.equal(remoteFile(remote, 'README.md'), 'Edited meanwhile', 'the other change is kept');
  assert.equal(git(remote, 'log', '-1', '--format=%s', 'main'), 'Update profile cards');
});

test('finishes as up to date when another run already pushed the same cards', async () => {
  // Real runs differ in commit time. Here they can land in the same second, so the other
  // run's commit gets its own message to keep the two commits apart.
  const { remote, runner, other } = await setup();
  await writeCard(other, '<svg>new</svg>');
  commit('vitrine', 'Update profile cards (other run)', { cwd: other, ...quiet });

  await writeCard(runner, '<svg>new</svg>');
  const messages = [];
  commit('vitrine', 'Update profile cards', { cwd: runner, log: (m) => messages.push(m) });

  assert.equal(messages.at(-1), 'Cards are up to date.');
  assert.equal(git(remote, 'rev-list', '--count', 'main'), '2');
});

test('the freshest cards win over ones another run pushed', async () => {
  const { remote, runner, other } = await setup();
  await writeCard(other, '<svg>older</svg>');
  commit('vitrine', 'Update profile cards', { cwd: other, ...quiet });

  await writeCard(runner, '<svg>newer</svg>');
  commit('vitrine', 'Update profile cards', { cwd: runner, ...quiet });

  assert.equal(remoteFile(remote, 'vitrine/hero.svg'), '<svg>newer</svg>');
  assert.equal(await readFile(join(runner, 'README.md'), 'utf8'), 'Hello\n');
});
