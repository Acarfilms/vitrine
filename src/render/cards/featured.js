import { formatNumber } from '../../language.js';
import { stroke } from '../icons.js';
import { CARD_WIDTH, CONTENT_TOP, section, surface } from '../section.js';
import { escape, fit, measure, round, text, wrap } from '../svg.js';

const INSET = 36;
const NAME_SIZE = 28;
const NAME_TRACKING = -0.6;
const DESCRIPTION_SIZE = 17;
const DESCRIPTION_LINES = 2;
const LINE_HEIGHT = 25;
const META_SIZE = 15;

// Line glyphs on the same 24px grid as the built-in symbols, drawn after GitHub's own.
const GLYPHS = {
  repo: (c) => stroke(c, '<path d="M5.5 18.5V5.6c0-1.2.9-2.1 2.1-2.1h10.9v13H7.6c-1.2 0-2.1.9-2.1 2.1s.9 2.1 2.1 2.1h10.9"/><path d="M9.5 16.5v4.5l1.75-1.2L13 21v-4.5"/>'),
  star: (c) => stroke(c, '<path d="m12 3.8 2.5 5.1 5.6.8-4.05 3.95.95 5.6L12 16.6l-5 2.65.95-5.6L3.9 9.7l5.6-.8z"/>'),
  fork: (c) => stroke(c, '<circle cx="6.5" cy="5.5" r="2"/><circle cx="17.5" cy="5.5" r="2"/><circle cx="12" cy="18.5" r="2"/><path d="M6.5 7.5v1.2c0 1.5 1.2 2.8 2.8 2.8h5.4c1.5 0 2.8-1.2 2.8-2.8V7.5M12 11.5v5"/>'),
};

const glyph = (name, { x, y, size, color }) =>
  `<g transform="translate(${round(x)} ${round(y)}) scale(${round(size / 24)})">${GLYPHS[name](color)}</g>`;

// One repository, the way GitHub lists it: owner and name, the description, then the
// main language, stars and forks.
export function featured({ title }, repo, theme, language = 'en') {
  const width = CARD_WIDTH - INSET * 2;
  const nameY = CONTENT_TOP + 66;
  const description = describe(repo.description, width);
  const descriptionY = nameY + 40;
  const metaY = (description.length ? descriptionY + (description.length - 1) * LINE_HEIGHT : nameY) + 46;
  const height = metaY - CONTENT_TOP + 36;

  return section(theme, { title }, height, [
    surface(theme, { y: CONTENT_TOP, height }),
    glyph('repo', { x: INSET, y: nameY - 25, size: 30, color: theme.accent }),
    heading(repo.name, theme, INSET + 44, nameY, width - 44),
    ...description.map((line, i) => text(line, { size: DESCRIPTION_SIZE, x: INSET, y: descriptionY + i * LINE_HEIGHT, fill: theme.secondary })),
    meta(repo, theme, metaY, language),
  ].join('\n'));
}

// The owner sits in a quieter color, as on GitHub. If the whole thing doesn't fit,
// the owner goes first and the name is shrunk or cut after that.
function heading(fullName, theme, x, y, maxWidth) {
  const [owner, name] = fullName.split('/');
  const font = 'display-700';
  const attributes = `class="${font}" x="${x}" y="${y}" font-size="${NAME_SIZE}" letter-spacing="${NAME_TRACKING}"`;

  if (measure(`${owner}/${name}`, font, NAME_SIZE, NAME_TRACKING) <= maxWidth) {
    return `<text ${attributes} fill="${theme.label}"><tspan fill="${theme.secondary}">${escape(owner)}/</tspan>${escape(name)}</text>`;
  }
  const shown = fit(name, font, NAME_SIZE, maxWidth, { min: 22, tracking: NAME_TRACKING });
  return text(shown.content, { font, size: shown.size, x, y, tracking: shown.tracking, fill: theme.label });
}

// Up to two lines. If there's more, the second line ends in an ellipsis.
function describe(description, width) {
  if (!description) return [];
  const lines = wrap(description, 'text-400', DESCRIPTION_SIZE, width);
  if (lines.length <= DESCRIPTION_LINES) return lines;
  const rest = lines.slice(DESCRIPTION_LINES - 1).join(' ');
  return [...lines.slice(0, DESCRIPTION_LINES - 1), fit(`${rest}…`, 'text-400', DESCRIPTION_SIZE, width).content];
}

function meta({ language: code, stars, forks }, theme, y, language) {
  const items = [];
  if (code) items.push({ dot: code.color ?? theme.tertiary, label: code.name });
  items.push({ glyph: 'star', label: formatNumber(stars, language) });
  items.push({ glyph: 'fork', label: formatNumber(forks, language) });

  let x = INSET;
  return items.map((item) => {
    const mark = item.dot
      ? `<circle cx="${round(x + 7)}" cy="${round(y - 5)}" r="7" fill="${item.dot}"/>`
      : glyph(item.glyph, { x, y: y - 15, size: 20, color: theme.secondary });
    const label = text(item.label, { font: 'text-500', size: META_SIZE, x: x + 26, y, fill: theme.secondary });
    x += 26 + measure(item.label, 'text-500', META_SIZE) + 30;
    return `${mark}\n${label}`;
  }).join('\n');
}
