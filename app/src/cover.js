// Draws the cover: the photo panels in the chosen layout, each washed with
// the chosen grade, then the title band with the caption in Anton, the
// subtitle in neon Pacifico script, a badge ribbon, and the grain, vignette
// and halftone finish. Pure drawing: the same function paints the live
// preview and the exported PNG, so what you see is what you share.
import { GRADES } from './grades.js';
import { LAYOUTS } from './layouts.js';

const INK = '#160a24';
const PAPER = '#fff6ea';

/** A small tile of random grey noise, reused for the grain finish. */
function makeGrainTile() {
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 96);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  return tile;
}

let grainTile = null;
function grain(ctx, w, h) {
  if (!grainTile) grainTile = makeGrainTile();
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** A radial darkening toward the corners, the poster's vignette. */
function vignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const grad = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  grad.addColorStop(0, 'rgba(10, 4, 20, 0)');
  grad.addColorStop(1, 'rgba(10, 4, 20, 0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** Rows of halftone dots fading upward, for the title band. */
function halftone(ctx, x, y, w, h, color) {
  const step = Math.max(10, w / 90);
  ctx.save();
  ctx.fillStyle = color;
  for (let row = 0; row * step < h; row++) {
    const fade = 1 - (row * step) / h;
    const r = Math.max(0.6, step * 0.22 * fade);
    for (let col = 0; col * step < w; col++) {
      const cx = x + col * step + (row % 2 ? step / 2 : 0);
      const cy = y + row * step;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan. */
function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  if (!photo) return;
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const zoom = panel.zoom || 1;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const pw = iw * base;
  const ph = ih * base;
  const ox = (panel.ox || 0) * (pw - rect.w) * 0.5;
  const oy = (panel.oy || 0) * (ph - rect.h) * 0.5;
  ctx.save();
  ctx.filter = grade.filter;
  ctx.drawImage(photo, rect.x + (rect.w - pw) / 2 + ox, rect.y + (rect.h - ph) / 2 + oy, pw, ph);
  ctx.restore();
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalAlpha = grade.overlayAlpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  const shade = ctx.createLinearGradient(rect.x, rect.y + rect.h * 0.55, rect.x, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(20, 6, 32, 0)');
  shade.addColorStop(1, 'rgba(20, 6, 32, 0.35)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

/** A photo panel with its inked poster frame and a white inner edge. */
function drawPanel(ctx, photo, rect, panel, grade, border) {
  const rot = rect.rot || 0;
  const local = { x: 0, y: 0, w: rect.w, h: rect.h };
  const place = () => {
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    if (rot) ctx.rotate(rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
  };
  ctx.save();
  place();
  ctx.beginPath();
  ctx.rect(local.x, local.y, local.w, local.h);
  ctx.clip();
  if (photo) {
    drawPanelPhoto(ctx, photo, local, panel, grade);
  } else {
    const empty = ctx.createLinearGradient(local.x, local.y, local.x, local.y + local.h);
    empty.addColorStop(0, '#3a1c5c');
    empty.addColorStop(1, '#160a24');
    ctx.fillStyle = empty;
    ctx.fillRect(local.x, local.y, local.w, local.h);
    ctx.fillStyle = 'rgba(255, 246, 234, 0.55)';
    ctx.font = `bold ${Math.max(14, local.h * 0.06)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DROP A PHOTO', local.x + local.w / 2, local.y + local.h / 2);
  }
  ctx.restore();
  ctx.save();
  place();
  ctx.lineWidth = border;
  ctx.strokeStyle = INK;
  ctx.strokeRect(local.x, local.y, local.w, local.h);
  ctx.lineWidth = Math.max(1, border * 0.25);
  ctx.strokeStyle = 'rgba(255, 246, 234, 0.85)';
  ctx.strokeRect(local.x + border, local.y + border, local.w - border * 2, local.h - border * 2);
  ctx.restore();
}

/** The setting sun: a glowing disc with a horizon haze behind the panels. */
function drawSun(ctx, w, h, grade) {
  const cx = w * 0.78;
  const cy = h * 0.3;
  const r = Math.min(w, h) * 0.16;
  const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  halo.addColorStop(0, grade.accent + 'cc');
  halo.addColorStop(1, 'rgba(255, 80, 140, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffe9a8');
  disc.addColorStop(0.55, grade.accent);
  disc.addColorStop(1, grade.glow);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(22, 10, 36, 0.85)';
  for (let i = 0; i < 3; i++) {
    const y = cy + r * (0.05 + i * 0.3);
    ctx.fillRect(cx - r, y, r * 2, r * 0.07);
  }
}

/** Fits one line of Anton capitals to a width, shrinking until it fits. */
function fitAnton(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  while (ctx.measureText(text).width > maxWidth && size > 12) {
    size -= 2;
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
  }
  return size;
}

/** The caption, subtitle and badge: the poster's title block. */
function drawTitleBlock(ctx, state, grade, w, h, band) {
  const caption = (state.caption || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const badge = (state.badge || '').trim().toUpperCase();
  const bandY = h - band;
  ctx.save();
  ctx.fillStyle = INK;
  ctx.fillRect(0, bandY, w, band);
  const edge = ctx.createLinearGradient(0, bandY, 0, bandY + band * 0.3);
  edge.addColorStop(0, grade.glow + 'aa');
  edge.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, bandY, w, band * 0.3);
  if (state.halftone) halftone(ctx, w * 0.03, bandY + band * 0.62, w * 0.2, band * 0.3, grade.accent);
  ctx.textBaseline = 'alphabetic';
  if (caption) {
    const size = fitAnton(ctx, caption, w * 0.86, band * 0.52);
    const cy = bandY + band * 0.58;
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = grade.glow;
    ctx.strokeText(caption, w / 2, cy);
    ctx.fillStyle = grade.caption;
    ctx.fillText(caption, w / 2, cy);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(w / 2 - size * 1.4, cy + size * 0.16, size * 2.8, Math.max(3, size * 0.05));
  }
  if (subtitle) {
    const size = Math.max(16, band * 0.17);
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = size * 0.7;
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle, w / 2, bandY + band * 0.88);
    ctx.shadowBlur = 0;
  }
  if (badge) {
    const size = Math.max(13, band * 0.11);
    ctx.save();
    ctx.translate(w * 0.92, bandY + band * 0.28);
    ctx.rotate(0.06);
    ctx.font = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const tw = ctx.measureText(badge).width + size * 1.6;
    ctx.fillStyle = grade.accent;
    ctx.fillRect(-tw / 2, -size * 0.75, tw, size * 1.5);
    ctx.fillStyle = INK;
    ctx.fillText(badge, 0, size * 0.35);
    ctx.restore();
  }
  ctx.restore();
}

/** Draws the whole cover onto `ctx` at size w x h. */
export function drawCover(ctx, state, photos, w, h) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.nine;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const border = Math.max(4, Math.round(w * 0.006));
  ctx.save();
  ctx.fillStyle = '#1c0f2e';
  ctx.fillRect(0, 0, w, h);
  if (layout.sun) drawSun(ctx, w, h, grade);
  const rects = layout.rects(w, h);
  const panels = state.panels || [];
  rects.forEach((rect, i) => {
    const panel = panels[i] || { photo: null, zoom: 1, ox: 0, oy: 0 };
    const photo = panel.photo == null ? null : (photos[panel.photo]?.img ?? null);
    drawPanel(ctx, photo, rect, panel, grade, border);
  });
  const band = h * 0.2;
  if (layout.title === 'band') {
    drawTitleBlock(ctx, state, grade, w, h, band);
  } else {
    const overlayH = h * 0.24;
    const grad = ctx.createLinearGradient(0, h - overlayH, 0, h);
    grad.addColorStop(0, 'rgba(22, 10, 36, 0)');
    grad.addColorStop(0.45, 'rgba(22, 10, 36, 0.88)');
    grad.addColorStop(1, 'rgba(22, 10, 36, 0.96)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - overlayH, w, overlayH);
    drawTitleBlock(ctx, state, grade, w, h, overlayH);
  }
  if (state.vignette) vignette(ctx, w, h);
  if (state.grain) grain(ctx, w, h);
  ctx.restore();
}

/** A fresh default state: nine panels, Vice Sunset, square, no photos yet. */
export function defaultState() {
  return {
    layout: 'nine',
    grade: 'sunset',
    size: 'square',
    caption: 'NEON SHORE',
    subtitle: 'vice nights · golden days',
    badge: 'EST. 2026',
    grain: true,
    vignette: true,
    halftone: true,
    selected: 0,
    panels: Array.from({ length: 9 }, () => ({ photo: null, zoom: 1, ox: 0, oy: 0 })),
  };
}
