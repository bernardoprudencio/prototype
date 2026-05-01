/** Kibble Design Tokens */

// ─── Base Color Palette ───────────────────────────────────────────────────────
// Full Kibble color families. Use the flat `colors.*` aliases below when possible.
export const palette = {
  neutral: {
    white: '#FFFFFF',
    100:   '#F4F5F6',
    200:   '#E6E8EB',
    300:   '#D7DCE0',
    400:   '#C9CFD4',
    500:   '#9EA5AC',
    600:   '#767C82',
    700:   '#62686E',
    800:   '#404347',
    84:    '#CFD7DE',
    900:   '#1F2124',
  },
  green: {
    100: '#F1FDF6',
    200: '#BAE8C9',
    300: '#6BD094',
    400: '#05B86C',
    500: '#169A5B',
    600: '#1A824E',
    700: '#1B6C42',
    800: '#1B5535',
    900: '#173724',
  },
  cyan: {
    100: '#E8F9FC',
    200: '#8BE2EF',
    300: '#39CDE4',
    400: '#1CB0C7',
    500: '#1893A7',
    600: '#127787',
    700: '#116876',
    800: '#0D535D',
    900: '#09363D',
  },
  yellow: {
    100: '#FCF6EB',
    200: '#FFECBD',
    300: '#FFD76A',
    400: '#F8B816',
    500: '#D59418',
    600: '#B77F1D',
    700: '#80561A',
    800: '#654418',
    900: '#412C13',
  },
  blue: {
    100: '#ECF1FB',
    200: '#C5D5F2',
    300: '#A3BDEB',
    400: '#7DA1E2',
    500: '#5685DA',
    600: '#2E67D1',
    700: '#2D5CB1',
    800: '#24498C',
    900: '#172F5B',
  },
  red: {
    100: '#FFEDE8',
    200: '#FFC8BC',
    300: '#FFA494',
    400: '#FF7665',
    500: '#E6564A',
    600: '#BC4338',
    700: '#A03F37',
    800: '#7D342D',
    900: '#4F231F',
  },
  orange: {
    100: '#FCF5EF',
    200: '#FFD4A8',
    300: '#FFA96E',
    400: '#FF8A46',
    500: '#FF7525',
    600: '#E0621B',
    700: '#BB4F12',
    800: '#77320B',
    900: '#331706',
  },
  pink: {
    100: '#FFF2F7',
    200: '#FFD6E8',
    300: '#FFA6CC',
    400: '#FF7DB1',
    500: '#FF66A3',
    600: '#D13880',
    700: '#99215F',
    800: '#661342',
    900: '#330A22',
  },
  brand: {
    rover:      '#00BD70',
    safety:     '#2741CC',
    catinaflat: '#F4715F',
    logoRed:    '#F31E1E',
  },
}

// ─── Semantic Color Tokens (flat) ─────────────────────────────────────────────
// Flat shape kept for backward compatibility with current screens. v1 nested
// references (e.g. `colors.text.primary`, `colors.background.primary`) are
// rewritten to flat keys when v1 files are ported.
export const colors = {
  // Text
  primary: '#1F2124',
  secondary: '#404347',
  tertiary: '#62686E',
  placeholder: '#62686E',
  navigation: '#767C82',
  success: '#1B6C42',
  successLight: '#C6E5D2',
  successBg: '#EFF7F2',
  successBgLight: '#F1FDF6',  // palette.green[100]
  errorBg: '#FBECEA',
  errorBgLight: '#FFEDE8',    // palette.red[100]
  cautionText: '#654418',     // palette.yellow[800]
  priceText: '#BB4F12',       // palette.orange[700]
  link: '#2E67D1',
  linkHover: '#24498C',       // palette.blue[800]
  white: '#FFFFFF',

  // Brand
  brand: '#00BD70',
  brandLight: '#E6F9F0',
  brandSafety: '#2741CC',

  // Surfaces
  blueLight: '#EBF1FA',
  bgSecondary: '#F4F5F6',
  bgTertiary: '#E6E8EB',
  bgContrast: '#404347',
  bgInfo: '#ECF1FB',          // palette.blue[100]
  bgAttention: '#F8B816',     // palette.yellow[400]
  destructive: '#BC4338',

  // Borders
  border: '#D7DCE0',
  borderInteractive: '#C9CFD4',
  borderError: '#BC4338',
  borderSuccess: '#1A824E',
  borderCaution: '#F8B816',
  borderContrast: '#62686E',

  // Disabled
  disabledBg: '#F4F5F6',
  disabledBorder: '#E8EBED',
  disabledText: '#9EA5AC',

  // Accent fills
  yellow100: '#FCF6EB',
  cyan100: '#E8F9FC',
  cyan200: '#8BE2EF',

  // Overlay scrim
  overlayBg: 'rgba(10,18,30,0.5)',
}

