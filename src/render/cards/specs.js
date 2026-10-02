import { icon } from '../icons.js';
import { CARD_WIDTH, CONTENT_TOP, section, surface } from '../section.js';
import { fit, measure, text } from '../svg.js';

const INSET = 32;
const ROW_HEIGHT = 62;
const PADDING = 6;

// The label column grows with the longest label, between these bounds.
const ITEMS_MIN_X = 232;
const ITEMS_MAX_X = 340;

// Laid out like the tech specs table on apple.com: a muted label column, then the items.
export function specs({ title, rows }, theme) {
  const widestLabel = Math.max(...rows.map((row) => measure(row.label, 'text-500', 15)));
  const itemsX = Math.min(ITEMS_MAX_X, Math.max(ITEMS_MIN_X, INSET + widestLabel + 40));
  const columns = Math.max(...rows.map((row) => row.items.length));
  const columnWidth = (CARD_WIDTH - INSET - itemsX) / columns;
  const height = rows.length * ROW_HEIGHT + PADDING * 2;

  const body = rows.map((row, i) => {
    const top = CONTENT_TOP + PADDING + i * ROW_HEIGHT;
    const middle = top + ROW_HEIGHT / 2;
    const separator = i ? `<path d="M${INSET} ${top + 0.5}H${CARD_WIDTH - INSET}" stroke="${theme.separator}"/>` : '';
    const label = fit(row.label, 'text-500', 15, itemsX - INSET - 24);
    const cells = row.items.map((item, j) => {
      const x = itemsX + j * columnWidth;
      const name = fit(item.label, 'text-500', 17, columnWidth - 44, { min: 14 });
      return [
        icon(item.icon, { x, y: middle - 11, size: 22, color: theme.label }),
        text(name.content, { font: 'text-500', size: name.size, x: x + 34, y: middle + 6, fill: theme.label }),
      ].join('\n');
    });
    return [
      separator,
      text(label.content, { font: 'text-500', size: 15, x: INSET, y: middle + 5, fill: theme.secondary }),
      ...cells,
    ].join('\n');
  });

  return section(theme, { title }, height, [surface(theme, { y: CONTENT_TOP, height }), ...body].join('\n'));
}
