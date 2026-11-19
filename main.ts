// Sunset Cover Lab, a gta6-cover-art-01 entry (Node 22, standard library
// only). The program hands the app in: it copies this repository's app/ and
// screenshots/ beside this file to /output and writes /output/dossier.json,
// the summary the judge reads, with the vendored make.fun library. Outside
// the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The app first: every static file under app/, as the browser serves it.
if (!existsSync(join(repo, 'app', 'index.html'))) {
  console.error('main.ts: app/index.html is missing, nothing to hand in');
  process.exit(1);
}
mkdirSync(out, { recursive: true });
cpSync(join(repo, 'app'), join(out, 'app'), { recursive: true });

// Then the screenshots, if the maker has taken them.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(repo, 'screenshots'))) {
  cpSync(join(repo, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The dossier the gate and the judge read, with the same limits the gate
// enforces: the dossier text at most 160 KiB, at most 4 screenshots of at
// most 256 KiB each, app/ at most 993 entries and 48 MiB, each app/ path at
// most 1000 bytes. An entry over any of those is refused by the scorer, so
// the program refuses it here first.
let dossier;
try {
  dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
} catch (err) {
  console.error(`main.ts: the entry fails the gate limits: ${err.message}`);
  process.exit(1);
}
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`main.ts: wrote ${join(out, 'dossier.json')} (${dossier.length} bytes)`);
