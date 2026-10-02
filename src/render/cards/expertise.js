import { brandColor, icon } from '../icons.js';
import { CARD_WIDTH, CONTENT_TOP, section, surface } from '../section.js';
import { fit, round, text, wrap } from '../svg.js';

const GAP = 16;
const ICON_COLUMNS = 3;

// Full-width tiles use bigger type and set their icons beside the copy.
// Half-width tiles tuck up to three smaller icons into the top-right corner.
const SIZES = {
  wide: { padding: 44, top: 54, headline: 36, bottom: 41, iconSize: 64, iconGap: 18 },
  half: { padding: 36, top: 50, headline: 30, bottom: 37, iconSize: 44, iconGap: 10 },
};

export function expertise({ title, tiles }, theme) {
  let y = CONTENT_TOP;
  const parts = [`<defs><filter id="icon-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000000" flood-opacity="${theme.tileShadowOpacity}"/></filter></defs>`];

  for (const row of arrange(tiles)) {
    const width = row.length === 1 ? CARD_WIDTH : (CARD_WIDTH - GAP) / 2;
    const laid = row.map((tile, i) => layout(tile, row.length === 1 ? 'wide' : 'half', i * (width + GAP), y, width));
    const height = Math.max(...laid.map((tile) => tile.height));
    for (const tile of laid) parts.push(tile.draw(height, theme));
    y += height + GAP;
  }

  return section(theme, { title }, y - GAP - CONTENT_TOP, parts.join('\n'));
}

// The first tile is full width unless it sets wide: false. The rest pair up in order,
// and a tile left without a partner gets a row of its own.
export function arrange(tiles) {
  const rows = [];
  let pending = null;
  const flush = () => {
    if (pending) rows.push([pending]);
    pending = null;
  };

  tiles.forEach((tile, i) => {
    if (tile.wide ?? i === 0) {
      flush();
      rows.push([tile]);
    } else if (pending) {
      rows.push([pending, tile]);
      pending = null;
    } else {
      pending = tile;
    }
  });
  flush();
  return rows;
}

function layout(tile, kind, x, y, width) {
  const size = SIZES[kind];
  const icons = tile.icons;
  const columns = Math.min(ICON_COLUMNS, icons.length);
  const iconRows = Math.ceil(icons.length / ICON_COLUMNS);
  const gridWidth = columns ? columns * size.iconSize + (columns - 1) * size.iconGap : 0;
  const gridHeight = iconRows ? iconRows * size.iconSize + (iconRows - 1) * size.iconGap : 0;

  const copyWidth = width - size.padding * 2 - (kind === 'wide' && gridWidth ? gridWidth + 48 : 0);
  // On half tiles the icons share the top lines with the eyebrow and headline.
  const topWidth = kind === 'half' && gridWidth ? copyWidth - gridWidth - 16 : copyWidth;

  const tracking = round(-0.025 * size.headline);
  const eyebrow = fit(tile.eyebrow, 'text-600', 15, topWidth).content;
  const headline = lines(tile.headline, 'display-700', size.headline, topWidth, tracking);
  const body = lines(tile.body, 'text-400', 16, copyWidth);

  const eyebrowY = y + size.top;
  const headlineY = eyebrowY + 46;
  const lineHeight = size.headline + 6;
  const bodyY = headlineY + (headline.length - 1) * lineHeight + 44;
  const copyBottom = body.length ? bodyY + (body.length - 1) * 23 : headlineY + (headline.length - 1) * lineHeight;
  const contentHeight = copyBottom + size.bottom - y;
  const height = kind === 'wide' ? Math.max(contentHeight, gridHeight + 88) : contentHeight;

  const draw = (rowHeight, theme) => {
    const textX = x + size.padding;
    const copy = [
      text(eyebrow, { font: 'text-600', size: 15, x: textX, y: eyebrowY, fill: theme.accent }),
      ...headline.map((line, i) => text(line, { font: 'display-700', size: size.headline, x: textX, y: headlineY + i * lineHeight, tracking, fill: theme.label })),
      ...body.map((line, i) => text(line, { font: 'text-400', size: 16, x: textX, y: bodyY + i * 23, fill: theme.secondary })),
    ];

    const gridX = x + width - size.padding - gridWidth;
    const gridY = kind === 'wide' ? y + (rowHeight - gridHeight) / 2 : y + 30;
    const grid = icons.map((slug, i) => appIcon(slug, theme, {
      x: gridX + (i % ICON_COLUMNS) * (size.iconSize + size.iconGap),
      y: gridY + Math.floor(i / ICON_COLUMNS) * (size.iconSize + size.iconGap),
      size: size.iconSize,
    }));

    return [surface(theme, { x, y, width, height: rowHeight }), ...copy, ...grid].join('\n');
  };

  return { height, draw };
}

// Copy can be a string to wrap automatically, or a list when the line breaks matter.
// Either way, a line that still doesn't fit is cut with an ellipsis.
function lines(value, font, size, width, tracking = 0) {
  if (!value) return [];
  const broken = Array.isArray(value) ? value : wrap(value, font, size, width);
  return broken.map((line) => fit(line, font, size, width, { tracking }).content);
}

// A white (or graphite) tile with the brand mark, like an app icon on a Home Screen.
function appIcon(slug, theme, { x, y, size }) {
  const radius = round(size * 0.235);
  const mark = size / 2;
  return [
    `<rect x="${round(x)}" y="${round(y)}" width="${size}" height="${size}" rx="${radius}" fill="${theme.tile}" filter="url(#icon-shadow)"/>`,
    `<rect x="${round(x + 0.5)}" y="${round(y + 0.5)}" width="${size - 1}" height="${size - 1}" rx="${radius - 0.5}" stroke="${theme.tileEdge}" stroke-opacity="${theme.tileEdgeOpacity}"/>`,
    icon(slug, { x: x + (size - mark) / 2, y: y + (size - mark) / 2, size: mark, color: brandColor(slug, theme) }),
  ].join('\n');
}
