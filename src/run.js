import { appendFile, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { loadConfig } from './config.js';
import { fetchCalendar, summarize } from './github.js';
import { CARD_FILE, renderCards } from './render/index.js';
import { snippet } from './snippet.js';

// Shared by the CLI and the GitHub Action: render the cards, clear out the ones the config
// no longer produces, and return the README markup.
export async function run({ config: configPath, out, readme, token, owner, warn = console.warn }) {
  const config = await loadConfig(configPath);
  const stats = config.activity ? await contributions(config, { token, owner, warn }) : null;
  const cards = renderCards(config, { stats });

  await mkdir(out, { recursive: true });
  await Promise.all(cards.map(({ file, svg }) => writeFile(join(out, file), svg)));

  // An activity card that was skipped for lack of a token is still wanted, so keep the old one.
  const keep = (file) => cards.some((card) => card.file === file) || (config.activity && !stats && file.startsWith('activity-'));
  const removed = (await readdir(out)).filter((file) => CARD_FILE.test(file) && !keep(file));
  await Promise.all(removed.map((file) => rm(join(out, file))));

  const folder = relative(dirname(resolve(readme)), resolve(out)) || '.';
  const markup = snippet(config, folder, { activity: Boolean(stats) });

  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = `### Vitrine\n\nWrote ${cards.length} files. Paste this into your README once:\n\n\`\`\`html\n${markup}\`\`\`\n`;
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  }

  return { cards, removed, markup };
}

async function contributions(config, { token, owner, warn }) {
  const login = config.login ?? owner;
  if (!token || !login) {
    warn('Skipping the activity card: it needs a token, and "login" in the config outside GitHub Actions.');
    return null;
  }
  return summarize(await fetchCalendar(login, token));
}
