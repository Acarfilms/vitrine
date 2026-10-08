// Renders the images used by README.md into docs/. Set GITHUB_TOKEN to include the activity and featured cards.
//
//   GITHUB_TOKEN=$(gh auth token) npm run docs

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { loadConfig, normalize } from '../src/config.js';
import { fetchCalendar, fetchRepository, summarize } from '../src/github.js';
import { glass, glassDefs, ON_GLASS } from '../src/render/glass.js';
import { icon, SYMBOL_NAMES } from '../src/render/icons.js';
import { renderCards } from '../src/render/index.js';
import { CARD_WIDTH } from '../src/render/section.js';
import { document, measure, round, text } from '../src/render/svg.js';
import { MODE_NAMES, theme } from '../src/render/theme.js';
import { wallpaper, WALLPAPERS, WALLPAPER_HEIGHT, WALLPAPER_WIDTH } from '../src/render/wallpaper.js';

const DOCS = new URL('../docs/', import.meta.url);

const banner = normalize({
  wallpaper: 'tide',
  hero: {
    name: 'Vitrine',
    role: 'For GitHub profile READMEs',
    tagline: 'Liquid Glass cards, rendered in your own repository.',
    widgets: [
      { icon: 'layers', label: 'Cards', value: 'Hero, bento, specs' },
      { icon: 'appearance', label: 'Themes', value: 'Light and dark' },
      { icon: 'terminal', label: 'Runs on', value: 'GitHub Actions' },
    ],
  },
});

// A small crop of a wallpaper with one glass pill on it, to compare presets side by side.
function swatch(name) {
  const width = 272;
  const height = 160;
  const scale = height / WALLPAPER_HEIGHT;
  const view = `matrix(${round(scale)} 0 0 ${round(scale)} ${round(-(WALLPAPER_WIDTH * scale - width) / 2)} 0)`;
  const wall = wallpaper(name);
  const pillWidth = measure(name, 'text-600', 15) + 44;
  const pill = { x: (width - pillWidth) / 2, y: height - 62, width: pillWidth, height: 36, radius: 18 };

  return document(width, height, `
<defs>
${wall.defs}
${glassDefs(wall.shade)}
${wall.body}
<clipPath id="frame"><rect width="${width}" height="${height}" rx="22"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<use href="#wall" xlink:href="#wall" transform="${view}"/>
${glass('pill', pill, { shade: wall.shade, view })}
${text(name, { font: 'text-600', size: 15, x: width / 2, y: pill.y + 23, anchor: 'middle', fill: ON_GLASS, filter: 'lift' })}
</g>`);
}

// Every built-in symbol with its name, for the README.
function symbolSheet(colors) {
  const cell = CARD_WIDTH / SYMBOL_NAMES.length;
  const cells = SYMBOL_NAMES.map((name, i) => {
    const middle = i * cell + cell / 2;
    return [
      icon(name, { x: middle - 12, y: 26, color: colors.label }),
      text(name, { font: 'text-500', size: 12, x: middle, y: 80, anchor: 'middle', fill: colors.secondary }),
    ].join('\n');
  });
  return document(CARD_WIDTH, 104, `<rect width="${CARD_WIDTH}" height="104" rx="22" fill="${colors.surface}"/>\n${cells.join('\n')}`);
}

async function save(path, svg) {
  const url = new URL(path, DOCS);
  await mkdir(new URL('.', url), { recursive: true });
  await writeFile(url, svg);
  console.log(`docs/${path}`);
}

const [hero] = renderCards(banner);
await save('banner.svg', hero.svg);

for (const name of Object.keys(WALLPAPERS)) await save(`wallpapers/${name}.svg`, swatch(name));
for (const mode of MODE_NAMES) await save(`symbols-${mode}.svg`, symbolSheet(theme(mode, 'blue')));

const example = await loadConfig(new URL('../examples/vitrine.yml', import.meta.url));
const token = process.env.GITHUB_TOKEN;
const stats = token ? summarize(await fetchCalendar(example.login, token)) : null;
const repo = token && example.featured ? await fetchRepository(example.featured.repo, token) : null;
if (!token) console.warn('GITHUB_TOKEN is not set, so the example has no activity or featured card.');

await rm(new URL('example/', DOCS), { recursive: true, force: true });
for (const card of renderCards(example, { stats, repo })) await save(`example/${card.file}`, card.svg);
