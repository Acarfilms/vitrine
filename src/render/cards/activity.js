import { CARD_WIDTH, CONTENT_TOP, section, surface } from '../section.js';
import { measure, round, text } from '../svg.js';

const INSET = 36;
const HEIGHT = 280;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function activity({ title }, stats, theme) {
  const span = CARD_WIDTH - INSET * 2;

  return section(theme, { title, aside: 'Last 12 months' }, HEIGHT, [
    surface(theme, { y: CONTENT_TOP, height: HEIGHT }),
    figures(stats, theme, span),
    `<path d="M${INSET} ${CONTENT_TOP + 128.5}H${CARD_WIDTH - INSET}" stroke="${theme.separator}"/>`,
    chart(stats, theme, span),
  ].join('\n'));
}

function figures(stats, theme, span) {
  const days = (n) => (n === 1 ? 'day' : 'days');
  const format = (n) => n.toLocaleString('en-US');
  const items = [
    ['Contributions', format(stats.total)],
    ['Active days', format(stats.activeDays)],
    ['Current streak', format(stats.currentStreak), days(stats.currentStreak)],
    ['Longest streak', format(stats.longestStreak), days(stats.longestStreak)],
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
function chart({ weeks, total }, theme, span) {
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
      labels.push(text(MONTHS[month], { font: 'text-500', size: 12, x, y: CONTENT_TOP + 256, fill: theme.tertiary }));
      lastLabelX = x;
    }
    previousMonth = month;
  });

  const average = total / weeks.length;
  const averageY = round(baseline - barHeight(average));
  const averageLabel = `avg ${Math.round(average)}/wk`;
  const labelWidth = round(measure(averageLabel, 'text-500', 12) + 12);

  return [
    ...bars,
    `<path d="M${INSET} ${averageY}H${CARD_WIDTH - INSET}" stroke="${theme.tertiary}" stroke-dasharray="3 4" opacity=".7"/>`,
    `<rect x="${INSET}" y="${averageY - 21}" width="${labelWidth}" height="18" rx="9" fill="${theme.surface}"/>`,
    text(averageLabel, { font: 'text-500', size: 12, x: INSET + 6, y: averageY - 8, fill: theme.tertiary }),
    ...labels,
  ].join('\n');
}
