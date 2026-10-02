import { activity } from './cards/activity.js';
import { expertise } from './cards/expertise.js';
import { hero } from './cards/hero.js';
import { link } from './cards/link.js';
import { specs } from './cards/specs.js';
import { MODE_NAMES, theme } from './theme.js';

// Every file name Vitrine can write, so stale cards can be told apart from the user's own files.
export const CARD_FILE = /^(hero|(expertise|specs|activity)-(light|dark)|link-[a-z0-9-]+)\.svg$/;

// The hero and the link buttons carry their own wallpaper, so one file serves both themes.
// Everything else is rendered twice and swapped with <picture> in the README.
export function renderCards(config, { stats = null } = {}) {
  const cards = [];
  if (config.hero) cards.push({ file: 'hero.svg', svg: hero(config.hero, config) });

  for (const mode of MODE_NAMES) {
    const colors = theme(mode, config.accent);
    if (config.expertise) cards.push({ file: `expertise-${mode}.svg`, svg: expertise(config.expertise, colors) });
    if (config.specs) cards.push({ file: `specs-${mode}.svg`, svg: specs(config.specs, colors) });
    if (config.activity && stats) cards.push({ file: `activity-${mode}.svg`, svg: activity(config.activity, stats, colors) });
  }

  config.links.forEach((entry, i) => cards.push({ file: entry.file, svg: link(entry, i, config) }));
  return cards;
}
