// Asset integrity and safe animation fallback; motion itself is tested in Chrome.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const web = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
for (const match of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
    const reference = match[1];
    if (/^(https?:|data:)/.test(reference)) continue;
    assert(fs.existsSync(path.join(web, reference)), 'Missing local reference: ' + reference);
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length);
for (const match of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(match[1]), 'Unknown anchor: ' + match[1]);
function dimensions(file) {
    const data = fs.readFileSync(path.join(web, file));
    if (data.subarray(1, 4).toString() === 'PNG') return [data.readUInt32BE(16), data.readUInt32BE(20)];
    assert(data[0] === 255 && data[1] === 216, 'Unknown raster format');
    for (let index = 2; index < data.length;) {
        if (data[index] !== 255) { index++; continue; }
        if ([192, 193, 194].includes(data[index + 1])) return [data.readUInt16BE(index + 7), data.readUInt16BE(index + 5)];
        index += 2 + data.readUInt16BE(index + 2);
    }
    throw Error('Image dimensions not found');
}
for (const file of ['home.png', 'anuncios.png', 'login.png']) assert.deepEqual(dimensions(file), [691, 1536]);
assert.deepEqual(dimensions('mapa.png'), [1080, 2400]);
assert.deepEqual(dimensions('logo.png'), [1254, 1254]);
for (const file of ['index.html', 'style.css', 'app.js', 'story.js']) {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(path.join(web, file)));
    assert(!text.includes('\uFFFD'), file + ': replacement character');
}
assert(html.includes('UB\u00cdCATE.'));
assert(html.includes('CON\u00c9CTATE.'));
for (const family of ['outfit-latin-variable', 'plus-jakarta-sans-latin-variable']) {
    const data = fs.readFileSync(path.join(web, 'fonts', family + '.woff2'));
    assert.equal(data.subarray(0, 4).toString(), 'wOF2', 'Valid local WOFF2 font');
    assert.equal(data.readUInt32BE(8), data.length, 'Complete font download');
}
for (const family of ['Outfit', 'Plus-Jakarta-Sans']) {
    assert(fs.readFileSync(path.join(web, 'fonts', family + '-OFL.txt'), 'utf8').includes('SIL OPEN FONT LICENSE Version 1.1'));
}
for (const file of ['gsap-3.15.0.min.js', 'ScrollTrigger-3.15.0.min.js']) {
    const content = fs.readFileSync(path.join(web, 'vendor', file), 'utf8');
    assert(content.includes('3.15.0'));
    assert(content.includes('@license'));
}
const controller = vm.runInNewContext(fs.readFileSync(path.join(web, 'story.js'), 'utf8') + '\ninitStory();', {
    window: {},
    document: { querySelector: () => ({ querySelector: () => ({}) }), querySelectorAll: () => [{}] }
});
assert.doesNotThrow(() => controller.setPaused(true));
assert.doesNotThrow(() => controller.setPaused(false));
console.log('PASS: local references, IDs/anchors, real JPEG/PNG dimensions, UTF-8/accents, pinned versions/licenses, no-GSAP fallback.');
