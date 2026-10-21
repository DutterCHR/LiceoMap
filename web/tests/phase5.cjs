// Run through the existing dependency-free Chrome CDP harness:
// node web/tests/phase2.cjs --phase5
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({call,evaluate,navigate,until,screenshot,profile,web}) => {
    for (const file of ['index.html','style.css','app.js','story.js','purpose.js']) {
        const source = new TextDecoder('utf-8', {fatal:true}).decode(fs.readFileSync(path.join(web,file)));
        assert(!source.includes('\uFFFD'), 'UTF-8: '+file);
    }
    const frames = () => evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const scroll = async expression => {
        await evaluate(`scrollTo({top:${expression},behavior:'instant'})`);
        await frames();
    };
    const geometry = () => evaluate(`(()=>{
        const box=el=>el.getBoundingClientRect();
        const cards=[...document.querySelectorAll('.purpose-friction')];
        const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
        const outside=[...document.querySelectorAll('.purpose-chapter h2,.purpose-chapter h3,.purpose-copy,.purpose-friction,.purpose-pillar,.purpose-origin,.purpose-handoff a')].filter(el=>box(el).left<0 || box(el).right>innerWidth+.5);
        const clipped=cards.filter(el=>el.scrollHeight>el.clientHeight+1 || el.scrollWidth>el.clientWidth+1);
        return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,outside:outside.map(el=>el.className),clipped:clipped.length,
            overlaps:cards.some((el,i)=>cards.slice(i+1).some(other=>overlap(box(el),box(other))>1))};
    })()`);
    const state = () => evaluate(`JSON.stringify([...document.querySelectorAll('.purpose-section [style],.purpose-nav a')].map(el=>({style:el.style.cssText,current:el.getAttribute('aria-current')})))`);
    const report=[];
    for (const [width,height] of [[1440,900],[1280,720],[768,1024],[390,844],[320,720]]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click(); document.fonts.ready");
        await until(()=>evaluate("ScrollTrigger.getById('purpose-chapter-3')?.end>0"),'purpose triggers');
        await frames();
        assert.equal(await evaluate("document.querySelectorAll('.purpose-chapter').length"),4);
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),1,'Only the approved phone is pinned');
        assert(await evaluate("[...document.querySelectorAll('a[href^=\"#\"]')].every(a=>a.hash==='' || !!document.getElementById(a.hash.slice(1)))"),'All anchors exist');
        for (let chapter=0;chapter<4;chapter++) {
            for (const fraction of [0,.3,.65,1]) {
                await scroll(`(()=>{const t=ScrollTrigger.getById('purpose-chapter-${chapter}');return t.start+${fraction}*(t.end-t.start)})()`);
                const result=await geometry();
                assert(result.scrollWidth<=width+1 && !result.outside.length && !result.clipped && !result.overlaps,JSON.stringify(result));
                const snapshot=await state();
                await evaluate('new Promise(resolve=>setTimeout(resolve,80))');
                assert.equal(await state(),snapshot,'Scroll position holds: '+width+' chapter '+chapter);
                await scroll('scrollY+60');
                await scroll(`(()=>{const t=ScrollTrigger.getById('purpose-chapter-${chapter}');return t.start+${fraction}*(t.end-t.start)})()`);
                assert.equal(await state(),snapshot,'Scroll is reversible: '+width+' chapter '+chapter);
            }
            await scroll(`document.querySelectorAll('.purpose-chapter')[${chapter}].getBoundingClientRect().top+scrollY-150`);
            assert.equal(await evaluate("document.querySelector('.purpose-nav [aria-current]')?.hash"),['#que-es','#problematica','#objetivo','#vision'][chapter],JSON.stringify(await evaluate("({scrollY,nav:[...document.querySelectorAll('.purpose-nav a')].map(a=>[a.hash,a.getAttribute('aria-current')]),triggers:ScrollTrigger.getAll().map(t=>({id:t.vars.id,start:t.start,end:t.end,active:t.isActive,trigger:t.trigger?.id})),chapters:[...document.querySelectorAll('.purpose-chapter')].map(c=>({id:c.id,top:c.getBoundingClientRect().top,height:c.offsetHeight}))})")));
            if ([1440,390].includes(width)) await screenshot('phase5-'+width+'-chapter-'+(chapter+1));
        }
        // Traverse the complete lower compositions, not only heading entrances.
        const end=await evaluate("document.querySelector('#app-preview').getBoundingClientRect().top+scrollY-innerHeight");
        const start=await evaluate("document.querySelector('#proyecto').getBoundingClientRect().top+scrollY");
        for(let y=start;y<=end;y+=Math.round(height*.6)) {
            await scroll(y);
            const result=await geometry();
            assert(!result.overlaps && !result.outside.length && !result.clipped,JSON.stringify(result));
        }
        for (const id of ['vision','que-es']) {
            await evaluate(`document.querySelector('.purpose-nav a[href="#${id}"]').click()`);
            await until(()=>evaluate(`location.hash==='#${id}' && document.querySelector('.purpose-nav [aria-current]')?.hash==='#${id}'`),'native chapter navigation');
            await evaluate('new Promise(resolve=>setTimeout(resolve,600))');
            assert(await evaluate(`(()=>{const title=document.querySelector('#${id} h2').getBoundingClientRect();return title.top>=document.querySelector('.purpose-nav').getBoundingClientRect().bottom && title.top<innerHeight})()`),'Chapter link keeps title below navigation');
        }
        const animated=await evaluate("[...document.querySelectorAll('.purpose-section [style]')].map(el=>el.style.cssText)");
        // Open administration from inside the new narrative: no drift in the background.
        await evaluate("document.querySelector('#footer-admin-link').click()");
        await evaluate('new Promise(resolve=>setTimeout(resolve,120))');
        assert.deepEqual(await evaluate("[...document.querySelectorAll('.purpose-section [style]')].map(el=>el.style.cssText)"),animated);
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});
        await frames();
        report.push({width,height,chapters:4,reversible:true,held:true,noClipping:true,noOverlap:true});
    }

    // Live preference changes must undo all transforms and inline fades.
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await frames();
    const staticReadable = () => evaluate(`({
        chapters:document.querySelectorAll('.purpose-chapter').length,
        visible:[...document.querySelectorAll('.purpose-line,.purpose-reveal,.purpose-friction,.purpose-node')].every(el=>{
            const s=getComputedStyle(el);return s.visibility==='visible' && Number(s.opacity)===1 && s.transform==='none';}),
        clean:[...document.querySelectorAll('.purpose-line,.purpose-reveal,.purpose-friction,.purpose-node')].every(el=>!el.style.transform && !el.style.opacity),
        anchors:[...document.querySelectorAll('.purpose-nav a')].every(a=>!!document.querySelector(a.hash)),
        remaining:[...document.querySelectorAll('.purpose-line,.purpose-reveal,.purpose-friction,.purpose-node')].filter(el=>{
            const s=getComputedStyle(el);return s.visibility!=='visible' || Number(s.opacity)!==1 || s.transform!=='none';}).map(el=>({class:el.className,style:el.style.cssText,transform:getComputedStyle(el).transform})),
        pin:document.querySelectorAll('.pin-spacer').length,
        motions:window.ScrollTrigger?.getAll().filter(t=>t.vars.id?.startsWith('purpose-')).length||0
    })`);
    let result=await staticReadable();
    assert(result.visible && result.clean && result.anchors && result.chapters===4 && !result.motions && !result.pin,JSON.stringify(result));
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await frames();
    assert(await evaluate("!!ScrollTrigger.getById('purpose-chapter-0')"),'Motion can be restored');

    // Missing JS, missing individual controllers and missing animation dependencies.
    for (const blocked of ['*gsap-3.15.0*','*ScrollTrigger-3.15.0*','*purpose.js*']) {
        await call('Network.setBlockedURLs',{urls:['https://*','http://*',blocked]});
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click()");
        result=await staticReadable();
        assert(result.visible && result.anchors && result.chapters===4 && !result.motions,blocked+': '+JSON.stringify(result));
        await scroll("document.querySelector('#proyecto').getBoundingClientRect().top+scrollY");
        await screenshot('phase5-fallback-'+blocked.replaceAll('*','').replaceAll('.','-'));
    }
    await call('Network.setBlockedURLs',{urls:['https://*','http://*']});
    await call('Emulation.setScriptExecutionDisabled',{value:true});
    await navigate(false);
    await call('Emulation.setScriptExecutionDisabled',{value:false});
    result=await staticReadable();
    assert(result.visible && result.anchors && result.chapters===4 && !result.pin,JSON.stringify(result));
    await scroll("document.querySelector('#proyecto').getBoundingClientRect().top+scrollY");
    await screenshot('phase5-no-js-mobile');
    fs.writeFileSync(path.join(profile,'phase5.json'),JSON.stringify(report,null,2));
    console.log('PASS phase 5: '+JSON.stringify(report));
    console.log('PASS: live reduced motion, restored motion, offline local assets, missing GSAP/ScrollTrigger/controller and no-JS fallbacks. Artifacts: '+profile);
};
