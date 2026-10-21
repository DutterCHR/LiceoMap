// Before/after measurements on the same browser and machine, no added dependency.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const os=require('node:os');
module.exports=async function({call,evaluate,navigate,until,screenshot,profile,web,baseline}){
    const fixture=path.join(web,'tests','fixtures','phase43-state.json');
    const reference=baseline?null:JSON.parse(fs.readFileSync(fixture,'utf8'));
    const files=['index.html','style.css','home.png','mapa.png','anuncios.png',
        'fonts/outfit-latin-variable.woff2','fonts/plus-jakarta-sans-latin-variable.woff2'];
    const hashes=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(web,file))).digest('hex')]));
    if(reference) assert.deepEqual(hashes,reference.hashes,'Approved design, content and assets unchanged');
    const report={version:baseline?'4.3':'4.4',hashes,host:{memoryBytes:os.totalmem(),cpu:os.cpus()[0]?.model},sizes:[]};
    await call('Performance.enable');
    const metrics=async()=>Object.fromEntries((await call('Performance.getMetrics')).metrics.map(item=>[item.name,item.value]));
    const difference=(before,after)=>Object.fromEntries(['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount','JSHeapUsedSize'].map(key=>[key,after[key]-before[key]]));
    await call('Page.addScriptToEvaluateOnNewDocument',{source:`
        window.__entryEvents=[];
        for(const name of ['scroll','focusin','visibilitychange']) addEventListener(name,event=>window.__entryEvents.push({event:name,scrollY,time:performance.now()}),true);
        window.__phase44={entry:null,reads:0,scrolling:false};
        for(const key of ['offsetTop','offsetWidth','offsetHeight','offsetParent']){
            const descriptor=Object.getOwnPropertyDescriptor(HTMLElement.prototype,key);
            Object.defineProperty(HTMLElement.prototype,key,{...descriptor,get(){
                if(window.__phase44.scrolling) window.__phase44.reads++;
                return descriptor.get.call(this);
            }});
        }
        const original=Element.prototype.animate;
        Element.prototype.animate=function(...args){
            const animation=original.apply(this,args);
            window.__entryEvents.push({animation:this.className,time:performance.now()});
            if(this.classList.contains('phone-entrance')){
                if(window.__interruptEntry) requestAnimationFrame(()=>{
                    const trigger=ScrollTrigger.getById('liceomap-cinema');
                    scrollTo({top:trigger.start+.13*(trigger.end-trigger.start),behavior:'instant'});
                    requestAnimationFrame(()=>requestAnimationFrame(()=>window.__phase44.interrupted=true));
                });
                const data=window.__phase44.entry={times:[],samples:[],done:false};
                const start=performance.now(); let sample=0;
                const tick=now=>{
                    data.times.push(now-start);
                    if(now-start>=[0,250,600,1000,1450][sample]){
                        data.samples.push({at:now-start,hero:[...document.querySelectorAll('.hero h1,.hero .scene-lead,.hero .eyebrow,.hero .scene-actions,.hero .scene-note')].map(el=>({opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform}))}); sample++;
                    }
                    if(now-start<1550) requestAnimationFrame(tick); else data.done=true;
                }; requestAnimationFrame(tick);
            }
            return animation;
        };`});
    for(const [width,height] of [[1280,720],[390,844]]){
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
        await navigate();
        await until(()=>evaluate('window.__phase44.entry?.done === true'),'natural entry sampling');
        const entry=await evaluate('window.__phase44.entry');
        await evaluate("document.fonts.ready.then(()=>Promise.all([...document.querySelectorAll('.screen-layer')].map(image=>image.decode())))");
        await screenshot('phase44-entry-'+width);
        const seek=async time=>{
            await evaluate(`(()=>{const t=ScrollTrigger.getById('liceomap-cinema');scrollTo({top:t.start+${time}/10*(t.end-t.start),behavior:'instant'});})()`);
            await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
        };
        const state=()=>evaluate(`(()=>{const t=ScrollTrigger.getById('liceomap-cinema');return {
            pin:[t.start,t.end,t.animation.duration()],
            nodes:[...document.querySelectorAll('.phone-story,.screen-layer,.story-scene,.headline-line,.story-card,.scene-lead,.eyebrow,.notification-chip,.closing-map,.ambient')].map(el=>({
                style:el.style.cssText,inert:el.inert,hidden:el.getAttribute('aria-hidden')})),
            caption:document.querySelector('#hero-phone-caption').textContent};})()`);
        // Fixed 4x CPU throttle and a fixed native-scroll path; RAF statistics are
        // diagnostic, not a promise about the user's visible browser frame rate.
        await call('Emulation.setCPUThrottlingRate',{rate:4});
        const before=await metrics();
        const scroll=await evaluate(`(async()=>{
            const trigger=ScrollTrigger.getById('liceomap-cinema');
            const frames=[]; let previous=performance.now();
            window.__phase44.reads=0; window.__phase44.scrolling=true;
            for(let frame=0;frame<100;frame++){
                scrollTo({top:trigger.start+frame/99*.28*(trigger.end-trigger.start),behavior:'instant'});
                await new Promise(resolve=>requestAnimationFrame(now=>{frames.push(now-previous);previous=now;resolve();}));
            }
            window.__phase44.scrolling=false;
            return {frames,layoutReads:window.__phase44.reads};
        })()`);
        const after=await metrics();
        await call('Emulation.setCPUThrottlingRate',{rate:1});
        const later=[];
        for(let step=0;step<=36;step++){
            const time=2.8+step*.195;
            await seek(time); later.push(await state());
        }
        if(reference) assert.deepEqual(later,reference.sizes.find(size=>size.width===width).later,'Every later scene identical to phase 4.3: '+width);
        if(reference){
            const first=[];
            const times=[0,.4,1,1.1,1.3,1.55,1.78,1.95,2.32,2.72];
            for(const time of times){await seek(time);first.push(await state());}
            for(let index=times.length-1;index>=0;index--){await seek(times[index]);assert.deepEqual(await state(),first[index],'First transition reversible: '+times[index]);}
            const start=entry.samples[0].hero;
            assert(start.every(item=>Number(item.opacity)<.1),'Hero initially prepared under loader');
            assert(entry.samples[1].hero.some(item=>Number(item.opacity)>0 && Number(item.opacity)<1),'Hero progressively accompanies phone');
            assert(entry.samples.at(-1).hero.every(item=>item.opacity==='1' && item.transform==='none'),'Completed hero has no retained transforms');
            await seek(1.3); const stopped=await state();
            await evaluate('new Promise(resolve=>setTimeout(resolve,250))');
            assert.deepEqual(await state(),stopped,'First scroll is still when stopped');
            await screenshot('phase44-first-scroll-'+width);
        }
        await seek(0);
        const response=await evaluate(`(async()=>{
            const trigger=ScrollTrigger.getById('liceomap-cinema');
            const hero=document.querySelector('.hero');
            for(let step=1;step<=100;step++){
                const time=step*.02;
                scrollTo({top:trigger.start+time/10*(trigger.end-trigger.start),behavior:'instant'});
                await new Promise(resolve=>requestAnimationFrame(resolve));
                if(Number(getComputedStyle(hero).opacity)<.99) return {time,pixels:scrollY-trigger.start};
            }
        })()`);
        await seek(0);
        const stats=times=>{
            const values=times.slice(1).map((value,index)=>value-times[index]).sort((a,b)=>a-b);
            return {p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],max:Math.max(...values)};
        };
        const sorted=scroll.frames.slice(1).sort((a,b)=>a-b);
        const result={width,height,entry:{raf:stats(entry.times),samples:entry.samples},response,
            scroll:{raf:{p50:sorted[49],p95:sorted[94],max:Math.max(...sorted)},layoutReads:scroll.layoutReads,metrics:difference(before,after)},later};
        report.sizes.push(result);
        if(reference){
            const old=reference.sizes.find(size=>size.width===width);
            assert(response.pixels<old.response.pixels*.78 && response.pixels>old.response.pixels*.6,'First response shortened only: '+width);
        }
        console.log(JSON.stringify({...result,later:'37 identical later-scene snapshots'}));
        if(reference){
            const interrupt=await call('Page.addScriptToEvaluateOnNewDocument',{source:'window.__interruptEntry=true;'});
            await navigate();
            await until(()=>evaluate('window.__phase44.interrupted === true'),'scroll interrupts synchronized entry');
            assert(await evaluate("document.querySelectorAll('.phone-entrance,.hero h1,.hero .scene-lead,.hero .eyebrow,.hero .scene-actions,.hero .scene-note').values().every(el=>el.getAnimations().length===0 && Number(getComputedStyle(el).opacity)===1)"),'Scroll reveals complete hero immediately');
            await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:interrupt.identifier});
        }
    }
    if(baseline){fs.mkdirSync(path.dirname(fixture),{recursive:true});fs.writeFileSync(fixture,JSON.stringify(report,null,2));}
    const output=path.join(profile,'phase44.json'); fs.writeFileSync(output,JSON.stringify(report,null,2));
    console.log('Phase 4.4 measurements: '+output);
};
