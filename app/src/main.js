// Wires the editor: photos in, layout and grade picked, words typed, panels
// dragged, PNGs out. One state object drives the live preview; every change
// pushes an undo step, and the same drawCover paints the preview and the
// exported file, so the PNG is exactly what the preview showed. A `?shot=`
// query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, defaultState } from './cover.js';
import { GRADES, GRADE_IDS } from './grades.js';
import { LAYOUTS, LAYOUT_IDS, SIZES, SIZE_IDS } from './layouts.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

const CAPTIONS = ['NEON SHORE', 'SUNSET HEIST', 'PALM ROYALE', 'NIGHT SHIFT', 'VICE LIGHTS', 'PIER PRESSURE', 'GOLDEN HOUR', 'BOULEVARD QUEEN'];
const SUBTITLES = ['vice nights · golden days', 'chase the sunset', 'neon never sleeps', 'golden hour gang', 'salt air & street lights', 'drive into the glow'];

let state = defaultState();
let photos = [];
let history = [];
let future = [];
let drag = null;
let pickedPhoto = null;
let pendingBefore = null;

/** A snapshot of the state without the images, for undo and redo. */
function snapshot() {
  return JSON.stringify(state);
}

/** Marks the start of a live edit (typing, dragging a slider): the state
 * before it is the step undo returns to. */
function beginEdit() {
  if (pendingBefore === null) pendingBefore = snapshot();
}

/** Closes a live edit started by beginEdit, pushing its before-state. */
function endEdit() {
  if (pendingBefore === null) return;
  history.push(pendingBefore);
  pendingBefore = null;
  if (history.length > 50) history.shift();
  future = [];
  syncUndoButtons();
}

function restore(json) {
  state = JSON.parse(json);
  syncControls();
  render();
}

function pushHistory() {
  history.push(snapshot());
  if (history.length > 50) history.shift();
  future = [];
  syncUndoButtons();
}

function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  syncUndoButtons();
}

function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  syncUndoButtons();
}

function syncUndoButtons() {
  $('undo').disabled = !history.length;
  $('redo').disabled = !future.length;
}

/** Paints the preview at the chosen export size. */
function render() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  canvas.classList.toggle('wide', state.size === 'wide');
  drawCover(ctx, state, photos, size.w, size.h);
  syncPanelControls();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  photos.push({ name: file.name, img, url });
  return photos.length - 1;
}

async function loadSamples() {
  for (const name of ['boulevard', 'pier']) {
    if (photos.some((p) => p.name === name + '.jpg')) continue;
    const img = await loadImage(`samples/${name}.jpg`);
    photos.push({ name: name + '.jpg', img, url: `samples/${name}.jpg` });
  }
  renderStrip();
}

/** The photo strip: click a photo to arm it, then click a panel. */
function renderStrip() {
  const strip = $('strip');
  strip.innerHTML = '';
  photos.forEach((p, i) => {
    const thumb = document.createElement('img');
    thumb.src = p.url;
    thumb.alt = p.name;
    thumb.title = p.name;
    if (pickedPhoto === i) thumb.classList.add('on');
    thumb.addEventListener('click', () => {
      pickedPhoto = i;
      pushHistory();
      state.panels[state.selected].photo = i;
      state.panels[state.selected].zoom = 1;
      state.panels[state.selected].ox = 0;
      state.panels[state.selected].oy = 0;
      renderStrip();
      render();
    });
    strip.appendChild(thumb);
  });
}

/** Puts the same photo in every panel of the current layout. */
function fillAllPanels() {
  if (!photos.length) return;
  pushHistory();
  const layout = LAYOUTS[state.layout];
  const idx = pickedPhoto ?? 0;
  for (let i = 0; i < layout.panels; i++) {
    state.panels[i].photo = idx;
    state.panels[i].zoom = 1;
    state.panels[i].ox = 0;
    state.panels[i].oy = 0;
  }
  render();
}

