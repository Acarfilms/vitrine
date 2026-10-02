// Apple system colors. Light values are the darker variants that pass contrast on white.
export const ACCENTS = {
  blue: { light: '#0071E3', dark: '#2997FF' },
  indigo: { light: '#3634A3', dark: '#5E5CE6' },
  purple: { light: '#8944AB', dark: '#BF5AF2' },
  pink: { light: '#D30F45', dark: '#FF375F' },
  orange: { light: '#C93400', dark: '#FF9F0A' },
  green: { light: '#248A3D', dark: '#30D158' },
  teal: { light: '#0071A4', dark: '#40C8E0' },
};

// Dark surfaces sit on GitHub's own dark canvas (#0D1117), not pure black.
const MODES = {
  light: {
    label: '#1D1D1F',
    secondary: '#6E6E73',
    tertiary: '#86868B',
    surface: '#F5F5F7',
    separator: '#D2D2D7',
    track: '#DCDCE1',
    tile: '#FFFFFF',
    tileEdge: '#000000',
    tileEdgeOpacity: 0.06,
    tileShadowOpacity: 0.1,
  },
  dark: {
    label: '#F5F5F7',
    secondary: '#A1A1A6',
    tertiary: '#7D7D82',
    surface: '#161B22',
    separator: '#30363D',
    track: '#2A313B',
    tile: '#262C36',
    tileEdge: '#FFFFFF',
    tileEdgeOpacity: 0.08,
    tileShadowOpacity: 0.45,
  },
};

export const theme = (mode, accent) => ({ mode, ...MODES[mode], accent: ACCENTS[accent][mode] });

export const MODE_NAMES = Object.keys(MODES);
