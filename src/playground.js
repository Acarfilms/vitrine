import { parse } from 'yaml';
import { normalize, ConfigError } from './config.js';
import { renderCards } from './render/index.js';
import { snippet } from './snippet.js';

export const SAMPLE_REPO = {
  name: 'Acarfilms/vitrine',
  description: 'Liquid Glass cards for your GitHub profile README, rendered in your own repository.',
  stars: 256,
  forks: 32,
  language: { name: 'JavaScript', color: '#f1e05a' },
};

export function generateSampleStats() {
  const weeks = [];
  const now = new Date();
  let total = 0;
  for (let i = 51; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const wave = Math.sin((51 - i) * 0.25) * 12 + 18;
    const spike = (i % 7 === 0) ? 28 : (i % 11 === 0) ? 20 : 0;
    const count = Math.max(0, Math.floor(wave + spike));
    total += count;
    weeks.push({
      start: d.toISOString().split('T')[0],
      count,
    });
  }
  return {
    total,
    activeDays: 228,
    currentStreak: 14,
    longestStreak: 42,
    weeks,
  };
}

const DEFAULT_CONFIG = `# Vitrine Profile Cards Playground
# Edit this YAML to see your cards update live!

wallpaper: tide
accent: blue
language: en

hero:
  name: Jane Appleseed
  role: Product engineer
  tagline: Small teams, big launches.
  widgets:
    - { icon: location, label: Based in, value: Cupertino }
    - { icon: building, label: Working at, value: Acme }
    - { icon: code, label: Focus, value: iOS · Web }

expertise:
  title: Expertise
  tiles:
    - eyebrow: Apps & Web
      headline: [Native feel., Web speed.]
      body: Cross-platform apps in Flutter. Fast, modern web with Next.js.
      icons: [flutter, nextdotjs, typescript]
    - eyebrow: Design
      headline: Interfaces that explain themselves.
    - eyebrow: Leadership
      headline: From roadmap to release.
      icons: [linear, notion]

featured: Acarfilms/vitrine

specs:
  title: Tech specs
  rows:
    - label: Mobile
      items: [swift, kotlin, { icon: react, label: React Native }]
    - label: Data
      items: [postgresql, redis]

activity: true

links:
  - { icon: github, label: GitHub, url: https://github.com/jane }
  - { icon: linkedin, label: LinkedIn, url: https://linkedin.com/in/jane }
  - { icon: mail, label: Email, url: 'mailto:jane@example.com' }
`;

function initPlayground() {
  const editor = document.getElementById('yaml-input');
  const preview = document.getElementById('cards-preview');
  const errorBox = document.getElementById('error-banner');
  const themeToggle = document.getElementById('theme-toggle');
  const copyBtn = document.getElementById('copy-markup-btn');
  const toast = document.getElementById('toast');

  if (!editor || !preview) return;

  let currentMode = 'dark';
  const sampleStats = generateSampleStats();

  editor.value = DEFAULT_CONFIG;

  function render() {
    const rawYaml = editor.value;
    try {
      let parsed;
      try {
        parsed = parse(rawYaml);
      } catch (err) {
        throw new Error(`YAML syntax error: ${err.message}`);
      }

      const config = normalize(parsed ?? {});
      errorBox.style.display = 'none';
      errorBox.textContent = '';

      const repoData = config.featured ? { ...SAMPLE_REPO, name: config.featured.repo } : null;
      const cards = renderCards(config, { stats: sampleStats, repo: repoData });

      // Filter cards matching current preview theme (plus hero/links which are theme-agnostic)
      const visibleCards = cards.filter((c) => {
        if (c.file.endsWith('-light.svg') && currentMode !== 'light') return false;
        if (c.file.endsWith('-dark.svg') && currentMode !== 'dark') return false;
        return true;
      });

      // Group link buttons together in a flex row at the bottom
      const standardCards = [];
      const linkCards = [];

      for (const card of visibleCards) {
        if (card.file.startsWith('link-')) {
          linkCards.push(card);
        } else {
          standardCards.push(card);
        }
      }

      let html = standardCards.map((card) => `
        <div class="card-wrapper" data-file="${card.file}">
          <div class="card-label">${card.file}</div>
          <div class="card-svg-container">${card.svg}</div>
        </div>
      `).join('');

      if (linkCards.length) {
        html += `
          <div class="card-wrapper links-wrapper">
            <div class="card-label">links (${linkCards.length})</div>
            <div class="links-row">
              ${linkCards.map((c) => `<div class="link-btn-svg">${c.svg}</div>`).join('')}
            </div>
          </div>
        `;
      }

      preview.innerHTML = html;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  }

  const SUN_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  const MOON_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  const COPY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
  const CHECK_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  function updateThemeButton() {
    if (!themeToggle) return;
    themeToggle.innerHTML = currentMode === 'dark'
      ? `${MOON_ICON}<span>Dark</span>`
      : `${SUN_ICON}<span>Light</span>`;
  }

  updateThemeButton();

  // Debounced input
  let debounceTimer;
  editor.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(render, 150);
  });

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    currentMode = currentMode === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-preview-theme', currentMode);
    updateThemeButton();
    render();
  });

  // Copy README snippet
  copyBtn.addEventListener('click', async () => {
    try {
      const parsed = parse(editor.value);
      const config = normalize(parsed ?? {});
      const markup = snippet(config, 'vitrine', {
        activity: Boolean(config.activity),
        featured: Boolean(config.featured),
      });
      await navigator.clipboard.writeText(markup);

      const prevHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = `${CHECK_ICON}<span>Copied!</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = prevHTML;
      }, 2000);

      showToast('Markdown copied to clipboard');
    } catch (err) {
      showToast('Fix errors before copying', true);
    }
  });

  function showToast(msg, isError = false) {
    if (!toast) return;
    toast.innerHTML = isError
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${msg}</span>`
      : `${CHECK_ICON}<span>${msg}</span>`;
    toast.className = isError ? 'toast error show' : 'toast show';
    setTimeout(() => {
      toast.className = 'toast';
    }, 2800);
  }

  // Initial render
  render();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayground);
  } else {
    initPlayground();
  }
}
