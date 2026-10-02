import { round } from './svg.js';

// Text and symbols on glass are always white, whatever the page theme.
export const ON_GLASS = '#FFFFFF';

// SVG has no backdrop-filter, so each pane redraws the wallpaper behind it: magnified,
// blurred and brightened, then clipped to the pane. A tint, a sheen and a soft inner band
// sit on top, and a gradient rim catches the light on two opposite corners.
export const glassDefs = (shade) => `
<filter id="glass-frost" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feGaussianBlur stdDeviation="7"/>
  <feColorMatrix type="saturate" values="1.6"/>
  <feComponentTransfer>
    <feFuncR type="linear" slope="1.1" intercept=".04"/>
    <feFuncG type="linear" slope="1.1" intercept=".04"/>
    <feFuncB type="linear" slope="1.1" intercept=".04"/>
  </feComponentTransfer>
</filter>
<filter id="glass-shadow" x="-30%" y="-50%" width="160%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="glass-band" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="lift" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="${shade}" flood-opacity=".35"/></filter>
<linearGradient id="glass-rim" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset=".3" stop-color="#FFFFFF" stop-opacity=".18"/>
  <stop offset=".7" stop-color="#FFFFFF" stop-opacity=".08"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".6"/>
</linearGradient>
<linearGradient id="glass-sheen" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity=".04"/>
  <stop offset="1" stop-color="#FFFFFF" stop-opacity=".1"/>
</linearGradient>`;

// `view` is a transform from wallpaper space into this pane's SVG, for panes that live
// outside the hero (link buttons refract a crop of the wallpaper).
export function glass(id, { x, y, width, height, radius }, { shade, view = '', shadow = 0.35 }) {
  const box = `x="${round(x)}" y="${round(y)}" width="${round(width)}" height="${round(height)}" rx="${radius}"`;
  const cx = round(x + width / 2);
  const cy = round(y + height / 2);
  const lens = `translate(${cx} ${cy}) scale(1.08) translate(${-cx} ${-cy})`;

  return `<rect ${box} fill="${shade}" opacity="${shadow}" filter="url(#glass-shadow)" transform="translate(0 8)"/>
<clipPath id="${id}"><rect ${box}/></clipPath>
<g clip-path="url(#${id})">
  <g transform="${lens}"><use href="#wall" xlink:href="#wall" filter="url(#glass-frost)"${view ? ` transform="${view}"` : ''}/></g>
  <rect ${box} fill="#FFFFFF" opacity=".1"/>
  <rect ${box} fill="url(#glass-sheen)"/>
  <rect ${box} stroke="#FFFFFF" stroke-opacity=".3" stroke-width="7" filter="url(#glass-band)"/>
</g>
<rect x="${round(x + 0.6)}" y="${round(y + 0.6)}" width="${round(width - 1.2)}" height="${round(height - 1.2)}" rx="${radius - 0.6}" stroke="url(#glass-rim)" stroke-width="1.2"/>`;
}
