import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadConfig, normalize } from '../src/config.js';
import { renderCards } from '../src/render/index.js';
import { WALLPAPERS } from '../src/render/wallpaper.js';
import { icon } from '../src/render/icons.js';
import { snippet } from '../src/snippet.js';

const stats = {
  total: 492,
  activeDays: 140,
  currentStreak: 3,
  longestStreak: 6,
  weeks: Array.from({ length: 53 }, (_, i) => ({
    start: new Date(Date.UTC(2025, 8, 28) + i * 7 * 86_400_000).toISOString().slice(0, 10),
    count: (i * 7) % 23,
  })),
};

test('renders every card in the example config', async () => {
  const config = await loadConfig(new URL('../examples/vitrine.yml', import.meta.url));
  const cards = renderCards(config, { stats });

  assert.deepEqual(cards.map((card) => card.file), [
    'hero.svg',
    'expertise-light.svg', 'specs-light.svg', 'activity-light.svg',
    'expertise-dark.svg', 'specs-dark.svg', 'activity-dark.svg',
    'link-linkedin.svg', 'link-instagram.svg',
  ]);

  for (const { file, svg } of cards) {
    assert.match(svg, /^<svg [^>]*viewBox="0 0 [\d.]+ [\d.]+"/, file);
    assert.doesNotMatch(svg, /NaN|undefined|\[object/, file);
    assert.match(svg, /font\/woff2;base64,d09GMg/, `${file} should embed WOFF2 fonts`);
  }
});

test('skips the activity card when there are no stats', () => {
  const config = normalize({ hero: { name: 'Ada' }, activity: true });
  assert.deepEqual(renderCards(config).map((card) => card.file), ['hero.svg']);
});

test('every wallpaper renders', () => {
  for (const wallpaper of Object.keys(WALLPAPERS)) {
    const [card] = renderCards(normalize({ wallpaper, hero: { name: 'Ada' } }));
    assert.match(card.svg, /id="wall"/, wallpaper);
  }
});

test('mail symbols render in hero widgets and link buttons', () => {
  const config = normalize({
    hero: { name: 'Ada', widgets: [{ icon: 'mail', label: 'Email', value: 'ada@example.com' }] },
    links: [{ icon: 'mail', label: 'Email', url: 'https://example.com/contact' }],
  });
  const cards = renderCards(config);
  assert.deepEqual(cards.map(({ file }) => file), ['hero.svg', 'link-email.svg']);
  const symbol = icon('mail', { x: 0, y: 0, color: '#FFFFFF' });
  for (const { file, svg } of cards) {
    assert.ok(svg.includes(symbol.slice(symbol.indexOf('>') + 1, -4)), file);
    assert.doesNotMatch(svg, /NaN|undefined|\[object/, file);
  }
  assert.match(symbol, /stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/);
});

test('long text is cut to fit instead of spilling out', () => {
  const long = 'An extraordinarily long piece of text that no card has room for';
  const config = normalize({
    hero: { name: 'Ada', role: long.repeat(3), widgets: [{ icon: 'globe', label: long, value: long }] },
    expertise: { tiles: [{ eyebrow: 'A', headline: 'First' }, { eyebrow: long, headline: [long], icons: ['react'] }, { eyebrow: 'C', headline: 'Third' }] },
  });
  for (const { file, svg } of renderCards(config)) assert.match(svg, /…/, file);
});

test('the snippet pairs light and dark files and escapes alt text', () => {
  const config = normalize({
    hero: { name: 'Ada "Countess" Lovelace' },
    specs: { rows: [{ label: 'Web', items: ['react'] }] },
    links: [{ icon: 'github', label: 'GitHub', url: 'https://github.com/ada' }],
  });
  const markup = snippet(config, 'assets\\cards\\', { activity: false });

  assert.match(markup, /<img src="assets\/cards\/hero.svg" width="100%" alt="Ada &quot;Countess&quot; Lovelace.">/);
  assert.match(markup, /srcset="assets\/cards\/specs-dark.svg"/);
  assert.match(markup, /<img src="assets\/cards\/specs-light.svg"/);
  assert.match(markup, /<a href="https:\/\/github.com\/ada"><img src="assets\/cards\/link-github.svg" alt="GitHub"><\/a>/);
});
