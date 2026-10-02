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

test('links must be absolute URLs', () => {
  assert.throws(
    () => normalize({ links: [{ ...link('GitHub'), url: 'github.com/ada' }] }),
    /links\[0\].url should start with http:\/\/ or https:\/\//,
  );
});

test('each link gets its own file', () => {
  assert.deepEqual(normalize({ links: [link('Dev.to'), link('微博')] }).links.map((entry) => entry.file), ['link-dev-to.svg', 'link-2.svg']);
  assert.throws(() => normalize({ links: [link('Dev.to'), link('Dev to')] }), /both would be saved as link-dev-to.svg/);
});

test('an empty config is an error, not an empty folder', () => {
  assert.throws(() => normalize({}), /nothing to render/);
});
