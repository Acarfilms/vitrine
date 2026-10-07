import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { arrange } from './render/cards/expertise.js';
import { brandTitle, isBrand, isSymbol, suggestBrands, SYMBOL_NAMES } from './render/icons.js';
import { LANGUAGES } from './language.js';
import { ACCENTS } from './render/theme.js';
import { WALLPAPERS } from './render/wallpaper.js';

export class ConfigError extends Error {}

export async function loadConfig(path) {
  let source;
  try {
    source = await readFile(path, 'utf8');
  } catch {
    throw new ConfigError(`Could not read ${path}. Check the path to your config file.`);
  }

  let raw;
  try {
    raw = parse(source);
  } catch (error) {
    throw new ConfigError(`${path} is not valid YAML. ${error.message}`);
  }
  return normalize(raw ?? {}, path);
}

// Turns the YAML into a fully specified config, or throws a ConfigError that names the
// exact field at fault, e.g. "vitrine.yml: specs.rows[1].items[0] ...".
export function normalize(raw, file = 'vitrine.yml') {
  const check = checker(file);

  check.object(raw, 'The file');
  check.keys(raw, ['login', 'language', 'wallpaper', 'accent', 'hero', 'expertise', 'specs', 'activity', 'links'], 'The file');

  const language = check.oneOf(raw.language ?? 'en', Object.keys(LANGUAGES), 'language');
  const { titles } = LANGUAGES[language];

  const config = {
    login: check.optionalString(raw.login, 'login'),
    language,
    wallpaper: check.oneOf(raw.wallpaper ?? 'tide', Object.keys(WALLPAPERS), 'wallpaper'),
    accent: check.oneOf(raw.accent ?? 'blue', Object.keys(ACCENTS), 'accent'),
    hero: raw.hero === undefined ? null : hero(raw.hero, check),
    expertise: raw.expertise === undefined ? null : expertise(raw.expertise, check, titles),
    specs: raw.specs === undefined ? null : specs(raw.specs, check, titles),
    activity: activity(raw.activity, check, titles),
    links: links(raw.links ?? [], check),
  };

  const sections = [config.hero, config.expertise, config.specs, config.activity, config.links.length];
  if (!sections.some(Boolean)) {
    check.fail('The file', 'has nothing to render. Add at least one of hero, expertise, specs, activity or links.');
  }
  return config;
}

function hero(raw, check) {
  check.object(raw, 'hero');
  check.keys(raw, ['name', 'role', 'tagline', 'widgets'], 'hero');
  const widgets = check.list(raw.widgets ?? [], 'hero.widgets', { max: 3 });
  return {
    name: check.string(raw.name, 'hero.name'),
    role: check.optionalString(raw.role, 'hero.role'),
    tagline: check.optionalString(raw.tagline, 'hero.tagline'),
    widgets: widgets.map((widget, i) => {
      const at = `hero.widgets[${i}]`;
      check.object(widget, at);
      check.keys(widget, ['icon', 'label', 'value'], at);
      return {
        icon: check.icon(widget.icon, `${at}.icon`, { symbols: true }),
        label: check.string(widget.label, `${at}.label`),
        value: check.string(widget.value, `${at}.value`),
      };
    }),
  };
}

function expertise(raw, check, titles) {
  check.object(raw, 'expertise');
  check.keys(raw, ['title', 'tiles'], 'expertise');
  const tiles = check.list(raw.tiles, 'expertise.tiles', { min: 1, max: 7 }).map((tile, i) => {
    const at = `expertise.tiles[${i}]`;
    check.object(tile, at);
    check.keys(tile, ['eyebrow', 'headline', 'body', 'icons', 'wide'], at);
    const icons = check.list(tile.icons ?? [], `${at}.icons`, { max: 6 });
    return {
      eyebrow: check.string(tile.eyebrow, `${at}.eyebrow`),
      headline: check.copy(tile.headline, `${at}.headline`),
      body: tile.body === undefined ? null : check.copy(tile.body, `${at}.body`),
      icons: icons.map((slug, j) => check.icon(slug, `${at}.icons[${j}]`)),
      wide: tile.wide === undefined ? null : check.boolean(tile.wide, `${at}.wide`),
    };
  });

  // Tiles that end up side by side only have room for three icons in their corner.
  for (const row of arrange(tiles)) {
    if (row.length === 1) continue;
    for (const tile of row) {
      if (tile.icons.length > 3) {
        check.fail(`expertise.tiles[${tiles.indexOf(tile)}].icons`, `can hold at most 3 entries next to another tile, got ${tile.icons.length}. Set wide: true to give it a row of its own.`);
      }
    }
  }

  return { title: check.optionalString(raw.title, 'expertise.title') ?? titles.expertise, tiles };
}

