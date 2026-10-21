// Real Chrome, native wheel input, no browser/test dependencies. Baseline recorded before edits.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
module.exports = async function({call,evaluate,navigate,until,screenshot,profile,web,baseline}) {
    const output = path.join(web,'review/phase53');
    fs.mkdirSync(output,{recursive:true});
    const fixture = path.join(web,'tests/fixtures/phase53-baseline.json');
    const preserved = ['index.html','app.js','app-admin.js','style.css','purpose.css','finale.css',
        'vendor/gsap-3.15.0.min.js','vendor/ScrollTrigger-3.15.0.min.js'];
    const hashes = Object.fromEntries(preserved.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(web,file),'utf8').replace(/\r\n/g,'\n')).digest('hex')]));
    const reference = baseline ? {hashes,reading:{}} : JSON.parse(fs.readFileSync(fixture,'utf8'));
    if(!baseline) assert.deepEqual(hashes,reference.hashes,'Approved HTML, entry, navigation, admin, RUT, typography and all CSS preserved');
    const frames = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    const settle = async () => {
        await frames();
        await until(()=>evaluate("ScrollTrigger.getAll().every(t=>!t.getTween()?.isActive?.())"),'Scrub settles');
    };
    const seek = async (time,id='liceomap-cinema') => {
        await evaluate(`(()=>{const t=ScrollTrigger.getById('${id}');scrollTo({top:t.start+${time}/(t.vars.id==='liceomap-cinema'?t.animation.duration():1)*(t.end-t.start),behavior:'instant'})})()`);
        await settle();
    };
    const capture = async name => {
        await screenshot('phase53-'+name);
        fs.copyFileSync(path.join(profile,'phase53-'+name+'.png'),path.join(output,(baseline?'before-':'after-')+name+'.png'));
    };
    const state = () => evaluate(`(()=>{
        const visible=el=>{for(let p=el;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.99)return false;}return true;};
        return [...document.querySelectorAll('.phone-story,.screen-layer,.story-scene h1,.story-scene h2,.story-card,.closing-map,.purpose-chapter h2,.purpose-copy,.purpose-friction,.purpose-pillar,.purpose-origin-art,.purpose-handoff,.demo-title-line,.demo-interface-reveal')].filter(visible).map(el=>{
            const s=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.className,box:[r.x,r.y,r.width,r.height],opacity:Number(s.opacity)};
        });
    })()`);
    const report = {browser:(await call('Browser.getVersion')).product,baseline,viewports:[],scrubExperiments:[]};
    for(const [width,height] of [[1440,900],[1280,720],[390,844],[768,1024],[320,720],[375,780]]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click();document.fonts.ready.then(()=>Promise.all([...document.querySelectorAll('.screen-layer')].map(i=>i.decode())))");
        await settle();
        const immersive = await evaluate("document.querySelector('#proyecto').classList.contains('is-immersive')");
        for(const time of [1,3.45,5.45,7.4,9.3,...(immersive?[13.4,15.8,18.8,24.1]:[])]) {
            await seek(time);
            const key = width+'-'+time,current = await state();
            if(baseline) reference.reading[key]=current;
            else {
                const expected=reference.reading[key];
                assert.equal(current.length,expected.length,'Same visible composition '+key);
                current.forEach((el,i)=>{
                    assert.equal(el.tag,expected[i].tag,key);
                    el.box.forEach((n,k)=>assert(Math.abs(n-expected[i].box[k])<.15,JSON.stringify({key,element:el.tag,k,actual:n,expected:expected[i].box[k]})));
                });
            }
            if([1440,390].includes(width) && [3.45,15.8,18.8,24.1].includes(time)) await capture(width+'-reading-'+time);
        }
        for(const p of [.5,1]) {await seek(p,'liceomap-finale');if(width===1440||width===390) await capture(width+'-finale-'+p);}
        assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'No overflow '+width);
        report.viewports.push({width,height,immersive,readingPreserved:!baseline});
    }
    // Same frame-paced native scroll path before and after; no geometry reads in the sample loop.
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await navigate();await evaluate("document.querySelector('.intro-skip').click();document.fonts.ready");await settle();
    report.performance = await evaluate(`(async()=>{
        const metrics=[];
        for(const id of ['liceomap-cinema','liceomap-finale']){
            const t=ScrollTrigger.getById(id),intervals=[],tasks=[];let last;
            const observer=new PerformanceObserver(list=>tasks.push(...list.getEntries().map(e=>e.duration)));
            observer.observe({type:'longtask',buffered:false});
            const begin=performance.now();
            for(let i=0;i<300;i++){
                const now=await new Promise(requestAnimationFrame);if(last)intervals.push(now-last);last=now;
                const p=i<150?i/149:1-(i-150)/149;
                scrollTo({top:t.start+p*(t.end-t.start),behavior:'instant'});
            }
            await new Promise(r=>setTimeout(r,500));observer.disconnect();
            const sorted=[...intervals].sort((a,b)=>a-b);
            metrics.push({id,samples:intervals.length,durationMs:performance.now()-begin,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:Math.max(...intervals),over34ms:intervals.filter(n=>n>34).length,longTasks:tasks});
        }return metrics;
    })()`);
    // Compare moderate interpolation values using actual native wheel events and reversal.
    for(const value of (baseline?[true,.25,.35,.45]:[.35])) {
        await evaluate(`ScrollTrigger.getById('liceomap-cinema').scrubDuration(${value===true?0:value})`);
        await seek(4.1);
        await evaluate('window.__wheelStart=performance.now()');
        await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:1000,y:450,deltaX:0,deltaY:220});
        await frames();
        const gap=await evaluate("(()=>{const t=ScrollTrigger.getById('liceomap-cinema');return Math.abs(t.progress-t.animation.progress())})()");
        await settle();
        const elapsedMs=await evaluate('performance.now()-window.__wheelStart');
        await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:1000,y:450,deltaX:0,deltaY:-160});
        await settle();
        assert(await evaluate("(()=>{const t=ScrollTrigger.getById('liceomap-cinema');return Math.abs(t.progress-t.animation.progress())<.00001})()"),'Wheel ends aligned');
        report.scrubExperiments.push({value,gapAfterTwoFrames:gap,settledWithinMs:elapsedMs});
    }
    if(baseline) fs.writeFileSync(fixture,JSON.stringify(reference,null,2)+'\n');
    fs.writeFileSync(path.join(output,baseline?'baseline.json':'checks.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
};
