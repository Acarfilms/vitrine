import { glass, glassDefs, ON_GLASS } from '../glass.js';
import { icon } from '../icons.js';
import { document, fit, measure, text } from '../svg.js';
import { wallpaper, WALLPAPER_HEIGHT as HEIGHT, WALLPAPER_WIDTH as WIDTH } from '../wallpaper.js';

const MARGIN = 32;
const GAP = 16;

export function hero({ name, role, tagline, widgets }, { wallpaper: preset }) {
  const wall = wallpaper(preset);

  const title = fit(name, 'display-700', 76, WIDTH - MARGIN * 3, { min: 44, tracking: -2.6 });
  const subtitle = tagline && fit(tagline, 'text-400', 19, WIDTH - MARGIN * 3, { min: 15 });

  const layers = [
    role && rolePill(role, wall.shade),
    `<g filter="url(#lift)">`,
    text(title.content, { font: 'display-700', size: title.size, x: WIDTH / 2, y: 160, tracking: title.tracking, anchor: 'middle', fill: ON_GLASS }),
    subtitle && text(subtitle.content, { font: 'text-400', size: subtitle.size, x: WIDTH / 2, y: 204, anchor: 'middle', fill: ON_GLASS, opacity: 0.8 }),
    '</g>',
    ...widgets.map((widget, i) => widgetPane(widget, i, widgets.length, wall.shade)),
  ];

  return document(WIDTH, HEIGHT, `
<defs>
${wall.defs}
${glassDefs(wall.shade)}
<clipPath id="frame"><rect width="${WIDTH}" height="${HEIGHT}" rx="32"/></clipPath>
</defs>
<g clip-path="url(#frame)">
${wall.body}
${layers.filter(Boolean).join('\n')}
</g>`);
}

function rolePill(role, shade) {
  const label = fit(role, 'text-600', 14, WIDTH - MARGIN * 2 - 40, { min: 12, tracking: 0.2 });
  const width = measure(label.content, 'text-600', label.size, label.tracking) + 40;
  const pane = { x: (WIDTH - width) / 2, y: 40, width, height: 34, radius: 17 };
  return [
    glass('role', pane, { shade }),
    text(label.content, { font: 'text-600', size: label.size, x: WIDTH / 2, y: pane.y + 22, tracking: label.tracking, anchor: 'middle', fill: ON_GLASS }),
  ].join('\n');
}

function widgetPane({ icon: symbol, label, value }, index, count, shade) {
  const width = (WIDTH - MARGIN * 2 - GAP * (count - 1)) / count;
  const pane = { x: MARGIN + index * (width + GAP), y: 266, width, height: 88, radius: 26 };
  const middle = pane.y + pane.height / 2;
  const textX = pane.x + 76;
  const room = pane.x + width - 18 - textX;
  const caption = fit(label, 'text-400', 13, room, { min: 11 });
  const headline = fit(value, 'text-600', 19, room, { min: 14, tracking: -0.2 });

  return [
    glass(`widget-${index}`, pane, { shade }),
    `<circle cx="${pane.x + 42}" cy="${middle}" r="20" fill="${ON_GLASS}" fill-opacity=".16" stroke="${ON_GLASS}" stroke-opacity=".28"/>`,
    icon(symbol, { x: pane.x + 30, y: middle - 12, color: ON_GLASS }),
    `<g filter="url(#lift)">`,
    text(caption.content, { font: 'text-400', size: caption.size, x: textX, y: middle - 6, fill: ON_GLASS, opacity: 0.72 }),
    text(headline.content, { font: 'text-600', size: headline.size, x: textX, y: middle + 17, tracking: headline.tracking, fill: ON_GLASS }),
    '</g>',
  ].join('\n');
}