function specs(raw, check, titles) {
  check.object(raw, 'specs');
  check.keys(raw, ['title', 'rows'], 'specs');
  const rows = check.list(raw.rows, 'specs.rows', { min: 1 });
  return {
    title: check.optionalString(raw.title, 'specs.title') ?? titles.specs,
    rows: rows.map((row, i) => {
      const at = `specs.rows[${i}]`;
      check.object(row, at);
      check.keys(row, ['label', 'items'], at);
      const items = check.list(row.items, `${at}.items`, { min: 1, max: 4 });
      return {
        label: check.string(row.label, `${at}.label`),
        items: items.map((item, j) => specItem(item, `${at}.items[${j}]`, check)),
      };
    }),
  };
}

// An item is a Simple Icons slug, or { icon, label } to rename it ("React Native" with the React mark).
function specItem(item, at, check) {
  if (typeof item === 'string') {
    const slug = check.icon(item, at);
    return { icon: slug, label: brandTitle(slug) };
  }
  check.object(item, at);
  check.keys(item, ['icon', 'label'], at);
  const slug = check.icon(item.icon, `${at}.icon`);
  return { icon: slug, label: check.optionalString(item.label, `${at}.label`) ?? brandTitle(slug) };
}

function activity(raw, check, titles) {
  if (raw === undefined || raw === false) return null;
  if (raw === true) return { title: titles.activity };
  check.object(raw, 'activity');
  check.keys(raw, ['title'], 'activity');
  return { title: check.optionalString(raw.title, 'activity.title') ?? titles.activity };
}

const MAX_LINK_LABEL = 24;

function links(raw, check) {
  const files = new Set();
  return check.list(raw, 'links', { max: 6 }).map((entry, i) => {
    const at = `links[${i}]`;
    check.object(entry, at);
    check.keys(entry, ['icon', 'label', 'url'], at);

    const url = check.string(entry.url, `${at}.url`);
    if (!/^(https?:\/\/|mailto:)/.test(url)) check.fail(`${at}.url`, `should start with http://, https:// or mailto:, got "${url}".`);

    const label = check.string(entry.label, `${at}.label`);
    if (label.length > MAX_LINK_LABEL) check.fail(`${at}.label`, `is ${label.length} characters long; buttons fit ${MAX_LINK_LABEL}.`);

    // The label names the button's file, so two labels that slug the same would overwrite each other.
    const file = `link-${slugify(label) || i + 1}.svg`;
    if (files.has(file)) check.fail(`${at}.label`, `"${label}" is too close to another link's label; both would be saved as ${file}.`);
    files.add(file);

    return { icon: check.icon(entry.icon, `${at}.icon`, { symbols: true }), label, url, file };
  });
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function checker(file) {
  const fail = (at, message) => {
    throw new ConfigError(`${file}: ${at} ${message}`);
  };
  const describe = (value) => (Array.isArray(value) ? 'a list' : value === null ? 'empty' : `${typeof value} ${JSON.stringify(value)}`);

  const check = {
    fail,
    object(value, at) {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(at, `should be a mapping, got ${describe(value)}.`);
    },
    keys(value, allowed, at) {
      const unknown = Object.keys(value).find((key) => !allowed.includes(key));
      if (unknown) fail(at, `has an unknown key "${unknown}". Expected one of: ${allowed.join(', ')}.`);
    },
    // YAML reads `value: 2019` as a number; treat it as the text it was meant to be.
    string(value, at) {
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      if (typeof value !== 'string' || !value.trim()) fail(at, `should be some text, got ${describe(value)}.`);
      return value.trim();
    },
    optionalString(value, at) {
      return value === undefined || value === null ? null : check.string(value, at);
    },
    boolean(value, at) {
      if (typeof value !== 'boolean') fail(at, `should be true or false, got ${describe(value)}.`);
      return value;
    },
    oneOf(value, options, at) {
      if (!options.includes(value)) fail(at, `should be one of ${options.join(', ')}, got ${describe(value)}.`);
      return value;
    },
    list(value, at, { min = 0, max = Infinity } = {}) {
      if (!Array.isArray(value)) fail(at, `should be a list, got ${describe(value)}.`);
      if (value.length < min) fail(at, `needs at least ${min} ${min === 1 ? 'entry' : 'entries'}.`);
      if (value.length > max) fail(at, `can hold at most ${max} entries, got ${value.length}.`);
      return value;
    },
    copy(value, at) {
      if (Array.isArray(value)) return check.list(value, at, { min: 1 }).map((line, i) => check.string(line, `${at}[${i}]`));
      return check.string(value, at);
    },
    icon(value, at, { symbols = false } = {}) {
      const name = check.string(value, at);
      if (isBrand(name) || (symbols && isSymbol(name))) return name;
      const hints = suggestBrands(name);
      const hint = hints.length ? ` Did you mean ${hints.map((slug) => `"${slug}"`).join(' or ')}?` : '';
      const extra = symbols ? ` Built-in symbols: ${SYMBOL_NAMES.join(', ')}.` : '';
      return fail(at, `"${name}" is not a Simple Icons slug (https://simpleicons.org).${hint}${extra}`);
    },
  };
  return check;
}