/** The layout chips, grade swatches and size chips. */
function buildPickers() {
  const layouts = $('layouts');
  LAYOUT_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = LAYOUTS[id].name;
    b.dataset.id = id;
    b.addEventListener('click', () => {
      if (state.layout === id) return;
      pushHistory();
      state.layout = id;
      state.selected = 0;
      syncPickers();
      render();
    });
    layouts.appendChild(b);
  });
  const grades = $('grades');
  GRADE_IDS.forEach((id) => {
    const g = GRADES[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.id = id;
    b.title = g.name;
    b.style.background = `linear-gradient(135deg, ${g.top}, ${g.bottom})`;
    const label = document.createElement('span');
    label.textContent = g.name;
    b.appendChild(label);
    b.addEventListener('click', () => {
      if (state.grade === id) return;
      pushHistory();
      state.grade = id;
      syncPickers();
      render();
    });
    grades.appendChild(b);
  });
  const sizes = $('sizes');
  SIZE_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = SIZES[id].name;
    b.dataset.id = id;
    b.addEventListener('click', () => {
      if (state.size === id) return;
      pushHistory();
      state.size = id;
      syncPickers();
      render();
    });
    sizes.appendChild(b);
  });
}

function syncPickers() {
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('on', b.dataset.id === state.layout);
  });
  document.querySelectorAll('#grades .swatch').forEach((b) => {
    b.classList.toggle('on', b.dataset.id === state.grade);
  });
  document.querySelectorAll('#sizes button').forEach((b) => {
    b.classList.toggle('on', b.dataset.id === state.size);
  });
}

/** The selected-panel sliders follow the selected panel. */
function syncPanelControls() {
  const layout = LAYOUTS[state.layout];
  const panel = state.panels[state.selected];
  $('selectedLabel').textContent =
    `Panel ${state.selected + 1} of ${layout.panels}` +
    (panel.photo == null ? ' — empty' : ` — ${photos[panel.photo]?.name ?? ''}`);
  $('zoom').value = Math.round((panel.zoom || 1) * 100);
  $('zoomVal').textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
  $('ox').value = Math.round((panel.ox || 0) * 100);
  $('oy').value = Math.round((panel.oy || 0) * 100);
}

function syncControls() {
  $('caption').value = state.caption;
  $('subtitle').value = state.subtitle;
  $('badge').value = state.badge;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('halftone').checked = state.halftone;
  syncPickers();
  renderStrip();
}

/** The panel under a point on the canvas, in canvas pixels. */
function panelAt(x, y) {
  const size = SIZES[state.size];
  const layout = LAYOUTS[state.layout];
  const rects = layout.rects(size.w, size.h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    const pad = layout.tilt ? Math.max(r.w, r.h) * 0.12 : 0;
    if (x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad) return i;
  }
  return -1;
}

function canvasPoint(e) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - box.left) / box.width) * canvas.width,
    y: ((e.clientY - box.top) / box.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i < 0) return;
  state.selected = i;
  const panel = state.panels[i];
  if (pickedPhoto != null && panel.photo !== pickedPhoto) {
    pushHistory();
    panel.photo = pickedPhoto;
    panel.zoom = 1;
    panel.ox = 0;
    panel.oy = 0;
    render();
    return;
  }
  if (panel.photo != null) {
    drag = { panel: i, startX: p.x, startY: p.y, ox: panel.ox || 0, oy: panel.oy || 0, moved: false, before: snapshot() };
    canvas.setPointerCapture(e.pointerId);
  }
  render();
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[drag.panel];
  const size = SIZES[state.size];
  const rect = LAYOUTS[state.layout].rects(size.w, size.h)[drag.panel];
  const dx = (p.x - drag.startX) / rect.w;
  const dy = (p.y - drag.startY) / rect.h;
  if (Math.abs(dx) + Math.abs(dy) > 0.005) drag.moved = true;
  panel.ox = Math.max(-1, Math.min(1, drag.ox + dx * 2));
  panel.oy = Math.max(-1, Math.min(1, drag.oy + dy * 2));
  render();
});

canvas.addEventListener('pointerup', () => {
  if (drag && drag.moved) {
    history.push(drag.before);
    if (history.length > 50) history.shift();
    future = [];
    syncUndoButtons();
  }
  drag = null;
});

