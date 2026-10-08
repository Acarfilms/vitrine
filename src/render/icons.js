import * as simpleIcons from 'simple-icons';
import { round } from './svg.js';

const BRANDS = new Map(Object.values(simpleIcons).map((icon) => [icon.slug, icon]));

// Simple Icons dropped LinkedIn at the company's request, but it is still the link most profiles need.
const RETIRED = [
  { slug: 'linkedin', title: 'LinkedIn', hex: '0A66C2', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
];
for (const brand of RETIRED) if (!BRANDS.has(brand.slug)) BRANDS.set(brand.slug, brand);

// Line symbols on a 24px grid, in the style of SF Symbols.
const SYMBOLS = {
  location: (c) => `<path d="M19.6 4.4 4.6 10.6c-.7.3-.6 1.3.1 1.5l6 1.5 1.5 6c.2.7 1.2.8 1.5.1l6.2-15c.2-.4-.2-.8-.3-.3z" fill="${c}"/>`,
  briefcase: (c) => stroke(c, '<rect x="3.2" y="7.2" width="17.6" height="12.6" rx="2.6"/><path d="M8.8 7.2V5.9c0-1 .8-1.7 1.7-1.7h3c1 0 1.7.8 1.7 1.7v1.3M3.2 12.6h17.6"/>'),
  building: (c) => stroke(c, '<rect x="5" y="3.5" width="14" height="17" rx="2.2"/><path d="M9 7.6h1.6M13.4 7.6H15M9 11.2h1.6M13.4 11.2H15M9 14.8h1.6M13.4 14.8H15M10.6 20.5v-2.8h2.8v2.8"/>'),
  code: (c) => stroke(c, '<path d="M8 7.5 3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.4 5.5l-2.8 13"/>'),
  terminal: (c) => stroke(c, '<rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="m7.4 9.4 2.8 2.6-2.8 2.6M12.6 14.8h4"/>'),
  globe: (c) => stroke(c, '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.1 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.1-3.5-8.5s1.2-6.2 3.5-8.5z"/>'),
  layers: (c) => stroke(c, '<path d="m12 3.8 8.4 4.4L12 12.6 3.6 8.2z"/><path d="m3.6 12 8.4 4.4 8.4-4.4M3.6 15.8l8.4 4.4 8.4-4.4"/>'),
  calendar: (c) => stroke(c, '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 9.8h17M8 3v4M16 3v4"/>'),
  appearance: (c) => `${stroke(c, '<circle cx="12" cy="12" r="8.5"/>')}<path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="${c}"/>`,
  book: (c) => stroke(c, '<path d="M12 6.6C10.2 5.2 7.4 4.6 4 4.8v13.1c3.4-.2 6.2.4 8 1.8 1.8-1.4 4.6-2 8-1.8V4.8c-3.4-.2-6.2.4-8 1.8zM12 6.6v13.1"/>'),
  mail: (c) => stroke(c, '<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="m4.5 7 7.5 5.5L19.5 7"/>'),
};

export function stroke(color, shapes) {
  return `<g stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>`;
}

export const SYMBOL_NAMES = Object.keys(SYMBOLS);
export const isSymbol = (name) => Object.hasOwn(SYMBOLS, name);
export const isBrand = (slug) => BRANDS.has(slug);
export const brandTitle = (slug) => BRANDS.get(slug).title;

// Slugs are not always guessable ("nextdotjs" for Next.js), so match on the brand's title instead.
export function suggestBrands(name) {
  const plain = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const wanted = plain(name);
  if (!wanted) return [];
  return [...BRANDS.values()]
    .filter((brand) => plain(brand.title).startsWith(wanted))
    .sort((a, b) => a.title.length - b.title.length)
    .slice(0, 3)
    .map((brand) => brand.slug);
}

// Draws a symbol or brand logo at (x, y), scaled from the 24px grid to `size`.
export function icon(name, { x, y, size = 24, color }) {
  const scale = size / 24;
  const placement = `translate(${round(x)} ${round(y)}) scale(${round(scale)})`;
  if (isSymbol(name)) return `<g transform="${placement}">${SYMBOLS[name](color)}</g>`;
  return `<path transform="${placement}" d="${BRANDS.get(name).path}" fill="${color}"/>`;
}

// Brand colors are picked for white pages, so some vanish on a dark tile (or a yellow one on white).
// Black-and-white marks like Next.js or Notion take the text color. The rest step toward
// black or white until they clear a contrast of 3:1 against the tile.
export function brandColor(slug, theme) {
  let color = `#${BRANDS.get(slug).hex}`;
  if (isMonochrome(color)) return theme.label;

  const target = theme.mode === 'light' ? '#000000' : '#FFFFFF';
  for (let step = 0; step < 10 && contrast(color, theme.tile) < 3; step++) {
    color = mix(color, target, 0.2);
  }
  return color;
}

function isMonochrome(hex) {
  const values = channels(hex);
  return Math.max(...values) - Math.min(...values) < 24;
}

function channels(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

function mix(a, b, amount) {
  const [from, to] = [channels(a), channels(b)];
  const mixed = from.map((value, i) => Math.round(value + (to[i] - value) * amount));
  return `#${mixed.map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}
