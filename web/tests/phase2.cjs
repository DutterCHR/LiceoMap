// Cinematic landing regression, through phase 5. Run: node web/tests/phase2.cjs
// Uses installed Chrome/Edge (or CHROME_PATH), Node 22+, no npm dependencies.
// External requests are blocked: this checks local UI and offline fallbacks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

const web = path.resolve(__dirname, '..');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    console.log('Checking UTF-8 and launching isolated browser...');
    for (const name of ['index.html', 'style.css', 'purpose.css', 'finale.css', 'app.js', 'story.js', 'purpose.js', 'finale.js']) {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(path.join(web, name)));
        assert(!text.includes('\uFFFD'), name + ': replacement character');
    }
    const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
    assert(html.includes('<span>UB\u00cdCATE.</span>'));
    assert(html.includes('<span>CON\u00c9CTATE.</span>'));
    assert(html.includes('Saltar introducci\u00f3n'));
    const binary = [process.env.CHROME_PATH,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    ].find(file => file && fs.existsSync(file));
    assert(binary, 'Set CHROME_PATH to an installed Chrome/Edge binary');
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'liceomap-phase2-'));
    const browser = spawn(binary, ['--headless=new', '--no-first-run', '--no-default-browser-check',
        '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
        '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    browser.stderr.on('data', chunk => { stderr += chunk; });
    let ws;
    try {
        const portFile = path.join(profile, 'DevToolsActivePort');
        let port;
        for (let attempt = 0; attempt < 60; attempt++) {
            if (browser.exitCode !== null) throw Error('Browser exited: ' + stderr);
            try {
                const lines=fs.readFileSync(portFile,'utf8').trim().split(/\r?\n/);
                if(/^\d+$/.test(lines[0]) && lines[1]?.startsWith('/devtools/')) { port=lines[0]; break; }
            } catch(error) {
                // Chrome can briefly hold its own port file locked while writing on Windows.
                if(!['ENOENT','EBUSY','EPERM'].includes(error.code)) throw error;
            }
            await wait(100);
        }
        assert(port, 'Browser did not publish its port: ' + stderr);
        const pages = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
        console.log('Connecting to browser...');
        ws = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
            const timer=setTimeout(()=>reject(Error('Chrome CDP connection timed out: '+stderr)),10000);
            ws.addEventListener('open', () => {clearTimeout(timer);resolve();}, { once: true });
            ws.addEventListener('error', event => {clearTimeout(timer);reject(Error('Chrome CDP connection failed: '+(event.message||'')+' '+stderr));}, { once: true });
            ws.addEventListener('close', () => {clearTimeout(timer);reject(Error('Chrome CDP connection closed: '+stderr));}, { once: true });
        });
        let id = 0;
        const pending = new Map(), errors = [];
        ws.addEventListener('message', ({ data }) => {
            const message = JSON.parse(data);
            if (message.id) {
                const request = pending.get(message.id);
                if (!request) return;
                clearTimeout(request.timer);
                pending.delete(message.id);
                if (message.error) request.reject(Error(JSON.stringify(message.error)));
                else request.resolve(message.result);
            }
            if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
        });
        const call = (method, params = {}) => new Promise((resolve, reject) => {
            const next = ++id;
            const timer=setTimeout(()=>{pending.delete(next);reject(Error('Chrome CDP timed out: '+method+' '+stderr));},method==='Runtime.evaluate'?120000:30000);
            pending.set(next, { resolve, reject, timer });
            ws.send(JSON.stringify({ id: next, method, params }));
        });
        ws.addEventListener('close', () => {
            for (const request of pending.values()) {clearTimeout(request.timer);request.reject(Error('Chrome CDP closed: '+stderr));}
            pending.clear();
        });
        const evaluate = async expression => {
            const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
            assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
            return result.result.value;
        };
        const until = async (predicate, label) => {
            const deadline = Date.now() + 15000;
            while (!await predicate()) {
                if(Date.now()>=deadline && label.includes('entry')) console.log('Entry diagnostic:',await evaluate(`({
                    events:window.__entryEvents,probe:window.__phase44,scrollY,hidden:document.hidden,
                    introHidden:document.querySelector('#app-preloader').hidden,
                    progress:ScrollTrigger.getById('liceomap-cinema')?.progress})`));
                assert(Date.now() < deadline, 'Timed out: ' + label);
                await wait(100);
            }
        };
        const navigate = async (scripts = true) => {
            await call('Page.navigate', { url: pathToFileURL(path.join(web, 'index.html')).href });
            await wait(500);
            await until(() => evaluate("document.readyState === 'complete'" +
                (scripts ? " && typeof initCinematicIntro === 'function'" : '')), 'local page ready');
        };
        const verifyFonts = async () => {
            await evaluate('document.fonts.ready');
            const fonts=await evaluate("[...document.fonts].map(font=>({family:font.family,status:font.status}))");
            for(const family of ['Outfit','Plus Jakarta Sans']) assert(fonts.some(font=>font.family.includes(family) && font.status==='loaded'),'Local font loaded: '+family);
            const root=await call('DOM.getDocument');
            for(const [selector,family] of [['#hero-title .headline-line','Outfit'],['.hero .scene-lead','Plus Jakarta Sans']]){
                const node=await call('DOM.querySelector',{nodeId:root.root.nodeId,selector});
                const result=await call('CSS.getPlatformFontsForNode',{nodeId:node.nodeId});
                assert(result.fonts.some(font=>font.isCustomFont && font.familyName.includes(family) && font.glyphCount>0),'Actual rendered typeface: '+family);
            }
        };
        const state = () => evaluate(`({
            hidden: document.querySelector('#app-preloader').hidden,
            animations: document.querySelector('.hero-phone').getAnimations({subtree:true})
                .filter(a => a.playState !== 'finished').map(a => a.playState),
            width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            image: document.querySelector('.phone-screen img').naturalWidth,
            phone: document.querySelector('.hero-phone').getBoundingClientRect().toJSON()
        })`);
        const screenshot = async name => {
            const file = path.join(profile, name + '.png');
            fs.writeFileSync(file, Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
            console.log('Screenshot: ' + file);
        };
        await call('Page.enable');
        await call('Page.bringToFront');
        await call('Emulation.setFocusEmulationEnabled', { enabled: true });
        console.log('Checking desktop transition...');
        await call('Runtime.enable');
        await call('DOM.enable');
        await call('CSS.enable');
        await call('Network.enable');
        await call('Network.setBlockedURLs', { urls: ['https://*', 'http://*'] });
        if(process.argv.includes('--phase53-motion')) {
            await require('./phase53-motion.cjs')({call,evaluate,navigate,until,screenshot,profile,web});
            assert.deepEqual(errors, []);
            await call('Browser.close');
            return;
        }
        if(process.argv.includes('--phase53') || process.argv.includes('--phase53-baseline')) {
            await require('./phase53.cjs')({call,evaluate,navigate,until,screenshot,profile,web,
                baseline:process.argv.includes('--phase53-baseline')});
            assert.deepEqual(errors, []);
            await call('Browser.close');
            return;
        }
        if(process.argv.includes('--phase52')) {
            require('./phase52-integrity.cjs');
            await require('./phase52.cjs')({call,evaluate,navigate,until,screenshot,profile,web});
            assert.deepEqual(errors, []);
            await call('Browser.close');
            return;
        }
        if(process.argv.includes('--phase53-regression')) {
            await require('./phase52.cjs')({call,evaluate,navigate,until,screenshot,profile,web,reviewDirectory:'phase53/regression'});
            assert.deepEqual(errors, []);
        }
        if(process.argv.includes('--phase51-record') || process.argv.includes('--phase51') || process.argv.includes('--phase5')) {
            await require('./phase51.cjs')({call,evaluate,navigate,until,screenshot,profile,web,record:process.argv.includes('--phase51-record')});
            assert.deepEqual(errors, []);
            await call('Browser.close');
            return;
        }
        if(process.argv.includes('--phase45-diagnose') || process.argv.includes('--phase45-verify')) {
            await require('./phase45.cjs')({call,evaluate,navigate,until,screenshot,profile,web,
                diagnose:process.argv.includes('--phase45-diagnose')});
            assert.deepEqual(errors, []);
            await call('Browser.close');
            return;
        }
        if(process.argv.includes('--phase44-baseline') || process.argv.includes('--phase44-verify')) {
            await require('./phase44.cjs')({call,evaluate,navigate,until,screenshot,profile,web,
                baseline:process.argv.includes('--phase44-baseline')});
            await call('Browser.close');
            return;
        }
        if (process.argv.includes('--composition')) {
            const report = [];
            const motion = [];
            const sizes=process.argv.includes('--tablet') ? [
                {width:1024,height:900,deviceScaleFactor:1,mobile:false},
                {width:1100,height:720,deviceScaleFactor:1,mobile:false}
            ] : [
                {width:1280,height:720,deviceScaleFactor:1,mobile:false},
                {width:1440,height:900,deviceScaleFactor:2,mobile:false},
                {width:390,height:844,deviceScaleFactor:2,mobile:true},
                {width:320,height:720,deviceScaleFactor:2,mobile:true},
                ...(process.argv.includes('--all-sizes') ? [
                    {width:1024,height:900,deviceScaleFactor:1,mobile:false},
                    {width:1100,height:720,deviceScaleFactor:1,mobile:false}
                ] : [])
            ];
            const requestedWidth=process.argv.find(argument=>argument.startsWith('--viewport='))?.split('=')[1];
            for (const size of sizes.filter(size=>!requestedWidth || String(size.width)===requestedWidth)) {
                await call('Emulation.setDeviceMetricsOverride', size);
                await navigate();
                await verifyFonts();
                await evaluate("document.querySelector('.intro-skip').click()");
                await evaluate("Promise.all([...document.querySelectorAll('.screen-layer')].map(image=>image.decode()))");
                for (const [index, time] of [1,3.45,5.45,7.45,9.3].entries()) {
                    await evaluate(`(() => {const t=ScrollTrigger.getById('liceomap-cinema');window.scrollTo({top:t.start+${time}/t.animation.duration()*(t.end-t.start),behavior:'instant'});})()`);
                    await evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));while(ScrollTrigger.getAll().some(t=>t.getTween()?.isActive?.()))await new Promise(requestAnimationFrame);})()`);
                    const result = await evaluate(`(() => {
                        const box=el=>el.getBoundingClientRect().toJSON();
                        const visible=el=>el && getComputedStyle(el).visibility!=='hidden' && Number(getComputedStyle(el).opacity)>.95;
                        const phone=document.querySelector('.phone-story');
                        const panel=document.querySelectorAll('.story-scene')[${index}];
                        const image=[...document.querySelectorAll('.screen-layer')].sort((a,b)=>Number(getComputedStyle(b).opacity)-Number(getComputedStyle(a).opacity))[0];
                        const essential=[...panel.querySelectorAll('.headline-line,.scene-lead,.story-card,.eyebrow')].filter(visible);
                        const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
                        const rect=box(phone);
                        const controls=box(document.querySelector('.cinema-controls'));
                        const exit=box(document.querySelector('.cinema-exit'));
                        const nav=box(document.querySelector('.navbar'));
                        const plan=document.querySelector('.closing-map');
                        const planOverlaps=${index}===4 && visible(plan) ? [phone,...essential]
                            .filter(el=>overlap(box(plan),box(el))>1).map(el=>el.className) : [];
                        const luminance=rgb=>rgb.map(value=>value/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
                        // Conservative upper bound of the blue/teal ambient gradients and card surfaces.
                        const surface=luminance([41,70,95]);
                        const contrasts=[...panel.querySelectorAll('.headline-line,.scene-lead,.story-card p,.card-index,.eyebrow,.text-link,.scene-note')].filter(visible).map(el=>{
                            const foreground=luminance(getComputedStyle(el).color.match(/[0-9.]+/g).slice(0,3).map(Number));
                            return {element:el.className||el.tagName,ratio:(Math.max(foreground,surface)+.05)/(Math.min(foreground,surface)+.05)};
                        });
                        return {scene:panel.id,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,
                            phone:rect,scale:Number(gsap.getProperty(phone,'scale')),
                            x:Number(gsap.getProperty(phone,'x')),y:Number(gsap.getProperty(phone,'y')),
                            contrasts,
                            planOverlaps,
                            angles:[gsap.getProperty(phone,'rotationX'),gsap.getProperty(phone,'rotationY'),gsap.getProperty(phone,'rotation')],
                            image:image.getAttribute('src'),source:[image.naturalWidth,image.naturalHeight],imageWidth:box(image).width,
                            imageOpacity:Number(getComputedStyle(image).opacity),imageVisibility:getComputedStyle(image).visibility,
                            pixelRatio:image.naturalWidth/(box(image).width*devicePixelRatio),
                            filters:[phone,...phone.querySelectorAll('.phone-entrance,.phone-device,.phone-screen,.screen-layer')].map(el=>getComputedStyle(el).filter),
                            overlaps:essential.filter(el=>overlap(rect,box(el))>1).map(el=>el.tagName+'.'+el.className),
                            inside:rect.left>=0 && rect.right<=innerWidth && rect.top>=nav.bottom && rect.bottom<=controls.top,
                            controlsGap:Math.max(exit.left-controls.right,controls.left-exit.right),
                            controls,exit,caption:box(document.querySelector('#hero-phone-caption'))};
                    })()`);
                    report.push(result);
                    await screenshot('composition-'+size.width+'-'+size.height+'-'+index);
                }
                if (process.argv.includes('--verify-composition')) {
                    const readings=report.slice(-5);
                    const minimumHeights={1280:[494,494,494,494,494],1440:[636,636,636,636,636],
                        390:[406,418,402,402,382],320:[313,300,300,281,248]};
                    for(const [index,reading] of readings.entries()) if(minimumHeights[size.width]) assert(Math.round(reading.phone.height)>=minimumHeights[size.width][index],
                        'Reading size regressed: '+size.width+' '+reading.scene+' '+reading.phone.height);
                    if(size.width>900){
                        assert(readings[1].x<=-100,'Salas moves left');
                        assert(readings[2].x>=100,'Horarios moves right');
                        assert(readings[3].x>0 && readings[3].x<=30,'Anuncios returns near center');
                        assert(readings[4].x>=100,'Closing makes room for the plan');
                    } else assert(readings.every(reading=>Math.abs(reading.x)<.01),'Mobile phone stays centered');
                    const audit = await evaluate(`(async () => {
                        const failures=[];
                        const summary={maxRotation:0,minScale:Infinity,maxScale:0,minX:Infinity,maxX:-Infinity};
                        const trigger=ScrollTrigger.getById('liceomap-cinema');
                        const nav=document.querySelector('.navbar').getBoundingClientRect();
                        const bottom=document.querySelector('.cinema-controls').getBoundingClientRect().top;
                        const phone=document.querySelector('.phone-story');
                        const poses=[];
                        const progresses=[...Array.from({length:81},(_,step)=>(.1+step/80*9.8)/trigger.animation.duration()),
                            ...[2,4,6,8].flatMap(at=>[at-.22,at+.32,at+.72].map(time=>time/trigger.animation.duration()))].sort((a,b)=>a-b);
                        for(const progress of progresses){
                            window.scrollTo({top:trigger.start+progress*(trigger.end-trigger.start),behavior:'instant'});
                            await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                            while(trigger.getTween()?.isActive?.()) await new Promise(requestAnimationFrame);
                            const r=phone.getBoundingClientRect();
                            const angles=['rotationX','rotationY','rotation'].map(key=>Number(gsap.getProperty(phone,key)));
                            const scale=Number(gsap.getProperty(phone,'scale'));
                            const x=Number(gsap.getProperty(phone,'x'));
                            summary.maxRotation=Math.max(summary.maxRotation,...angles.map(Math.abs));
                            summary.minScale=Math.min(summary.minScale,scale);
                            summary.maxScale=Math.max(summary.maxScale,scale);
                            summary.minX=Math.min(summary.minX,x); summary.maxX=Math.max(summary.maxX,x);
                            const snapshot=()=>JSON.stringify({phone:phone.style.transform,
                                screens:[...document.querySelectorAll('.screen-layer')].map(el=>el.style.cssText),
                                cards:[...document.querySelectorAll('.headline-line,.story-card')].map(el=>el.style.cssText)});
                            poses.push(snapshot());
                            if(r.left<0 || r.right>innerWidth || r.top<nav.bottom || r.bottom>bottom)
                                failures.push({progress,rect:r.toJSON()});
                            if(angles.some(angle=>Math.abs(angle)>3.001) || Math.abs(x)>(innerWidth<=900?.01:140.01) || scale>1.0601)
                                failures.push({progress,angles,scale,x,reason:'Motion budget exceeded'});
                            for(const panel of document.querySelectorAll('.story-scene')){
                                if(Number(getComputedStyle(panel).opacity)<.15) continue;
                                const elements=[];
                                for(const el of panel.querySelectorAll('.headline-line,.scene-lead,.story-card,.eyebrow')){
                                    const style=getComputedStyle(el);
                                    if(style.display==='none' || style.visibility==='hidden' || Number(style.opacity)<.15) continue;
                                    elements.push(el);
                                    const text=el.getBoundingClientRect();
                                    if(text.top<nav.bottom || text.bottom>bottom)
                                        failures.push({progress,reason:'Narrative text outside usable viewport',element:el.className});
                                    if(Math.min(r.right,text.right)-Math.max(r.left,text.left)>1 &&
                                        Math.min(r.bottom,text.bottom)-Math.max(r.top,text.top)>1)
                                        failures.push({progress,reason:'Text covered during transition',element:el.className||el.tagName});
                                }
                                for(let a=0;a<elements.length;a++) for(let b=a+1;b<elements.length;b++){
                                    const first=elements[a].getBoundingClientRect(),second=elements[b].getBoundingClientRect();
                                    if(Math.min(first.right,second.right)-Math.max(first.left,second.left)>1 &&
                                        Math.min(first.bottom,second.bottom)-Math.max(first.top,second.top)>1)
                                        failures.push({progress,reason:'Narrative text overlaps',elements:[elements[a].className,elements[b].className]});
                                }
                            }
                        }
                        // Retrace every sampled frame, including screens, cards and title lines.
                        for(let step=progresses.length-1;step>=0;step--){
                            window.scrollTo({top:trigger.start+progresses[step]*(trigger.end-trigger.start),behavior:'instant'});
                            await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
                            while(trigger.getTween()?.isActive?.()) await new Promise(requestAnimationFrame);
                            const snapshot=JSON.stringify({phone:phone.style.transform,
                                screens:[...document.querySelectorAll('.screen-layer')].map(el=>el.style.cssText),
                                cards:[...document.querySelectorAll('.headline-line,.story-card')].map(el=>el.style.cssText)});
                            if(snapshot!==poses[step]) failures.push({step,reason:'Reverse scene mismatch'});
                        }
                        return {failures,summary:{...summary,samples:progresses.length}};
                    })()`);
                    motion.push({viewport:[size.width,size.height],...audit.summary});
                    assert.deepEqual(audit.failures,[],'Transition clipping at '+size.width+'x'+size.height);
                    if(size.width===1280) for(const time of [2.5,4.5]){
                        await evaluate("(() => {const t=ScrollTrigger.getById('liceomap-cinema');window.scrollTo({top:t.start+"+time+"/t.animation.duration()*(t.end-t.start),behavior:'instant'});})()");
                        await evaluate(`(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));while(ScrollTrigger.getAll().some(t=>t.getTween()?.isActive?.()))await new Promise(requestAnimationFrame);})()`);
                        await screenshot('transition-'+time);
                    }
                }
            }
            const output = path.join(profile,'composition.json');
            fs.writeFileSync(output,JSON.stringify(report,null,2));
            if(motion.length) {
                fs.writeFileSync(path.join(profile,'motion.json'),JSON.stringify(motion,null,2));
                console.log('Motion samples: '+JSON.stringify(motion));
            }
            console.log('Composition report: '+output);
            console.log(JSON.stringify(report.map(item=>({viewport:item.viewport,scene:item.scene,height:Math.round(item.phone.height),inside:item.inside,overlaps:item.overlaps,angles:item.angles,pixelRatio:item.pixelRatio.toFixed(2)}))));
            if (process.argv.includes('--verify-composition')) {
                for (const result of report) {
                    assert(result.inside,'Phone outside usable viewport: '+result.viewport+' '+result.scene);
                    assert.deepEqual(result.overlaps,[],'Essential text covered: '+result.viewport+' '+result.scene);
                    assert.deepEqual(result.planOverlaps,[],'Closing plan overlaps: '+result.viewport);
                    assert(result.controlsGap>=16,'Progress/exit separation: '+result.viewport);
                    assert(result.angles.every(angle=>Math.abs(Number(angle))<=3),'Reading pose must be frontal: '+result.scene);
                    assert(result.filters.every(filter=>filter==='none'),'No sharpening/blur filters');
                    assert(result.imageOpacity>.99 && result.imageVisibility==='visible','Reading screenshot visible: '+result.viewport+' '+result.scene+' '+result.imageVisibility+' '+result.imageOpacity);
                    assert(result.contrasts.every(item=>item.ratio>=4.5),'Narrative text contrast: '+result.viewport+' '+result.scene);
                }
            }
            await call('Browser.close');
            return;
        }
        if (process.argv.includes('--layout-only')) {
            await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
            for (const width of [320, 390, 768, 1100, 1440]) {
                await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 1100 });
                await navigate();
                console.log(await evaluate(`JSON.stringify({width:innerWidth, heroWidth:document.querySelector('.hero').scrollWidth,
                    outside:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>${width}+1 && !el.closest('.nav-links')).slice(0,30).map(el=>({class:el.className,tag:el.tagName,right:el.getBoundingClientRect().right}))})`));
                if (width === 320) await screenshot('320');
                if (width === 1100) await screenshot('1100');
            }
            await call('Browser.close');
            return;
        }
        await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
        const settled = () => evaluate(`(async()=>{
            await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
            while(window.ScrollTrigger?.getAll().some(t=>t.getTween()?.isActive?.())) await new Promise(requestAnimationFrame);
        })()`);
        const goTo = async id => {
            await evaluate(`(() => {
                const ids=['concepto','servicios','horarios','anuncios','orientacion'];
                const index=ids.indexOf(${JSON.stringify(id)});
                const trigger=window.ScrollTrigger?.getById('liceomap-cinema');
                const el=document.getElementById(${JSON.stringify(id)});
                const top=trigger && index>=0 ? trigger.start+(index*2+1.45)/trigger.animation.duration()*(trigger.end-trigger.start)
                    : el.getBoundingClientRect().top+scrollY+el.offsetHeight/2-innerHeight/2;
                window.scrollTo({top,behavior:'instant'});
            })()`);
            await settled();
        };
        // Hold only the phone entry for this geometry assertion, so slow CDP calls
        // cannot miss its brief lifetime. The loader itself still completes naturally.
        const entryProbe=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
            window.__entryEvents=[];
            for(const name of ['scroll','focusin']) addEventListener(name,event=>window.__entryEvents.push({event:name,target:event.target?.id,scrollY,time:performance.now()}),true);
            window.__originalEntryAnimate=Element.prototype.animate;
            Element.prototype.animate=function(...args){
                const animation=window.__originalEntryAnimate.apply(this,args);
                window.__entryEvents.push({animation:this.className,time:performance.now()});
                if(this.classList.contains('phone-entrance')) {
                    animation.pause();
                    const cancel=animation.cancel.bind(animation);
                    animation.cancel=()=>{window.__entryEvents.push({cancel:new Error().stack,time:performance.now()});return cancel();};
                }
                return animation;
            };`});
        await navigate();
        await until(async () => (await state()).hidden, 'loader completion');
        await until(()=>evaluate("document.querySelector('.phone-entrance').getAnimations().length > 0"),'phone entry after loader');
        const entryEnd=await evaluate(`(() => {
            const entrance=document.querySelector('.phone-entrance');
            const animation=entrance.getAnimations()[0];
            const frames=animation.effect.getKeyframes();
            animation.pause(); animation.currentTime=animation.effect.getTiming().duration-.001;
            return {first:frames[0].transform,last:frames.at(-1).transform};
        })()`);
        assert(entryEnd.first.includes('100vh'),'Spectacular entry retained');
        assert(entryEnd.last.includes('rotateY(0deg)') && entryEnd.last.includes('scale(1)'),'Entry ends front-on at identity');
        await settled();
        const entryBox=()=>evaluate("document.querySelector('.phone-device').getBoundingClientRect().toJSON()");
        const beforeHandoff=await entryBox();
        await evaluate("document.querySelector('.phone-entrance').getAnimations()[0].finish()");
        await settled();
        const afterHandoff=await entryBox();
        for(const key of ['x','y','width','height']) assert(Math.abs(beforeHandoff[key]-afterHandoff[key])<.05,'Entry handoff '+key);
        await evaluate("(() => {const t=ScrollTrigger.getById('liceomap-cinema');window.scrollTo({top:t.start+1/t.animation.duration()*(t.end-t.start),behavior:'instant'});})()");
        await settled();
        const firstScene=await entryBox();
        for(const key of ['x','y','width','height']) assert(Math.abs(afterHandoff[key]-firstScene[key])<.05,'First scene continuity '+key);
        await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:entryProbe.identifier});
        await evaluate('Element.prototype.animate=window.__originalEntryAnimate; delete window.__originalEntryAnimate');
        await verifyFonts();
        assert.equal(await evaluate("document.querySelector('.story').dataset.scene"), 'concepto');
        await screenshot('desktop');
        assert(await evaluate("!document.querySelector('#mapa-container, #map-status') && document.querySelectorAll('.purpose-chapter').length === 4"));
        for (const [id, screen] of [['servicios','map'],['horarios','home'],['anuncios','news'],['orientacion','home']]) {
            await goTo(id);
            await until(() => evaluate(`document.querySelector('.story').dataset.scene === ${JSON.stringify(id)}`), id);
            assert(Number(await evaluate(`getComputedStyle(document.querySelector('.screen-${screen}')).opacity`)) > .99);
            await until(() => evaluate("document.querySelector('.phone-screen img').complete && document.querySelector('.phone-screen img').naturalWidth > 0"), 'screen decoded');
            await screenshot(id);
        }
        assert.equal(await evaluate('gsap.version'), '3.15.0');
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"), 1);
        assert.equal(await evaluate("getComputedStyle(document.querySelector('.screen-home')).objectFit"),'contain');
        const seek = async progress => {
            await evaluate(`(() => {const t=ScrollTrigger.getById('liceomap-cinema');window.scrollTo({top:t.start+${progress}*10/t.animation.duration()*(t.end-t.start),behavior:'instant'});})()`);
            await settled();
        };
        await seek(.15);
        const poseA=await evaluate("document.querySelector('.phone-story').style.transform");
        await seek(.23);
        const poseB=await evaluate("document.querySelector('.phone-story').style.transform");
        assert.notEqual(poseA,poseB,'Subtle zoom only during the screen transition');
        await wait(350);
        assert.equal(await evaluate("document.querySelector('.phone-story').style.transform"),poseB,'Stopped scroll preserves pose');
        await seek(.15);
        assert.equal(await evaluate("document.querySelector('.phone-story').style.transform"),poseA,'Reverse scroll retraces same pose');
        await seek(.3);
        const readingPose=await evaluate("document.querySelector('.phone-story').style.transform");
        await seek(.35);
        assert.equal(await evaluate("document.querySelector('.phone-story').style.transform"),readingPose,'Reading beat has no drift');
        await seek(.1975);
        const blend=await evaluate("['home','map'].map(n=>Number(getComputedStyle(document.querySelector('.screen-'+n)).opacity))");
        assert(blend.every(opacity=>opacity>0 && opacity<1),'Screens crossfade in both directions');
        await screenshot('crossfade');
        // Resize without crossing a media query, at the start of the narrative.
        await seek(0);
        await call('Emulation.setDeviceMetricsOverride', {width:1280,height:720,deviceScaleFactor:1,mobile:false});
        await wait(300);
        await evaluate("ScrollTrigger.refresh()");
        await seek(0);
        const resizedStart=await entryBox();
        // The first departure now starts at 1.246; sample the preserved still beat.
        await seek(.1);
        const resizedReading=await entryBox();
        for(const key of ['x','y','width','height']) assert(Math.abs(resizedStart[key]-resizedReading[key])<.05,'Refreshed first pose '+key);
        await call('Emulation.setDeviceMetricsOverride', {width:768,height:900,deviceScaleFactor:1,mobile:false});
        await wait(250);
        await goTo('horarios');
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),1,'Resize rebuilds exactly one pin');
        assert(await evaluate("(() => {const r=document.querySelector('.phone-story').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth;})()"));
        await screenshot('tablet');
        await call('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
        await wait(250);
        // Opening administration during the story must freeze phone updates.
        await goTo('horarios');
        const pose = await evaluate("document.querySelector('.phone-story').getAttribute('style')");
        await evaluate("document.querySelector('#btn-open-admin').click()");
        assert.equal(await evaluate("document.querySelector('#admin-modal').hidden"), false);
        assert.equal(await evaluate("document.body.style.overflow"), 'hidden');
        assert(await evaluate("document.body.classList.contains('cinema-paused')"));
        assert(await evaluate("document.querySelector('#main-content').inert"));
        await evaluate("document.querySelector('#close-admin-modal').focus()");
        await call('Input.dispatchKeyEvent', { type:'keyDown', key:'Tab', modifiers:8 });
        assert.equal(await evaluate("document.activeElement.type"), 'submit');
        await evaluate("window.scrollBy({top:100,behavior:'instant'})");
        await settled();
        assert.equal(await evaluate("document.querySelector('.phone-story').getAttribute('style')"), pose);
        assert.equal(await evaluate("document.querySelector('.hero-phone').getAnimations({subtree:true}).length"), 0);
        await evaluate("document.querySelector('#admin-rut').value='demo'; document.querySelector('#admin-pass').value='demo'; document.querySelector('#admin-login-form').requestSubmit()");
        assert.equal(await evaluate("document.querySelector('#admin-dashboard').hidden"), false);
        assert.equal(await evaluate('document.activeElement.id'), 'admin-dashboard-title');
        await screenshot('admin');
        for (const tab of ['horarios','salas','usuarios','anuncios']) {
            await evaluate(`document.querySelector('#tab-button-${tab}').click()`);
            assert.equal(await evaluate(`document.querySelector('#tab-${tab}').hidden`), false);
        }
        await evaluate("document.querySelector('#demo-announcement-title').value='Prueba'; document.querySelector('#demo-announcement-body').value='Comunicado de prueba'; document.querySelector('#tab-anuncios form').requestSubmit()");
        assert((await evaluate("document.querySelector('#tab-anuncios [role=status]').textContent")).includes('Demostraci'));
        await evaluate("document.querySelector('#tab-button-horarios').click(); document.querySelector('#demo-sync-schedule').click()");
        assert((await evaluate("document.querySelector('#schedule-demo-status').textContent")).includes('no se sincronizaron'));
        const sample = path.join(profile, 'horarios-demo.csv');
        fs.writeFileSync(sample, 'curso,asignatura\n3A,Ejemplo\n');
        const root = await call('DOM.getDocument');
        const upload = await call('DOM.querySelector', { nodeId:root.root.nodeId, selector:'#file-upload' });
        await call('DOM.setFileInputFiles', { nodeId:upload.nodeId, files:[sample] });
        assert((await evaluate("document.querySelector('#file-upload-status').textContent")).includes('horarios-demo.csv'));
        await evaluate("document.querySelector('#tab-button-salas').click(); document.querySelector('#demo-map-name').value='Prueba'; document.querySelector('#tab-salas form').requestSubmit()");
        assert((await evaluate("document.querySelector('#tab-salas [role=status]').textContent")).includes('no se guardaron'));
        await evaluate("document.querySelector('#tab-button-usuarios').click(); document.querySelector('#demo-user-search').value='Director'; document.querySelector('#demo-search-form').requestSubmit()");
        assert((await evaluate("document.querySelector('#demo-search-status').textContent")).includes('1 resultado'));
        await evaluate("document.querySelector('#tab-button-anuncios').focus()");
        await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight' });
        assert.equal(await evaluate('document.activeElement.id'), 'tab-button-horarios');
        await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' });
        assert(await evaluate("document.querySelector('#admin-dashboard').hidden"));
        assert.equal(await evaluate("document.body.style.overflow"), '');
        assert(!await evaluate("document.querySelector('#main-content').inert"));
        assert(!await evaluate("document.body.classList.contains('cinema-paused')"));
        await goTo('app-preview');
        await evaluate("document.querySelector('#rut-input').value='12'; document.querySelector('#student-demo-form').requestSubmit()");
        assert.equal(await evaluate("document.querySelector('#rut-input').getAttribute('aria-invalid')"), 'true');
        await evaluate("document.querySelector('#rut-input').value='22.709.631-4'; document.querySelector('#rut-input').dispatchEvent(new Event('input')); document.querySelector('#student-demo-form').requestSubmit()");
        assert.equal(await evaluate("document.querySelector('#rut-input').getAttribute('aria-invalid')"), 'false');
        assert((await evaluate("document.querySelector('#student-demo-status').textContent")).includes('simulada'));
        // Skip and timeout do not delay content or navigation.
        await navigate();
        await evaluate("document.querySelector('.intro-skip').focus(); document.querySelector('.intro-skip').click()");
        assert((await state()).hidden);
        assert.equal(await evaluate('document.activeElement.id'), 'hero-title');
        assert(await evaluate("[...document.querySelectorAll('.hero h1,.hero .scene-lead,.hero .eyebrow,.hero .scene-actions,.hero .scene-note')].every(el=>el.getAnimations().length===0 && getComputedStyle(el).opacity==='1')"),'Skip reveals whole hero immediately');
        await navigate();
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});
        assert((await state()).hidden);
        assert(await evaluate("document.querySelector('.hero').getAnimations({subtree:true}).length===0"),'Escape releases prepared hero');
        await navigate();
        await evaluate("document.querySelector('#app-preloader').getAnimations({subtree:true}).forEach(animation => animation.cancel())");
        await until(async () => (await state()).hidden, 'loader safety timeout');
        // Reduced motion and mobile must keep every scene and control reachable.
        await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await navigate();
        assert((await state()).hidden);
        assert.equal((await state()).animations.length, 0);
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),0);
        assert((await evaluate("document.querySelector('#hero-phone-caption').textContent")).startsWith('Inicio'));
        assert.equal(await evaluate("getComputedStyle(document.querySelector('.phone-device')).transform"), 'none');
        for (const width of [320,390,768,1100]) {
            await call('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width <= 760 });
            await settled();
            const size = await state();
            assert(size.width <= width + 1, 'Expanded mobile viewport at ' + width);
            assert(size.scrollWidth <= width + 1, 'Horizontal overflow at ' + width);
            if (width === 320) await screenshot('mobile-reduced');
        }
        await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
        await call('Emulation.setDeviceMetricsOverride', { width:390,height:844,deviceScaleFactor:1,mobile:true });
        await navigate();
        await until(async () => (await state()).hidden, 'mobile loader');
        await evaluate("document.querySelector('#hamburger-toggle').click()");
        assert.equal(await evaluate("document.querySelector('#hamburger-toggle').getAttribute('aria-expanded')"), 'true');
        await evaluate("document.querySelector('#hamburger-toggle').click()");
        await goTo('anuncios');
        await until(() => evaluate("document.querySelector('.story').dataset.scene === 'anuncios'"), 'mobile scene');
        await screenshot('mobile');
        await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await settled();
        await until(async () => (await state()).animations.length === 0, 'dynamic reduced-motion animation cleanup');
        assert.equal((await state()).animations.length, 0);
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),0);
        // The removed geographic map must not leave a public dependency or anchor.
        assert(await evaluate("!document.querySelector('[href=\"#mapa-container\"], [src*=\"leaflet\"], [href*=\"leaflet\"]')"));
        // Administration remains independent if the decorative script is unavailable.
        await call('Network.setBlockedURLs', { urls:['https://*','http://*','*story.js*'] });
        await navigate();
        await evaluate("document.querySelector('#footer-admin-link').click()");
        assert.equal(await evaluate("document.querySelector('#admin-modal').hidden"), false);
        await call('Input.dispatchKeyEvent', { type:'keyDown', key:'Escape' });
        assert.equal(await evaluate("document.querySelector('#admin-modal').hidden"), true);
        // Missing ScrollTrigger gives a complete readable document, not an empty stage.
        await call('Network.setBlockedURLs', { urls:['https://*','http://*','*ScrollTrigger-3.15.0*'] });
        await call('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'no-preference'}] });
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click()");
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),0);
        assert(!await evaluate("document.querySelector('.story').classList.contains('is-cinematic')"));
        assert(await evaluate("[...document.querySelectorAll('.story-scene')].every(panel=>!panel.inert)"));
        await evaluate("document.querySelector('#btn-open-admin').click()");
        assert.equal(await evaluate("document.querySelector('#admin-modal').hidden"),false);
        await evaluate("document.querySelector('#close-admin-modal').click()");
        // Static HTML fallback retains all text, screenshot links and the phone.
        await call('Emulation.setScriptExecutionDisabled', { value:true });
        await navigate(false);
        await call('Emulation.setScriptExecutionDisabled', { value:false });
        assert((await state()).hidden);
        assert.equal((await state()).image,691);
        assert.equal(await evaluate("document.querySelectorAll('.capture-link').length"),3);
        assert.equal(await evaluate("document.querySelectorAll('.story-scene').length"),5);
        assert.deepEqual(errors, []);
        console.log('PASS: GSAP pin/scrub, reversible poses, still state, crossfades, scenes, loader, admin/forms/focus/file, RUT, menu, public map removal, responsive, reduced motion, no-JS, UTF-8.');
        await call('Browser.close');
    } finally {
        ws?.close();
        // Only the isolated process started by this test is stopped.
        if (browser.exitCode === null) browser.kill();
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
