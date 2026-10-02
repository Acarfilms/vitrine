import { document, text } from './svg.js';

export const CARD_WIDTH = 840;

// Content starts this far below the top of a section, under its heading.
export const CONTENT_TOP = 64;

// Extra room above each heading. GitHub stacks README images with almost no margin,
// so the spacing between sections has to live inside the SVGs.
const BREATHING_ROOM = 28;

export function section(theme, { title, aside }, contentHeight, body) {
  const heading = text(title, { font: 'display-700', size: 32, x: 2, y: 38, tracking: -0.8, fill: theme.label });
  const note = aside
    ? text(aside, { font: 'text-500', size: 14, x: CARD_WIDTH - 2, y: 38, anchor: 'end', fill: theme.tertiary })
    : '';
  const height = CONTENT_TOP + contentHeight + 2;
  return document(CARD_WIDTH, height + BREATHING_ROOM, `
<g transform="translate(0 ${BREATHING_ROOM})">
${heading}
${note}
${body.trim()}
</g>`);
}

export function surface(theme, { x = 0, y, width = CARD_WIDTH, height }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="${theme.surface}"/>`;
}
