import INTER from '../assets/inter.js';

// For characters outside the embedded subset, and for viewers that block embedded fonts.
const FALLBACK = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif`;

export const round = (n) => Math.round(n * 100) / 100;

export const escape = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function measure(content, font, size, tracking = 0) {
  const { advance } = INTER[font];
  const chars = [...content];
  const width = chars.reduce((sum, char) => sum + (advance[char] ?? 0.6) * size, 0);
  return width + tracking * Math.max(0, chars.length - 1);
}

// Greedy wrap on Inter's advance widths. Kerning is ignored, so lines measure a little wide and break a little early.
export function wrap(content, font, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of content.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate, font, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Steps the size down to `min` until the line fits, then truncates with an ellipsis as a last resort.
// Tracking is given at the starting size and scales with it.
export function fit(content, font, size, maxWidth, { min = size, tracking = 0 } = {}) {
  const trackingAt = (s) => (tracking * s) / size;
  const fits = (line, s) => measure(line, font, s, trackingAt(s)) <= maxWidth;

  let current = size;
  while (current > min && !fits(content, current)) current -= 1;

  let line = content;
  while (line.length > 1 && !fits(line, current)) line = `${line.slice(0, -2).trimEnd()}…`;

  return { content: line, size: current, tracking: round(trackingAt(current)) };
}

export function text(content, { font = 'text-400', size, x, y, fill, tracking, anchor, opacity, filter }) {
  const attributes = [
    `class="${font}"`,
    `x="${round(x)}"`,
    `y="${round(y)}"`,
    `font-size="${size}"`,
    tracking ? `letter-spacing="${tracking}"` : null,
    anchor ? `text-anchor="${anchor}"` : null,
    `fill="${fill}"`,
    opacity === undefined ? null : `fill-opacity="${opacity}"`,
    filter ? `filter="url(#${filter})"` : null,
  ];
  return `<text ${attributes.filter(Boolean).join(' ')}>${escape(content)}</text>`;
}

export function document(width, height, body) {
  const used = Object.keys(INTER).filter((font) => body.includes(`class="${font}"`));
  const style = used
    .map((font) => [
      `@font-face { font-family: '${font}'; src: url(data:font/woff2;base64,${INTER[font].woff2}) format('woff2'); }`,
      `.${font} { font-family: '${font}', ${FALLBACK}; }`,
    ].join('\n'))
    .join('\n');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${round(width)}" height="${round(height)}" viewBox="0 0 ${round(width)} ${round(height)}" fill="none">`,
    style ? `<style>\n${style}\n</style>` : null,
    body.trim(),
    '</svg>',
    '',
  ].filter((part) => part !== null).join('\n');
}
