import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConfigError, loadConfig, normalize } from '../src/config.js';
import { arrange } from '../src/render/cards/expertise.js';

const link = (label) => ({ icon: 'github', label, url: 'https://example.com' });

test('fills in defaults around a minimal config', () => {
  const config = normalize({ hero: { name: 'Ada Lovelace' } });
  assert.equal(config.wallpaper, 'tide');
  assert.equal(config.accent, 'blue');
  assert.deepEqual(config.hero, { name: 'Ada Lovelace', role: null, tagline: null, widgets: [] });
  assert.equal(config.activity, null);
  assert.deepEqual(config.links, []);
});

test('the example config is valid', async () => {
  const config = await loadConfig(new URL('../examples/vitrine.yml', import.meta.url));
  assert.equal(config.hero.widgets.length, 3);
  assert.equal(config.specs.rows[0].items[2].label, 'React Native');
});

test('spec items take the brand title unless renamed', () => {
  const { specs } = normalize({ specs: { rows: [{ label: 'Web', items: ['nextdotjs', { icon: 'react', label: 'React Native' }] }] } });
  assert.deepEqual(specs.rows[0].items, [
    { icon: 'nextdotjs', label: 'Next.js' },
    { icon: 'react', label: 'React Native' },
  ]);
});

test('numbers are read as text', () => {
  const widget = { icon: 'calendar', label: 'Coding since', value: 2019 };
  assert.equal(normalize({ hero: { name: 'Ada', widgets: [widget] } }).hero.widgets[0].value, '2019');
});

test('activity accepts true or a custom title', () => {
  assert.deepEqual(normalize({ activity: true }).activity, { title: 'Activity' });
  assert.deepEqual(normalize({ activity: { title: 'This year' } }).activity, { title: 'This year' });
});

test('errors point at the field and suggest the right slug', () => {
  assert.throws(
    () => normalize({ specs: { rows: [{ label: 'Web', items: ['nextjs'] }] } }),
    (error) => error instanceof ConfigError
      && error.message.includes('specs.rows[0].items[0]')
      && error.message.includes('"nextdotjs"'),
  );
});

test('rejects typos in keys instead of ignoring them', () => {
  assert.throws(() => normalize({ hero: { name: 'Ada', tagine: 'Typo' } }), /unknown key "tagine"/);
});

test('rejects an unknown wallpaper', () => {
  assert.throws(() => normalize({ wallpaper: 'neon', hero: { name: 'Ada' } }), /wallpaper should be one of tide, dusk, graphite/);
});

test('limits the hero to three widgets', () => {
  const widget = { icon: 'globe', label: 'Web', value: 'example.com' };
  assert.throws(() => normalize({ hero: { name: 'Ada', widgets: [widget, widget, widget, widget] } }), /at most 3/);
});

test('tiles keep their order around a wide one', () => {
  const tiles = ['A', 'B', 'C', 'D'].map((eyebrow) => ({ eyebrow, wide: eyebrow === 'C' ? true : null }));
  assert.deepEqual(arrange(tiles).map((row) => row.map((tile) => tile.eyebrow).join('+')), ['A', 'B', 'C', 'D']);
  tiles.push({ eyebrow: 'E', wide: null });
  assert.deepEqual(arrange(tiles).map((row) => row.map((tile) => tile.eyebrow).join('+')), ['A', 'B', 'C', 'D+E']);
});

test('tiles that share a row take at most three icons', () => {
  const icons = ['react', 'vuedotjs', 'svelte', 'angular'];
  const first = { eyebrow: 'A', headline: 'First' };
  const crowded = { eyebrow: 'B', headline: 'Crowded', icons };
  const plain = { eyebrow: 'C', headline: 'Plain' };

  assert.throws(() => normalize({ expertise: { tiles: [first, crowded, plain] } }), /expertise.tiles\[1\].icons can hold at most 3/);
  assert.doesNotThrow(() => normalize({ expertise: { tiles: [first, { ...crowded, wide: true }, plain] } }));
  assert.doesNotThrow(() => normalize({ expertise: { tiles: [first, crowded] } }), 'a leftover tile spans the full width');
});

test('links accept HTTP, HTTPS and mailto prefixes', () => {
  for (const url of ['http://example.com', 'https://example.com', 'mailto:ada@example.com', 'mailto:ada@example.com?subject=Hello%20Ada&body=Hi', 'mailto:', 'mailto:?subject=Hello']) {
    assert.equal(normalize({ links: [{ ...link('Email'), url }] }).links[0].url, url);
  }
});

test('links reject unsupported schemes and relative URLs', () => {
  for (const url of ['github.com/ada', '/profile', '//example.com', 'javascript:alert(1)', 'data:text/html,test', 'file:///tmp/test', 'tel:123', 'prefix-mailto:ada@example.com', 'MAILTO:ada@example.com']) {
    assert.throws(
      () => normalize({ links: [{ ...link('Email'), url }] }),
      (error) => error instanceof ConfigError && error.message.includes('links[0].url should start with http://, https:// or mailto:'),
      url,
    );
  }
});

test('each link gets its own file', () => {
  assert.deepEqual(normalize({ links: [link('Dev.to'), link('微博')] }).links.map((entry) => entry.file), ['link-dev-to.svg', 'link-2.svg']);
  assert.throws(() => normalize({ links: [link('Dev.to'), link('Dev to')] }), /both would be saved as link-dev-to.svg/);
});

test('an empty config is an error, not an empty folder', () => {
  assert.throws(() => normalize({}), /nothing to render/);
});

test('language defaults to English and translates the default titles', () => {
  const card = { tiles: [{ eyebrow: 'Web', headline: 'Fast' }] };
  const specs = { rows: [{ label: 'Web', items: ['react'] }] };
  assert.equal(normalize({ activity: true }).language, 'en');

  const config = normalize({ language: 'es', expertise: card, specs, activity: true });
  assert.equal(config.expertise.title, 'Especialidades');
  assert.equal(config.specs.title, 'Especificaciones técnicas');
  assert.deepEqual(config.activity, { title: 'Actividad' });
});

test('a custom title wins over the translated one', () => {
  assert.deepEqual(normalize({ language: 'de', activity: { title: 'Dieses Jahr' } }).activity, { title: 'Dieses Jahr' });
});

test('rejects an unknown language', () => {
  assert.throws(() => normalize({ language: 'klingon', activity: true }), /language should be one of en, es, fr, de, pt, it/);
});

test('featured takes a repository, written short or long', () => {
  assert.deepEqual(normalize({ featured: 'Acarfilms/vitrine' }).featured, { repo: 'Acarfilms/vitrine', title: 'Featured' });
  assert.deepEqual(normalize({ featured: { repo: 'ada/engine', title: 'Pinned' } }).featured, { repo: 'ada/engine', title: 'Pinned' });
  assert.equal(normalize({ language: 'es', featured: 'ada/engine' }).featured.title, 'Destacado');
});

test('featured needs an owner/name repository', () => {
  for (const repo of ['vitrine', 'https://github.com/ada/engine', 'ada/engine/extra', 'ada/ engine']) {
    assert.throws(() => normalize({ featured: repo }), /featured.repo should look like "owner\/name"/, repo);
  }
});
