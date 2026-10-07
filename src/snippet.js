import { LANGUAGES } from './language.js';
import { escape } from './render/svg.js';

const sentence = (value) => (/[.!?]$/.test(value) ? value : `${value}.`);

const plain = (copy) => (Array.isArray(copy) ? copy.join(' ') : copy);

// `folder` is the path from the README to the cards. The alt text spells out what each
// image says, because screen readers and search engines can't read text inside an SVG.
export function snippet(config, folder, { activity }) {
  const base = folder.replace(/\\/g, '/').replace(/\/+$/, '');
  const path = (file) => `${base}/${file}`;
  const themed = (name, alt) => [
    '<picture>',
    `  <source media="(prefers-color-scheme: dark)" srcset="${path(`${name}-dark.svg`)}">`,
    `  <img src="${path(`${name}-light.svg`)}" width="100%" alt="${escape(alt)}">`,
    '</picture>',
  ].join('\n');

  const blocks = [];

  if (config.hero) {
    const { name, role, tagline, widgets } = config.hero;
    const alt = [name, role, tagline, ...widgets.map((w) => `${w.label} ${w.value}`)].filter(Boolean).map(sentence).join(' ');
    blocks.push(`<img src="${path('hero.svg')}" width="100%" alt="${escape(alt)}">`);
  }

  if (config.expertise) {
    const { title, tiles } = config.expertise;
    const alt = [title, ...tiles.map((tile) => `${tile.eyebrow}: ${plain(tile.headline)}`)].map(sentence).join(' ');
    blocks.push(themed('expertise', alt));
  }

  if (config.specs) {
    const { title, rows } = config.specs;
    const alt = [title, ...rows.map((row) => `${row.label}: ${row.items.map((item) => item.label).join(', ')}`)].map(sentence).join(' ');
    blocks.push(themed('specs', alt));
  }

  if (config.activity && activity) {
    blocks.push(themed('activity', `${config.activity.title}: ${LANGUAGES[config.language].activity.alt}.`));
  }

  if (config.links.length) {
    const anchors = config.links.map((entry) => `  <a href="${escape(entry.url)}"><img src="${path(entry.file)}" alt="${escape(entry.label)}"></a>`);
    blocks.push(['<p align="center">', ...anchors, '</p>'].join('\n'));
  }

  return `${blocks.join('\n\n')}\n`;
}
