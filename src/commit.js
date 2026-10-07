import { execFileSync, spawnSync } from 'node:child_process';

const IDENTITY = [
  '-c', 'user.name=github-actions[bot]',
  '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
  '-c', 'commit.gpgsign=false',
];

// Commits the cards in `folder` and pushes them. If the branch moved while the cards were
// rendering, the push is rejected: the commit is then rebuilt on top of the new commits and
// pushed again. Only the card folder is ever staged, so this can't undo anyone else's changes.
export function commit(folder, message, { cwd, attempts = 3, log = console.log } = {}) {
  const git = (...args) => execFileSync('git', args, { cwd, stdio: ['ignore', 'ignore', 'inherit'] });
  const staged = () => spawnSync('git', ['diff', '--cached', '--quiet'], { cwd }).status !== 0;

  for (let attempt = 1; ; attempt++) {
    git('add', '--all', '--', folder);
    if (!staged()) {
      log('Cards are up to date.');
      return;
    }
    git(...IDENTITY, 'commit', '--quiet', '--message', message);

    const push = spawnSync('git', ['push', '--quiet'], { cwd, encoding: 'utf8' });
    if (push.status === 0) return;
    if (attempt === attempts) throw new Error(`Could not push the cards after ${attempts} attempts.\n${push.stderr.trim()}`);

    // Start again from the branch as it is now. The worktree keeps the new cards,
    // so staging the folder again puts them on top of whatever arrived meanwhile.
    log('The branch moved while the cards were rendering. Trying again on top of it.');
    git('fetch', '--quiet');
    git('reset', '--quiet', '@{upstream}');
  }
}
