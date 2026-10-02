import { execFileSync, spawnSync } from 'node:child_process';
import { ConfigError } from './config.js';
import { run } from './run.js';

// The runner passes each input as INPUT_<NAME>, with the defaults from action.yml already filled in.
const input = (name) => (process.env[`INPUT_${name.toUpperCase()}`] ?? '').trim();

async function main() {
  const out = input('output');
  const { cards, removed } = await run({
    config: input('config'),
    out,
    readme: input('readme'),
    token: input('token'),
    owner: process.env.GITHUB_REPOSITORY_OWNER,
    warn: (message) => console.log(`::warning::${command(message)}`),
  });

  console.log(`Wrote ${cards.length} files to ${out}.`);
  if (removed.length) console.log(`Removed cards the config no longer makes: ${removed.join(', ')}.`);
  if (input('commit') === 'true') commit(out, input('commit-message'));
}

function commit(folder, message) {
  const git = (...args) => execFileSync('git', args, { stdio: 'inherit' });

  git('add', '--all', '--', folder);
  if (spawnSync('git', ['diff', '--cached', '--quiet']).status === 0) {
    console.log('Cards are up to date.');
    return;
  }
  git(
    '-c', 'user.name=github-actions[bot]',
    '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
    'commit', '--quiet', '--message', message,
  );
  git('push', '--quiet');
}

// Workflow commands end at a newline, so multi-line messages have to be escaped.
const command = (message) => message.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

main().catch((error) => {
  console.log(`::error::${command(error instanceof ConfigError ? error.message : error.stack)}`);
  process.exitCode = 1;
});