// ─── Radius / Shadows / Typography ────────────────────────────────────────────
export const radius = {
  primary: 8,
  round: 99999,
}

export const shadows = {
  low:          '0px 1px 4px 0px rgba(27,31,35,0.32)',
  medium:       '0px 2px 12px -1px rgba(27,31,35,0.24)',
  high:         '0px 8px 10px -6px rgba(27,31,35,0.22)',
  headerShadow: '0px 1px 4px 0px rgba(27,31,35,0.32)',
}

export const typography = {
  fontFamily: "'Averta', sans-serif",
  displayFamily: "'Bogart-Semibold', sans-serif",
}

// ─── Spacing scale (8-based, used by ported v1 screens) ──────────────────────
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
}

// ─── Text styles (used by ported v1 screens) ─────────────────────────────────
const averta = "'Averta', sans-serif"
const bogart = "'Bogart', sans-serif"

export const textStyles = {
  display400: { fontFamily: bogart, fontWeight: 600, fontSize: 26, lineHeight: 1.25, letterSpacing: 0 },
  display500: { fontFamily: bogart, fontWeight: 600, fontSize: 32, lineHeight: 1.25, letterSpacing: 0 },
  display600: { fontFamily: bogart, fontWeight: 600, fontSize: 38, lineHeight: 1.25, letterSpacing: 0 },

  heading100: { fontFamily: averta, fontWeight: 600, fontSize: 14, lineHeight: 1.25, letterSpacing: 0 },
  heading200: { fontFamily: averta, fontWeight: 600, fontSize: 16, lineHeight: 1.25, letterSpacing: 0 },
  heading300: { fontFamily: averta, fontWeight: 600, fontSize: 20, lineHeight: 1.25, letterSpacing: 0 },
  heading400: { fontFamily: averta, fontWeight: 600, fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.01em' },
  heading500: { fontFamily: averta, fontWeight: 600, fontSize: 32, lineHeight: 1.25, letterSpacing: '-0.01em' },
  heading600: { fontFamily: averta, fontWeight: 600, fontSize: 38, lineHeight: 1.25, letterSpacing: '-0.01em' },

  text100:    { fontFamily: averta, fontWeight: 400, fontSize: 14, lineHeight: 1.25, letterSpacing: 0 },
  text200:    { fontFamily: averta, fontWeight: 400, fontSize: 16, lineHeight: 1.5,  letterSpacing: 0 },
  text300:    { fontFamily: averta, fontWeight: 400, fontSize: 20, lineHeight: 1.2,  letterSpacing: 0 },

  text100Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 14, lineHeight: 1.25, letterSpacing: 0 },
  text200Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 16, lineHeight: 1.5,  letterSpacing: 0 },
  text300Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 20, lineHeight: 1.2,  letterSpacing: 0 },

  paragraph100: { fontFamily: averta, fontWeight: 400, fontSize: 14, lineHeight: 1.5, letterSpacing: 0 },
  paragraph200: { fontFamily: averta, fontWeight: 400, fontSize: 16, lineHeight: 1.5, letterSpacing: 0 },
  paragraph300: { fontFamily: averta, fontWeight: 400, fontSize: 20, lineHeight: 1.5, letterSpacing: 0 },

  link100:         { fontFamily: averta, fontWeight: 400, fontSize: 14, lineHeight: 1.25, letterSpacing: 0 },
  link100Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 14, lineHeight: 1.25, letterSpacing: 0 },
  link200:         { fontFamily: averta, fontWeight: 400, fontSize: 16, lineHeight: 1.25, letterSpacing: 0 },
  link200Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 16, lineHeight: 1.25, letterSpacing: 0 },
  link300:         { fontFamily: averta, fontWeight: 400, fontSize: 20, lineHeight: 1.25, letterSpacing: 0 },
  link300Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 20, lineHeight: 1.5,  letterSpacing: 0 },
  link400Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 26, lineHeight: 1.25, letterSpacing: '-0.01em' },
  link500Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 32, lineHeight: 1.25, letterSpacing: '-0.01em' },
  link600Semibold: { fontFamily: averta, fontWeight: 600, fontSize: 38, lineHeight: 1.25, letterSpacing: '-0.01em' },
}
