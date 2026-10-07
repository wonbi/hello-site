// Copies the web games into app/www so Capacitor can bundle them into the APK.
// Three.js is vendored from node_modules so the games run without a network.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..');
const out = join(here, 'www');

// slug -> source page in the repo
const GAMES = {
  gyeongsin: 'game/index.html',
  songpyeon: 'game/songpyeon/index.html',
  gungnae: 'game/gungnae/index.html',
  'shadow-harvester': 'game/shadow-harvester/index.html',
};

const CDN = [
  ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', '../../vendor/three.r128.min.js'],
  ['https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js', '../../vendor/three.module.js'],
];

// Android back button: inside a game, ask before leaving to the launcher.
const BACK = `<script>(function(){var C=window.Capacitor,A=C&&C.Plugins&&C.Plugins.App;if(!A)return;
A.addListener('backButton',function(){if(confirm('게임을 나가 메인 화면으로 갈까요?'))location.href='/index.html';});})();</script>`;

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'vendor'), { recursive: true });
cpSync(join(here, 'node_modules/three-r128/build/three.min.js'), join(out, 'vendor/three.r128.min.js'));
cpSync(join(here, 'node_modules/three/build/three.module.js'), join(out, 'vendor/three.module.js'));
cpSync(join(here, 'launcher.html'), join(out, 'index.html'));

for (const [slug, src] of Object.entries(GAMES)) {
  let html = readFileSync(join(repo, src), 'utf8');
  for (const [url, local] of CDN) html = html.split(url).join(local);
  if (/https:\/\/(cdnjs|cdn\.jsdelivr|unpkg)/.test(html)) {
    throw new Error(`${src} still loads a script from a CDN; add it to CDN in build-www.mjs`);
  }
  html = html.replace(/<\/body>/i, `${BACK}\n</body>`);
  mkdirSync(join(out, 'games', slug), { recursive: true });
  writeFileSync(join(out, 'games', slug, 'index.html'), html);
}

console.log(`www ready: ${Object.keys(GAMES).length} games`);
