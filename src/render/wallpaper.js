import { round } from './svg.js';

export const WALLPAPER_WIDTH = 840;
export const WALLPAPER_HEIGHT = 390;

// Every preset shares the same composition: a sky, three soft glows and four layered waves
// lit from the upper right. Only the colors change.
const GLOWS = [
  { cx: 690, cy: 70, rx: 250, ry: 150 },
  { cx: 120, cy: 360, rx: 280, ry: 140 },
  { cx: 800, cy: 380, rx: 200, ry: 130 },
];

const WAVES = [
  { d: 'M0 214C170 168 318 282 520 236S760 150 840 176V390H0Z', to: [1, 1] },
  { d: 'M0 270C150 226 352 330 556 284S770 214 840 238V390H0Z', to: [1, 0.6] },
  { d: 'M0 326C190 286 382 372 600 330S784 286 840 296V390H0Z', to: [1, 0] },
  { d: 'M300 390C420 352 560 360 680 344S810 322 840 326V390Z', to: [1, 0] },
];

export const WALLPAPERS = {
  tide: {
    sky: ['#02071C', '#071A52', '#0B2F8A'],
    glows: [['#1E6BFF', 0.8], ['#00A3FF', 0.45], ['#FF7A45', 0.5]],
    waves: [
      ['#1B4FD6', '#0A1F6B'],
      ['#2E8BFF', '#1F5BEA', '#5B4BE0'],
      ['#5FD3FF', '#3A8DFF', '#FF8A5C'],
      ['#2A6BFF', '#7A5CFF', '#FF6F61'],
    ],
    shade: '#000A2E',
  },
  dusk: {
    sky: ['#0B0618', '#2A0F3D', '#4E1846'],
    glows: [['#FF6A3D', 0.55], ['#B23A8A', 0.5], ['#FFB347', 0.5]],
    waves: [
      ['#5B1E6E', '#2A0F3D'],
      ['#C2366B', '#7A2A7E', '#3D1C6B'],
      ['#FFB56B', '#FF6A5C', '#C2366B'],
      ['#FF8A5C', '#FF5E7E', '#B23A8A'],
    ],
    shade: '#14051F',
  },
  graphite: {
    sky: ['#050506', '#141416', '#26282D'],
    glows: [['#8E9AAF', 0.35], ['#5A6170', 0.35], ['#C7CCD6', 0.25]],
    waves: [
      ['#2C2F36', '#121316'],
      ['#4A4F5A', '#2C2F36', '#3A3D44'],
      ['#A9B0BC', '#6B7280', '#3F444D'],
      ['#7C8494', '#9AA1AE', '#C7CCD6'],
    ],
    shade: '#000000',
  },
};

const stops = (colors) =>
  colors.map((color, i) => `<stop offset="${round(i / (colors.length - 1))}" stop-color="${color}"/>`).join('');

// Returns the defs and a <g id="wall"> that glass panels refract through <use>.
export function wallpaper(name) {
  const { sky, glows, waves, shade } = WALLPAPERS[name];

  const defs = `
<linearGradient id="wp-sky" x1="0" y1="0" x2=".3" y2="1">${stops(sky)}</linearGradient>
${WAVES.map(({ to }, i) => `<linearGradient id="wp-wave-${i}" x1="0" y1="0" x2="${to[0]}" y2="${to[1]}">${stops(waves[i])}</linearGradient>`).join('\n')}
<linearGradient id="wp-crest" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset=".35" stop-color="#FFFFFF" stop-opacity=".55"/>
  <stop offset=".8" stop-color="#FFFFFF" stop-opacity=".25"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
</linearGradient>
<filter id="wp-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>
<filter id="wp-lift" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="-10" stdDeviation="14" flood-color="${shade}" flood-opacity=".6"/></filter>
<filter id="wp-soften" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
<filter id="wp-grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="table" tableValues="0 .09"/></feComponentTransfer>
</filter>`;

  const body = `<g id="wall">
<rect width="${WALLPAPER_WIDTH}" height="${WALLPAPER_HEIGHT}" fill="url(#wp-sky)"/>
<g filter="url(#wp-glow)">
${GLOWS.map(({ cx, cy, rx, ry }, i) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${glows[i][0]}" opacity="${glows[i][1]}"/>`).join('\n')}
</g>
${WAVES.map(({ d }, i) => `<path d="${d}" fill="url(#wp-wave-${i})" filter="url(#wp-lift)"/>`).join('\n')}
${WAVES.slice(0, 3).map(({ d }) => `<path d="${d.split('V')[0]}" stroke="url(#wp-crest)" stroke-width="1.4" filter="url(#wp-soften)"/>`).join('\n')}
<rect width="${WALLPAPER_WIDTH}" height="${WALLPAPER_HEIGHT}" filter="url(#wp-grain)"/>
</g>`;

  return { defs, body, shade };
}
