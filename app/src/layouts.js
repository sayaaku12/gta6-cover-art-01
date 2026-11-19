// The cover layouts: where the photo panels sit on the page. Every layout
// returns its panel rectangles as fractions of the cover (x, y, w, h in
// 0..1), plus where the title band goes and whether a sun disc is drawn.
// `panels` is the count of photo panels the layout uses.
export const LAYOUTS = {
  nine: {
    name: 'Nine Panel',
    panels: 9,
    title: 'band',
    sun: false,
    rects(w, h) {
      const gap = Math.round(w * 0.012);
      const band = 0.2;
      const top = h * (1 - band);
      const cw = (w - gap * 4) / 3;
      const ch = (top - gap * 4) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({
            x: gap + c * (cw + gap),
            y: gap + r * (ch + gap),
            w: cw,
            h: ch,
          });
        }
      }
      return out;
    },
  },
  six: {
    name: 'Six Panel',
    panels: 6,
    title: 'band',
    sun: false,
    rects(w, h) {
      const gap = Math.round(w * 0.014);
      const band = 0.22;
      const top = h * (1 - band);
      const cw = (w - gap * 4) / 3;
      const ch = (top - gap * 3) / 2;
      const out = [];
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          out.push({
            x: gap + c * (cw + gap),
            y: gap + r * (ch + gap),
            w: cw,
            h: ch,
          });
        }
      }
      return out;
    },
  },
  four: {
    name: 'Four Panel',
    panels: 4,
    title: 'band',
    sun: true,
    rects(w, h) {
      const gap = Math.round(w * 0.016);
      const band = 0.22;
      const top = h * (1 - band);
      const cw = (w - gap * 3) / 2;
      const ch = (top - gap * 3) / 2;
      return [
        { x: gap, y: gap, w: cw, h: ch },
        { x: gap * 2 + cw, y: gap, w: cw, h: ch },
        { x: gap, y: gap * 2 + ch, w: cw, h: ch },
        { x: gap * 2 + cw, y: gap * 2 + ch, w: cw, h: ch },
      ];
    },
  },
  hero: {
    name: 'Hero + Three',
    panels: 4,
    title: 'overlay',
    sun: true,
    rects(w, h) {
      const gap = Math.round(w * 0.014);
      const heroH = h * 0.62;
      const stripY = heroH + gap;
      const stripH = h - stripY - gap;
      const cw = (w - gap * 4) / 3;
      return [
        { x: gap, y: gap, w: w - gap * 2, h: heroH },
        { x: gap, y: stripY, w: cw, h: stripH },
        { x: gap * 2 + cw, y: stripY, w: cw, h: stripH },
        { x: gap * 3 + cw * 2, y: stripY, w: cw, h: stripH },
      ];
    },
  },
  bleed: {
    name: 'Full Bleed',
    panels: 1,
    title: 'overlay',
    sun: true,
    rects(w, h) {
      return [{ x: 0, y: 0, w, h }];
    },
  },
  tilted: {
    name: 'Tilted Snapshots',
    panels: 3,
    title: 'band',
    sun: false,
    tilt: true,
    rects(w, h) {
      const band = 0.2;
      const top = h * (1 - band);
      const pw = w * 0.42;
      const ph = top * 0.72;
      const cx = w / 2;
      const cy = top * 0.48;
      return [
        { x: cx - pw * 0.72, y: cy - ph * 0.62, w: pw, h: ph, rot: -0.09 },
        { x: cx - pw * 0.28, y: cy - ph * 0.5, w: pw, h: ph, rot: 0.07 },
        { x: cx - pw * 0.5, y: cy - ph * 0.28, w: pw, h: ph, rot: -0.02 },
      ];
    },
  },
};

/** The layout ids in the order the editor shows them. */
export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** The three post sizes the cover exports at. */
export const SIZES = {
  square: { name: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { name: 'Story · 1080 × 1350', w: 1080, h: 1350 },
  wide: { name: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

export const SIZE_IDS = Object.keys(SIZES);