/** Exports the current cover at one size and downloads the PNG. */
export function exportCover(sizeId) {
  return new Promise((resolve) => {
    const size = SIZES[sizeId];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    drawCover(off.getContext('2d'), state, photos, size.w, size.h);
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob);
    }, 'image/png');
  });
}

$('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  for (const file of files) await addPhotoFile(file);
  pickedPhoto = photos.length - 1;
  pushHistory();
  state.panels[state.selected].photo = pickedPhoto;
  renderStrip();
  render();
  e.target.value = '';
});
$('samples').addEventListener('click', async () => {
  await loadSamples();
  pickedPhoto = 0;
  pushHistory();
  for (let i = 0; i < LAYOUTS[state.layout].panels; i++) {
    state.panels[i].photo = i % photos.length;
  }
  renderStrip();
  render();
});
$('fillall').addEventListener('click', fillAllPanels);
$('caption').addEventListener('input', (e) => { beginEdit(); state.caption = e.target.value; render(); });
$('caption').addEventListener('change', endEdit);
$('subtitle').addEventListener('input', (e) => { beginEdit(); state.subtitle = e.target.value; render(); });
$('subtitle').addEventListener('change', endEdit);
$('badge').addEventListener('input', (e) => { beginEdit(); state.badge = e.target.value; render(); });
$('badge').addEventListener('change', endEdit);
$('grain').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; render(); });
$('vignette').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; render(); });
$('halftone').addEventListener('change', (e) => { pushHistory(); state.halftone = e.target.checked; render(); });
$('zoom').addEventListener('input', (e) => {
  beginEdit();
  state.panels[state.selected].zoom = Number(e.target.value) / 100;
  render();
});
$('zoom').addEventListener('change', endEdit);
$('ox').addEventListener('input', (e) => {
  beginEdit();
  state.panels[state.selected].ox = Number(e.target.value) / 100;
  render();
});
$('ox').addEventListener('change', endEdit);
$('oy').addEventListener('input', (e) => {
  beginEdit();
  state.panels[state.selected].oy = Number(e.target.value) / 100;
  render();
});
$('oy').addEventListener('change', endEdit);
$('clearPanel').addEventListener('click', () => {
  pushHistory();
  state.panels[state.selected] = { photo: null, zoom: 1, ox: 0, oy: 0 };
  render();
});
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
$('surprise').addEventListener('click', async () => {
  if (!photos.length) await loadSamples();
  pushHistory();
  state.layout = LAYOUT_IDS[Math.floor(Math.random() * LAYOUT_IDS.length)];
  state.grade = GRADE_IDS[Math.floor(Math.random() * GRADE_IDS.length)];
  state.caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
  state.subtitle = SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)];
  const count = LAYOUTS[state.layout].panels;
  for (let i = 0; i < count; i++) {
    state.panels[i].photo = Math.floor(Math.random() * photos.length);
    state.panels[i].zoom = 1 + Math.random() * 0.4;
    state.panels[i].ox = (Math.random() - 0.5) * 0.6;
    state.panels[i].oy = (Math.random() - 0.5) * 0.6;
  }
  state.selected = 0;
  syncControls();
  render();
});
$('export').addEventListener('click', async () => {
  await exportCover(state.size);
  $('status').textContent = `Saved cover-${SIZES[state.size].w}x${SIZES[state.size].h}.png`;
});
$('exportAll').addEventListener('click', async () => {
  for (const id of SIZE_IDS) {
    await exportCover(id);
    $('status').textContent = `Saved cover-${SIZES[id].w}x${SIZES[id].h}.png`;
    await new Promise((r) => setTimeout(r, 150));
  }
  $('status').textContent = 'Saved all 3 sizes.';
});

buildPickers();
syncPickers();
syncUndoButtons();

/** Debug hook: the live state as JSON (panels, photo names), for tests. */
window.__labState = () => JSON.stringify({
  layout: state.layout,
  grade: state.grade,
  size: state.size,
  panels: state.panels.map((p) => p.photo),
  photos: photos.map((p) => p.name),
});

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, {
    loadSamples,
    setState(patch) {
      Object.assign(state, patch);
      syncControls();
    },
    render,
    ready() {
      render();
    },
  });
} else {
  render();
}
