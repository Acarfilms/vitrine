import { CARD_WIDTH, CONTENT_TOP, section, surface } from '../section.js';
import { days, formatNumber, LANGUAGES } from '../../language.js';
import { measure, round, text } from '../svg.js';

const INSET = 36;
const HEIGHT = 280;

export function activity({ title }, stats, theme, language = 'en') {
  const span = CARD_WIDTH - INSET * 2;
  const words = LANGUAGES[language].activity;

  return section(theme, { title, aside: words.period }, HEIGHT, [
    surface(theme, { y: CONTENT_TOP, height: HEIGHT }),
    figures(stats, theme, span, language),
    `<path d="M${INSET} ${CONTENT_TOP + 128.5}H${CARD_WIDTH - INSET}" stroke="${theme.separator}"/>`,
    chart(stats, theme, span, words),
  ].join('\n'));
}

function figures(stats, theme, span, language) {
  const words = LANGUAGES[language].activity;
  const format = (n) => formatNumber(n, language);
  const items = [
    [words.contributions, format(stats.total)],
    [words.activeDays, format(stats.activeDays)],
    [words.currentStreak, format(stats.currentStreak), days(stats.currentStreak, language)],
    [words.longestStreak, format(stats.longestStreak), days(stats.longestStreak, language)],
  ];

  return items.map(([label, value, unit], i) => {
    const x = round(INSET + (i * span) / items.length);
    const suffix = unit
      ? `<tspan dx="5" class="text-500" font-size="17" letter-spacing="0" fill="${theme.secondary}">${unit}</tspan>`
      : '';
    return [
      `<text class="display-700" x="${x}" y="${CONTENT_TOP + 72}" font-size="40" letter-spacing="-1.2" fill="${theme.label}">${value}${suffix}</text>`,
      text(label, { font: 'text-500', size: 14, x, y: CONTENT_TOP + 100, fill: theme.secondary }),
    ].join('\n');
  }).join('\n');
}

// Weekly totals as capsules, like Screen Time, with a dashed line at the weekly average.
function chart({ weeks, total }, theme, span, words) {
  const baseline = CONTENT_TOP + 232;
  const tallest = 80;
  const step = span / weeks.length;
  const barWidth = Math.min(8, step * 0.56);
  const peak = Math.max(1, ...weeks.map((week) => week.count));
  const barHeight = (count) => (count ? 6 + (count / peak) * (tallest - 6) : 4);

  const bars = [];
  const labels = [];
  let previousMonth = null;
  let lastLabelX = -Infinity;

  weeks.forEach((week, i) => {
    const x = INSET + i * step + (step - barWidth) / 2;
    const height = barHeight(week.count);
    const fill = week.count ? theme.accent : theme.track;
    bars.push(`<rect x="${round(x)}" y="${round(baseline - height)}" width="${round(barWidth)}" height="${round(height)}" rx="${round(barWidth / 2)}" fill="${fill}"/>`);

    const month = new Date(`${week.start}T00:00:00Z`).getUTCMonth();
    const roomForLabel = x - lastLabelX > 36 && x < CARD_WIDTH - 60;
    if (previousMonth !== null && month !== previousMonth && roomForLabel) {
      labels.push(text(words.months[month], { font: 'text-500', size: 12, x, y: CONTENT_TOP + 256, fill: theme.tertiary }));
      lastLabelX = x;
    }
    previousMonth = month;
  });

  const average = total / weeks.length;
  const averageY = round(baseline - barHeight(average));
  const averageLabel = words.average(Math.round(average));
  const labelWidth = round(measure(averageLabel, 'text-500', 12) + 12);

  return [
    ...bars,
    `<path d="M${INSET} ${averageY}H${CARD_WIDTH - INSET}" stroke="${theme.tertiary}" stroke-dasharray="3 4" opacity=".7"/>`,
    `<rect x="${INSET}" y="${averageY - 21}" width="${labelWidth}" height="18" rx="9" fill="${theme.surface}"/>`,
    text(averageLabel, { font: 'text-500', size: 12, x: INSET + 6, y: averageY - 8, fill: theme.tertiary }),
    ...labels,
  ].join('\n');
}
