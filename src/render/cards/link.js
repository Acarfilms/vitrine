import { glass, glassDefs, ON_GLASS } from '../glass.js';
import { icon } from '../icons.js';
import { document, measure, round, text } from '../svg.js';
import { wallpaper } from '../wallpaper.js';

const HEIGHT = 52;
const ICON = 20;
// Room around the capsule so its shadow is never clipped by the SVG edge.
const MARGIN = 28;

// Crops of the wallpaper, as [x, y, width, height]. Buttons take them in turn, so
// neighbours refract different colors.
const CROPS = [
  [200, 230, 300, 110],
  [560, 250, 280, 110],
  [40, 250, 300, 110],
  [380, 210, 300, 110],
];

export function link({ icon: symbol, label }, index, { wallpaper: preset }) {
  const wall = wallpaper(preset);
  const width = Math.round(24 + ICON + 10 + measure(label, 'text-600', 16) + 48);
  const [cropX, cropY, cropWidth, cropHeight] = CROPS[index % CROPS.length];
  const scaleX = width / cropWidth;
  const scaleY = HEIGHT / cropHeight;
  const view = `matrix(${round(scaleX)} 0 0 ${round(scaleY)} ${round(-cropX * scaleX)} ${round(-cropY * scaleY)})`;

  return document(width + MARGIN * 2, HEIGHT + MARGIN * 2, `
<defs>
${wall.defs}
${glassDefs(wall.shade)}
${wall.body}
</defs>
<g transform="translate(${MARGIN} ${MARGIN - 4})">
${glass('button', { x: 0, y: 0, width, height: HEIGHT, radius: HEIGHT / 2 }, { shade: wall.shade, view, shadow: 0.18 })}
<g filter="url(#lift)">
${icon(symbol, { x: 24, y: (HEIGHT - ICON) / 2, size: ICON, color: ON_GLASS })}
${text(label, { font: 'text-600', size: 16, x: 24 + ICON + 10, y: HEIGHT / 2 + 5.5, fill: ON_GLASS })}
${text('↗', { font: 'text-600', size: 14, x: width - 24, y: HEIGHT / 2 + 5, anchor: 'end', fill: ON_GLASS, opacity: 0.75 })}
</g>
</g>`);
}
