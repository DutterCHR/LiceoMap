const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async function({call,evaluate,navigate,until,screenshot,profile,web}) {
    const out=path.join(web,'review/phase53/motion');fs.mkdirSync(out,{recursive:true});
    const report={};
    const frame=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    const settle=async()=>{await frame();await until(()=>evaluate("ScrollTrigger.getAll().every(t=>!t.getTween()?.isActive?.())"),'All scrub motion settles');};
    const seek=async(time,id='liceomap-cinema')=>{
        await evaluate(`(()=>{const t=ScrollTrigger.getById('${id}');scrollTo({top:t.start+${time}/(t.vars.id==='liceomap-cinema'?t.animation.duration():1)*(t.end-t.start),behavior:'instant'})})()`);await settle();
    };
    const capture=async name=>{await screenshot('motion-'+name);fs.copyFileSync(path.join(profile,'motion-'+name+'.png'),path.join(out,name+'.png'));};
    const snapshot=()=>evaluate("JSON.stringify([...document.querySelectorAll('.phone-story,.story-scene,.purpose-section,.purpose-section *,.demo-title-line,.demo-interface-reveal')].map(el=>({style:el.style.cssText,inert:el.inert,hidden:el.getAttribute('aria-hidden')})))");
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await navigate();await evaluate("document.querySelector('.intro-skip').click();document.fonts.ready");await settle();
    // Observe the rendered clock on GSAP's ticker, including frames after scroll events stop.
    await evaluate(`window.__accessProbe={frames:0,settlingFrames:0,errors:[]};window.__checkAccess=()=>{
        const t=ScrollTrigger.getById('liceomap-cinema'),time=t.animation.time(),p=window.__accessProbe;
        p.frames++;if(t.getTween()?.isActive())p.settlingFrames++;
        const panels=[...document.querySelectorAll('.story-scene')],controls=[...document.querySelectorAll('.cinema-controls [data-scene]')];
        const index=time>=10.5?-1:Math.min(4,Math.floor((time+.08)/2));
        if(panels.some((el,i)=>el.inert!==(i!==index)||el.getAttribute('aria-hidden')!==String(i!==index)))p.errors.push({time,kind:'story access'});
        if(controls.some((el,i)=>el.hasAttribute('aria-current')!==(i===index)))p.errors.push({time,kind:'controls'});
        const chapter=time<11.65?-1:time<14.25?0:time<17.55?1:time<20.9?2:3;
        if([...document.querySelectorAll('.purpose-chapter')].some((el,i)=>el.inert!==(i!==chapter)||el.getAttribute('aria-hidden')!==String(i!==chapter)))p.errors.push({time,kind:'chapter access'});
        if([...document.querySelectorAll('.purpose-nav a[href]')].some((el,i)=>el.hasAttribute('aria-current')!==(i===chapter)))p.errors.push({time,kind:'chapter navigation'});
    };gsap.ticker.add(window.__checkAccess)`);
    await seek(1.7);
    for(const delta of Array(12).fill(20)) {
        await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:1100,y:450,deltaX:0,deltaY:delta});await frame();
    }
    await settle();
    for(const delta of [1200,800,-650,-1300,500]) {
        await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:1100,y:450,deltaX:0,deltaY:delta});await frame();
    }
    await settle();
    await seek(16.9);
    await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:1100,y:450,deltaX:0,deltaY:550});await frame();
    const settling=await evaluate(`(async()=>{
        const t=ScrollTrigger.getById('liceomap-cinema'),start=performance.now(),samples=[];
        do{await new Promise(requestAnimationFrame);samples.push({ms:performance.now()-start,gap:Math.abs(t.progress-t.animation.progress())});}while(t.getTween().isActive());
        return samples;
    })()`);
    assert(settling.at(-1).gap<.00001,'No offset after wheel pause');
    assert(settling.every((s,i)=>!i||s.gap<=settling[i-1].gap+.00001),'Settling converges without oscillation');
    const still=await snapshot();await evaluate('new Promise(r=>setTimeout(r,100))');assert.equal(await snapshot(),still,'No drift once settled');
    report.wheel={slow:true,fast:true,reversalDuringScrub:true,pauseSamples:settling};
    // Every direct chapter link must commit visible content before receiving focus.
    for(const id of ['vision','que-es','objetivo','problematica']) {
        await evaluate(`document.querySelector('.purpose-nav a[href="#${id}"]').click()`);await frame();
        assert.equal(await evaluate('document.activeElement.id'),id,'Direct anchor focus '+id);
        assert(await evaluate("(()=>{const t=ScrollTrigger.getById('liceomap-cinema');return Math.abs(t.progress-t.animation.progress())<.00001})()"),'Anchor settles immediately');
    }
    await evaluate("location.hash='#anuncios'");await settle();
    assert.equal(await evaluate("document.querySelector('.story').dataset.scene"),'anuncios','Hash navigation');
    await evaluate("document.querySelector('[data-scene=\"1\"]').click()");await until(()=>evaluate("!ScrollTrigger.isScrolling()"),'Native smooth navigation');await settle();
    assert.equal(await evaluate("document.querySelector('.story').dataset.scene"),'servicios');
    // Filmstrip and exact reverse reconstruction at camera and card transitions.
    const times=[10,10.55,10.9,11.3,11.6,11.8,12,12.3,13.4,14.5,15.8,16.7,17.2,17.6,18.1,18.8,20.4,21.2,22,24.1];
    const states=[];
    for(const time of times) {await seek(time);states.push(await snapshot());await capture('t-'+time);}
    for(let i=times.length-1;i>=0;i--){await seek(times[i]);assert.equal(await snapshot(),states[i],'Exact reverse at '+times[i]);}
    await seek(11.8);
    assert(await evaluate("(()=>{const r=document.querySelector('.purpose-screen-surface').getBoundingClientRect();return r.left<0&&r.top<0&&r.right>innerWidth&&r.bottom>innerHeight})()"),'Opaque screen covers every corner before narrative handoff');
    // Sample transformations on the real scroll clock; the phone must never jump or shrink in flight.
    report.camera=await evaluate(`(async()=>{
        const t=ScrollTrigger.getById('liceomap-cinema'),phone=document.querySelector('.phone-story'),samples=[];
        scrollTo({top:t.start+10.55/t.animation.duration()*(t.end-t.start),behavior:'instant'});await new Promise(r=>setTimeout(r,400));
        for(let i=0;i<150;i++){
            scrollTo({top:t.start+(10.55+i/149*1.55)/t.animation.duration()*(t.end-t.start),behavior:'instant'});
            await new Promise(requestAnimationFrame);
            samples.push({time:t.animation.time(),scale:Number(gsap.getProperty(phone,'scale')),z:Number(gsap.getProperty(phone,'z'))});
        }return samples;
    })()`);
    assert(report.camera.every((s,i)=>!i||s.scale>=report.camera[i-1].scale-.001),'Camera scale monotonic');
    assert(report.camera.every((s,i)=>!i||s.z>=report.camera[i-1].z-.001),'Camera depth monotonic');
    await settle();
    // Pin boundaries immediately render their endpoints rather than chase an offscreen section.
    for(const direction of [1,-1]) {
        await evaluate(`(()=>{const t=ScrollTrigger.getById('liceomap-cinema');scrollTo({top:${direction>0?'t.end+150':'0'},behavior:'instant'})})()`);await frame();
        const boundary=await evaluate("(()=>{const t=ScrollTrigger.getById('liceomap-cinema');return {scrollY,start:t.start,end:t.end,progress:t.progress,rendered:t.animation.progress(),tween:t.getTween().progress(),active:t.getTween().isActive()}})()");
        assert(Math.abs(boundary.progress-boundary.rendered)<.00001,'Pin boundary aligned '+JSON.stringify({direction,...boundary}));
    }
    await seek(.6,'liceomap-finale');
    await evaluate("(()=>{const t=ScrollTrigger.getById('liceomap-finale');scrollTo({top:t.start+.8*(t.end-t.start),behavior:'instant'})})()");await frame();
    await evaluate("document.querySelector('#btn-open-admin').click()");await frame();
    const paused=await evaluate("ScrollTrigger.getById('liceomap-finale').animation.progress()");
    await evaluate('new Promise(r=>setTimeout(r,400))');
    assert.equal(await evaluate("ScrollTrigger.getById('liceomap-finale').animation.progress()"),paused,'Administration freezes finale scrub');
    await evaluate("document.querySelector('#close-admin-modal').click()");await settle();
    report.access=await evaluate('gsap.ticker.remove(window.__checkAccess);window.__accessProbe');
    assert.deepEqual(report.access.errors,[],'Access and controls follow rendered animation throughout scrub');
    assert(report.access.settlingFrames>30,'Probe observes actual post-scroll settling');
    // Resize across breakpoints, orientation fallback, and back; no stale pin or orphaned styles.
    for(const [width,height] of [[1200,800],[390,844],[844,390],[390,844],[1440,900]]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
        await evaluate('new Promise(r=>setTimeout(r,300))');await evaluate('ScrollTrigger.refresh()');await settle();
        assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'Resize overflow');
        if(height<600) assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),0,'Landscape natural fallback');
        else {await seek(18.8);assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),1,'One pin after resize');}
    }
    report.resize=true;report.reverse=true;report.anchors=true;report.pinBoundaries=true;report.adminPause=true;
    fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(report,null,2)+'\n');
    fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="es"><meta charset="utf-8"><title>Fase 5.3 · recorrido</title><style>body{background:#0b1424;color:#fff;font:16px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px}</style><h1>Fase 5.3 · secuencia de scroll asentada en Chrome</h1><p>Vuelo, capítulos y transformación. Capturas de estados; no es una grabación temporal.</p><main>'+times.map(time=>`<figure><a href="t-${time}.png"><img loading="lazy" src="t-${time}.png" alt="Estado de animación ${time}"></a><figcaption>Tiempo de la narrativa: ${time}</figcaption></figure>`).join('')+'</main></html>');
    console.log('PASS: native wheel, settling accessibility, camera coverage/continuity, reverse, anchors, admin pause, pin boundaries, resize/orientation. '+JSON.stringify({frames:report.access.frames,settlingFrames:report.access.settlingFrames}));
};
