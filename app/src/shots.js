// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the cover alone, full viewport.
// `layout`, `grade`, `size`, `caption` and `subtitle` come from the query.
// window.__shotReady is set once the fonts are in and the cover is painted.
export async function runShot(shot, query, lab) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await lab.loadSamples();
  const patch = {
    layout: query.get('layout') || 'nine',
    grade: query.get('grade') || 'sunset',
    size: query.get('size') || (shot === 'cover' ? 'wide' : 'square'),
    caption: query.get('caption') || 'NEON SHORE',
    subtitle: query.get('subtitle') || 'vice nights · golden days',
    badge: query.get('badge') || 'EST. 2026',
  };
  lab.setState(patch);
  const photos = [0, 1];
  const panels = [];
  const count = { nine: 9, six: 6, four: 4, hero: 4, bleed: 1, tilted: 3 }[patch.layout] || 9;
  for (let i = 0; i < 9; i++) {
    panels.push({
      photo: i < count ? photos[i % photos.length] : null,
      zoom: 1 + (i % 3) * 0.12,
      ox: ((i % 3) - 1) * 0.15,
      // The hero panel's photo sits low, so its subject's face stays in frame.
      oy: i === 0 && patch.layout === 'hero' ? 0.3 : ((i % 2) - 0.5) * 0.2,
    });
  }
  lab.setState({ panels, selected: 0 });
  lab.render();
  try {
    await document.fonts.ready;
  } catch {
    // Fonts are local files; if the ready promise fails, paint anyway.
  }
  lab.render();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
