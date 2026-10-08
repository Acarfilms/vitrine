import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchRepository, summarize } from '../src/github.js';

// Builds a calendar from a list of daily counts, starting on a Sunday.
function calendar(counts) {
  const start = Date.UTC(2026, 0, 4);
  const days = counts.map((contributionCount, i) => ({
    date: new Date(start + i * 86_400_000).toISOString().slice(0, 10),
    contributionCount,
  }));
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push({ contributionDays: days.slice(i, i + 7) });
  return { totalContributions: counts.reduce((a, b) => a + b, 0), weeks };
}

test('counts totals, active days and weekly sums', () => {
  const stats = summarize(calendar([1, 0, 2, 0, 0, 0, 3, 4, 0]));
  assert.equal(stats.total, 10);
  assert.equal(stats.activeDays, 4);
  assert.deepEqual(stats.weeks, [
    { start: '2026-01-04', count: 6 },
    { start: '2026-01-11', count: 4 },
  ]);
});

test('finds the longest streak anywhere in the year', () => {
  assert.equal(summarize(calendar([1, 1, 1, 0, 1, 1, 0])).longestStreak, 3);
});

test('a streak that ended yesterday is still current', () => {
  assert.equal(summarize(calendar([0, 1, 1, 1, 0])).currentStreak, 3);
  assert.equal(summarize(calendar([0, 1, 1, 1, 2])).currentStreak, 4);
});

test('two quiet days end the current streak', () => {
  assert.equal(summarize(calendar([1, 1, 0, 0])).currentStreak, 0);
});

// Answers GraphQL requests with `payload` instead of calling GitHub.
function respond(payload, status = 200) {
  globalThis.fetch = async () => new Response(JSON.stringify(payload), { status });
}

test('reads a public repository', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  respond({ data: { repository: {
    nameWithOwner: 'ada/engine', description: '  Analytical engine.  ', stargazerCount: 12, forkCount: 3, isPrivate: false,
    primaryLanguage: { name: 'Rust', color: '#dea584' },
  } } });
  assert.deepEqual(await fetchRepository('ada/engine', 'token'), {
    name: 'ada/engine', description: 'Analytical engine.', stars: 12, forks: 3, language: { name: 'Rust', color: '#dea584' },
  });
});

test('refuses to feature a private repository', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  respond({ data: { repository: { nameWithOwner: 'ada/secret', description: 'Plans', stargazerCount: 0, forkCount: 0, isPrivate: true, primaryLanguage: null } } });
  await assert.rejects(fetchRepository('ada/secret', 'token'), /"ada\/secret" is private/);
});

test('says which repository could not be found', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  respond({ data: { repository: null }, errors: [{ type: 'NOT_FOUND', message: 'Could not resolve' }] });
  await assert.rejects(fetchRepository('ada/missing', 'token'), /Could not find the repository "ada\/missing"/);
});
