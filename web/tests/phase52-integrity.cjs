const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');
const web=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(web,file),'utf8').replace(/\r\n/g,'\n');
const html=read('index.html'),app=read('app.js'),purpose=read('purpose.js');
const parts={story:read('story.js'),baseCSS:read('style.css'),loader:html.slice(html.indexOf('    <!-- Phase 4.5:'),html.indexOf('    <!-- /Phase 4.5 -->')),cinema:html.slice(html.indexOf('    <div class="story"'),html.indexOf('    <!-- Phase 5:')),footerAdmin:html.slice(html.indexOf('    </main>')),entryAdmin:app.slice(0,app.indexOf('function rutVerifier')),validators:app.slice(app.indexOf('function rutVerifier'),app.indexOf('studentDemoForm?.addEventListener')),adminForms:app.slice(app.indexOf("document.querySelectorAll('.demo-form')")),phoneBridge:purpose.slice(purpose.indexOf('                sequence.to(viewport.querySelectorAll'),purpose.indexOf("                sequence.to(intro.querySelector('.purpose-intro-bottom')"))};
const hashes=Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,crypto.createHash('sha256').update(v).digest('hex')]));
assert.deepEqual(hashes,JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/phase52-integrity.json'),'utf8')),'Phase 5.1 protected scopes remain unchanged');
console.log('PASS: approved phone story/flight, base CSS, loader, navigation, full admin, footer and RUT validators preserved.');
