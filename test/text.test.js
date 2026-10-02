import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fit, measure, wrap } from '../src/render/svg.js';

test('measure scales with size and tracking', () => {
  const base = measure('Vitrine', 'text-400', 16);
  assert.ok(base > 40 && base < 70);
  assert.equal(measure('Vitrine', 'text-400', 32), base * 2);
  assert.ok(Math.abs(measure('Vitrine', 'text-400', 16, 1) - (base + 6)) < 1e-9);
});

test('wrap never exceeds the width unless a single word does', () => {
  const lines = wrap('AI agents and automations that take real work off the table, end to end.', 'text-400', 16, 300);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(measure(line, 'text-400', 16) <= 300, line);
  assert.deepEqual(wrap('Supercalifragilistic', 'text-400', 16, 20), ['Supercalifragilistic']);
});

test('fit shrinks before it truncates', () => {
  const shrunk = fit('Leading tech at IABeauty', 'text-600', 19, 200, { min: 14 });
  assert.ok(shrunk.size < 19);
  assert.equal(shrunk.content, 'Leading tech at IABeauty');

  const truncated = fit('An extremely long company name that cannot possibly fit', 'text-600', 19, 120, { min: 14 });
  assert.equal(truncated.size, 14);
  assert.ok(truncated.content.endsWith('…'));
  assert.ok(measure(truncated.content, 'text-600', 14) <= 120);
});
