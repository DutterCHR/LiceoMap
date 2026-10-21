// Scoped preservation of the approved cinema, loader, demo and administration.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const web = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(web, file), 'utf8').replace(/\r\n/g, '\n');
const html = read('index.html'), app = read('app.js'), css = read('style.css');
// Phase 5.1 permits only the explicit connection changes below. The original
// fixture remains immutable; any other change to the phone controller still fails.
let story = read('story.js');
if (process.argv.includes('--phase51-integrity')) story = story
    .replace('((index * 2 + 1.4) / timeline.duration())', '((index * 2 + 1.4) / 10)')
    .replace("const index = timeline.time() >= 10.5 ? -1 : Math.min(4, Math.floor((timeline.time() + .08) / 2));", "const index = Math.min(4, Math.floor((timeline.time() + .08) / 2));")
    .replace("story.dataset.scene = index < 0 ? 'proyecto' : panels[index].id;", "story.dataset.scene = panels[index].id;")
    .replace('                    if (index < 0) return;\n', '');
const parts = {
    story,
    loaderHTML: html.slice(html.indexOf('    <!-- Phase 4.5:'), html.indexOf('    <!-- /Phase 4.5 -->')),
    cinemaHTML: html.slice(html.indexOf('    <div class="story"'), html.indexOf('    <section class="project-section"') > 0
        ? html.indexOf('    <section class="project-section"') : html.indexOf('    <!-- Phase 5:')),
    demoFooterAdminHTML: html.slice(html.indexOf('    <section class="app-preview-section"')).replaceAll('href="#mapa-container">Mapa Interactivo', 'href="#proyecto">El proyecto'),
    entryLoaderNavigationJS: app.slice(0, app.indexOf('const mapStatus') > 0 ? app.indexOf('const mapStatus') : app.indexOf('const adminModal')),
    adminAndFormsJS: app.slice(app.indexOf('const adminModal')),
    cinemaCSS: css.slice(0, css.indexOf('.project-section,') > 0 ? css.indexOf('.project-section,') : css.indexOf('/* Phase 5:')),
    adminAndFormsCSS: css.slice(css.indexOf('/* Preserved student form controls. */')).replace(/\.map-status \{[^}]*\}\n?/g, '')
};
for (const file of ['app-admin.js', 'mapa.png', 'home.png', 'anuncios.png', 'login.png', 'logo.png',
    'fonts/outfit-latin-variable.woff2', 'fonts/plus-jakarta-sans-latin-variable.woff2']) parts[file] = fs.readFileSync(path.join(web, file));
const hashes = Object.fromEntries(Object.entries(parts).map(([name, source]) => [name, crypto.createHash('sha256').update(source).digest('hex')]));
const fixture = path.join(__dirname, 'fixtures/phase5-integrity.json');
if (process.argv.includes('--record-phase5')) fs.writeFileSync(fixture, JSON.stringify(hashes, null, 2) + '\n');
else assert.deepEqual(hashes, JSON.parse(fs.readFileSync(fixture, 'utf8')), 'Approved cinematic experience and administrative/demo code preserved');
console.log('PASS: phase 5 scoped preservation of cinema, loader, navigation logic, administration, RUT, captures and fonts.');
