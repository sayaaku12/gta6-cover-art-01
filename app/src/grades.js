// The six colour grades: each one is a Vice City sunset or neon look a cover
// can wear. A grade tints the photos (saturation, contrast, brightness),
// then washes a two-stop gradient over them in overlay light, so the same
// photo reads warm gold in one grade and cold neon in another.
export const GRADES = {
  sunset: {
    name: 'Vice Sunset',
    filter: 'saturate(1.35) contrast(1.12) brightness(1.02)',
    top: 'rgba(255, 176, 92, 0.55)',
    bottom: 'rgba(214, 48, 130, 0.6)',
    overlayAlpha: 0.5,
    caption: '#ffffff',
    accent: '#ffb03c',
    glow: '#ff2e88',
  },
  neon: {
    name: 'Neon Nights',
    filter: 'saturate(1.5) contrast(1.18) brightness(0.96)',
    top: 'rgba(64, 224, 255, 0.5)',
    bottom: 'rgba(255, 46, 136, 0.62)',
    overlayAlpha: 0.55,
    caption: '#ffffff',
    accent: '#40e0ff',
    glow: '#ff2e88',
  },
  gold: {
    name: 'Palm Gold',
    filter: 'saturate(1.25) contrast(1.08) brightness(1.06)',
    top: 'rgba(255, 214, 120, 0.55)',
    bottom: 'rgba(180, 96, 20, 0.55)',
    overlayAlpha: 0.45,
    caption: '#fff8e6',
    accent: '#ffd678',
    glow: '#ff9a3c',
  },
  noir: {
    name: 'Teal Noir',
    filter: 'saturate(0.9) contrast(1.25) brightness(0.92)',
    top: 'rgba(32, 120, 130, 0.5)',
    bottom: 'rgba(8, 12, 34, 0.65)',
    overlayAlpha: 0.5,
    caption: '#eaf6ff',
    accent: '#7fe7d4',
    glow: '#2dd4bf',
  },
  candy: {
    name: 'Cotton Candy',
    filter: 'saturate(1.45) contrast(1.05) brightness(1.05)',
    top: 'rgba(255, 150, 210, 0.55)',
    bottom: 'rgba(140, 90, 255, 0.6)',
    overlayAlpha: 0.5,
    caption: '#ffffff',
    accent: '#ff96d2',
    glow: '#c084fc',
  },
  haze: {
    name: 'Heat Haze',
    filter: 'saturate(1.1) contrast(1.05) brightness(1.08)',
    top: 'rgba(255, 220, 160, 0.4)',
    bottom: 'rgba(255, 110, 90, 0.45)',
    overlayAlpha: 0.4,
    caption: '#fffdf5',
    accent: '#ffdca0',
    glow: '#ff6e5a',
  },
};

/** The grade ids in the order the editor shows them. */
export const GRADE_IDS = Object.keys(GRADES);
