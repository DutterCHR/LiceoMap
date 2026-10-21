// Observe every rendering opportunity across the real loader/entry handoff.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
module.exports = async function({call,evaluate,navigate,until,screenshot,profile,web,diagnose}) {
    if (!diagnose && process.argv.includes('--phase52-integrity')) require('./phase52-integrity.cjs');
    if (!diagnose && process.argv.includes('--phase5-integrity') && !process.argv.includes('--phase52-integrity')) require('./phase5-integrity.cjs');
    if (!diagnose && !process.argv.includes('--phase5-integrity') && !process.argv.includes('--phase52-integrity')) {
        const reference=JSON.parse(fs.readFileSync(path.join(web,'tests/fixtures/phase44-integrity.json'),'utf8'));
        for (const [file,expected] of Object.entries(reference.hashes)) {
            let bytes=fs.readFileSync(path.join(web,file));
            if (/\.(html|css|js)$/.test(file)) {
                let source=bytes.toString('utf8').replace(/\r\n/g,'\n');
                if (file==='index.html') source=source.replace(/^    <!-- Phase 4\.5:[\s\S]*?    <!-- \/Phase 4\.5 -->\n/m,'');
                if (file==='style.css') source=source.replace(/^\/\* Phase 4\.5:[\s\S]*?\/\* \/Phase 4\.5 \*\/\n/m,'');
                if (file==='app.js') source=source.replace(/function initHeroPhone\(\) \{[\s\S]*?\nconst revealHeroPhone/,'function initHeroPhone() { /* entry controller */ }\nconst revealHeroPhone');
                bytes=Buffer.from(source);
            }
            assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),expected,'Unchanged outside minimal entry preparation: '+file);
        }
    }
    const probe = await call('Page.addScriptToEvaluateOnNewDocument', {source:`
        window.__phase45={frames:[],done:false,entries:0};
        let firstEntryAt;
        let previousAnimation;
        const sample=now=>{
            const phone=document.querySelector('.phone-entrance');
            const intro=document.querySelector('#app-preloader');
            if(phone && intro){
                const style=getComputedStyle(phone);
                const animation=phone.getAnimations()[0];
                if(animation && animation!==previousAnimation){
                    previousAnimation=animation;
                    window.__phase45.entries++;
                    window.__phase45.entry={frames:animation.effect.getKeyframes().map(({opacity,transform})=>({opacity:Number(opacity),transform})),
                        duration:animation.effect.getTiming().duration,easing:animation.effect.getTiming().easing};
                }
                if(animation && firstEntryAt===undefined) firstEntryAt=now;
                window.__phase45.frames.push({time:now,hidden:intro.hidden,
                    overlay:Number(getComputedStyle(intro).opacity),visibility:style.visibility,
                    opacity:Number(style.opacity),transform:style.transform,
                    animation:!!animation,animationTime:animation?.currentTime,
                    visibleChildren:[...phone.querySelectorAll('.phone-device,.screen-layer')].some(el=>getComputedStyle(el).visibility==='visible' && Number(getComputedStyle(el).opacity)>.01),
                    pending:document.documentElement.classList.contains('intro-preparing')});
            }
            if(now<(firstEntryAt===undefined?10000:firstEntryAt+1700)) requestAnimationFrame(sample);
            else window.__phase45.done=true;
        }; requestAnimationFrame(sample);`});
    const report=[];
    const onlyFallbacks=process.argv.includes('--phase45-fallbacks');
    for (const [width,height] of onlyFallbacks?[]:[[1280,720],[390,844]]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
        for(const mode of diagnose?['navigate']:['navigate','reload','hard-reload']) {
            if(mode==='navigate') await navigate();
            else {
                await evaluate('window.__phase45.done=false');
                await call('Page.reload',{ignoreCache:mode==='hard-reload'});
                await until(()=>evaluate('window.__phase45?.done === true'),'reload frame audit');
            }
            await until(()=>evaluate('window.__phase45?.done === true'),'complete loader/entry frame audit');
            const frames=await evaluate('window.__phase45.frames');
            fs.writeFileSync(path.join(profile,'frames-'+width+'-'+mode+'.json'),JSON.stringify(frames,null,2));
            const firstEntry=frames.findIndex(frame=>frame.animation);
            assert(firstEntry>=0,'Natural phone entry was sampled');
            const premature=frames.slice(0,firstEntry).filter(frame=>(frame.visibility==='visible' || frame.visibleChildren) && frame.opacity>.01);
            const fade=frames.filter(frame=>!frame.hidden && frame.overlay>0 && frame.overlay<.99);
            assert(fade.length>0,'Actual loader fade sampled');
            if(!diagnose) {
                const entry=await evaluate('({entries:window.__phase45.entries,entry:window.__phase45.entry})');
                assert.equal(entry.entries,1,'Exactly one native phone entry');
                assert.deepEqual(entry.entry,{frames:[
                    {opacity:0,transform:'translate3d(0px, 100vh, -180px) rotateX(25deg) rotateY(-35deg) rotateZ(-18deg) scale(0.72)'},
                    {opacity:1,transform:'translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)'}
                ],duration:1350,easing:'cubic-bezier(0.16, 1, 0.3, 1)'},'Original entry choreography unchanged');
                assert.equal(premature.length,0,'No visible final phone before entry: '+width+' '+mode);
                assert(fade.every(frame=>frame.visibility==='hidden'),'Phone stays hidden throughout loader fade');
                const end=frames.at(-1);
                assert(end.hidden && !end.pending && !end.animation && end.visibility==='visible' && end.opacity===1 && end.transform==='none','Entry releases into static identity: '+JSON.stringify(end));
                assert(frames.slice(firstEntry).filter(frame=>frame.animation).every(frame=>!frame.pending),'Entry owns visibility after preparation');
            }
            report.push({width,height,mode,frames,premature:premature.length});
            console.log(JSON.stringify({width,height,mode,frames:frames.length,premature:premature.length,fadeFrames:fade.length}));
            await screenshot('phase45-'+width+'-'+mode);
        }
    }
    fs.writeFileSync(path.join(profile,'phase45.json'),JSON.stringify(report,null,2));
    await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:probe.identifier});
    if (!diagnose) {
        if(onlyFallbacks){
            await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
            await navigate();await evaluate("document.querySelector('.intro-skip').click()");
        }
        const visibleStatic=()=>evaluate(`(() => {
            const phone=document.querySelector('.phone-entrance');
            return !document.documentElement.classList.contains('intro-preparing') &&
                getComputedStyle(phone).visibility==='visible' && getComputedStyle(phone).opacity==='1' &&
                phone.getAnimations().length===0;
        })()`);
        // Restoration must reveal the correct scroll pose, without replaying entry.
        await evaluate("(() => {const t=ScrollTrigger.getById('liceomap-cinema');scrollTo({top:t.start+.43*(t.end-t.start),behavior:'instant'});})()");
        await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
        const savedScroll=await evaluate('scrollY');
        await evaluate('window.__phase45Reloading=true');
        await call('Page.reload');
        await until(()=>evaluate("!window.__phase45Reloading && document.readyState==='complete' && typeof initCinematicIntro==='function'"),'reloaded document');
        // Existing ScrollTrigger uses manual restoration. Replay the saved position
        // explicitly when Chrome does not restore it; do not change page behavior.
        const manual=await evaluate("history.scrollRestoration==='manual' && scrollY===0");
        if(manual) await evaluate(`scrollTo({top:${savedScroll},behavior:'instant'})`);
        console.log('Reload scroll check:',JSON.stringify({savedScroll,manualPositionReplay:manual}));
        await until(()=>evaluate("document.readyState==='complete' && scrollY>0 && document.querySelector('#app-preloader').hidden"),'restored scroll after reload');
        assert(await visibleStatic(),'Restored scroll bypasses entry');
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),1);
        // A direct section URL also bypasses the decorative introduction.
        const {pathToFileURL}=require('node:url');
        await call('Page.navigate',{url:'about:blank'});
        await until(()=>evaluate("location.href==='about:blank'"),'fresh document before section URL');
        await call('Page.navigate',{url:pathToFileURL(path.join(web,'index.html')).href+'#horarios'});
        await until(()=>evaluate("document.readyState==='complete' && typeof initCinematicIntro==='function' && document.querySelector('#app-preloader')?.hidden"),'section URL bypasses introduction');
        assert(await visibleStatic(),'Section navigation remains visible');
        // Native entry also works when both GSAP scripts are unavailable.
        await call('Network.setBlockedURLs',{urls:['https://*','http://*','*gsap-3.15.0*','*ScrollTrigger-3.15.0*']});
        await call('Page.navigate',{url:'about:blank'});
        await until(()=>evaluate("location.href==='about:blank'"),'fresh document before GSAP fallback');
        await navigate();
        await until(()=>evaluate("document.querySelector('#app-preloader').hidden"),'native fallback loader');
        await until(visibleStatic,'native entry without GSAP');
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),0);
        await screenshot('phase45-no-gsap');
        // Broken/missing app.js cannot leave the early preparation class forever.
        await call('Network.setBlockedURLs',{urls:['https://*','http://*','*app.js*']});
        await navigate(false);
        assert(await evaluate("document.documentElement.classList.contains('intro-preparing') && getComputedStyle(document.querySelector('.phone-entrance')).visibility==='hidden'"),'Preparation precedes deferred app initialization');
        await until(visibleStatic,'early preparation safety timeout with missing app.js');
        assert(await evaluate("document.querySelector('#app-preloader').hidden"));
        await screenshot('phase45-missing-app');
        console.log('PASS: restored scroll, section URL, native no-GSAP entry and missing-app safety fallback.');
    }
    console.log('Phase 4.5 frame report: '+path.join(profile,'phase45.json'));
};
