// Chrome QA for the camera transition and immersive project story.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
module.exports = async function({call,evaluate,navigate,until,screenshot,profile,web,record=false}) {
    const fixture=path.join(web,'tests/fixtures/phase51-scenes.json');
    const times=[0,.4,1,1.3,1.78,2.32,2.8,3.4,4.32,4.8,5.4,6.32,6.8,7.4,8.32,8.8,9.4,9.9];
    const frame=()=>evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
    const seek=async seconds=>{
        await evaluate(`(()=>{const t=ScrollTrigger.getById('liceomap-cinema');scrollTo({top:t.start+${seconds}/t.animation.duration()*(t.end-t.start),behavior:'instant'})})()`);
        await frame();
    };
    const approvedState=()=>evaluate(`(()=>{
        const round=n=>Math.round(n*10000)/10000;
        const box=el=>{const r=el.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(round)};
        return [...document.querySelectorAll('.phone-story,.screen-layer,.story-scene,.story-scene h1,.story-scene h2,.story-card,.closing-map')].map(el=>{
            const s=getComputedStyle(el);return {box:box(el),opacity:s.opacity,visibility:s.visibility,matrix:[...new DOMMatrix(s.transform).toFloat64Array()].map(round)};
        });
    })()`);
    const references=record?{}:JSON.parse(fs.readFileSync(fixture,'utf8'));
    for(const [width,height] of [[1280,720],[390,844]]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
        if(!record) await call('Network.setBlockedURLs',{urls:['https://*','http://*','*purpose.js*']});
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click(); document.fonts.ready.then(()=>Promise.all([...document.querySelectorAll('.screen-layer')].map(i=>i.decode())))");
        await frame();
        const states=[], original=[];
        for(const seconds of times) {
            await seek(seconds);
            original.push(await approvedState());
            states.push(crypto.createHash('sha256').update(JSON.stringify(await approvedState())).digest('hex'));
        }
        if(record) references[width]={height,times,states};
        else {
            assert.deepEqual(states,references[width].states,'Original approved scene hashes: '+width);
            await call('Network.setBlockedURLs',{urls:['https://*','http://*']});
            await navigate();
            await evaluate("document.querySelector('.intro-skip').click();document.fonts.ready");
            for(let i=0;i<times.length;i++) {
                await seek(times[i]);
                const current=await approvedState();
                for(let j=0;j<current.length;j++) {
                    assert.equal(current[j].visibility,original[i][j].visibility);
                    assert(Math.abs(Number(current[j].opacity)-Number(original[i][j].opacity))<.003);
                    for(const key of ['box','matrix']) current[j][key].forEach((n,k)=>assert(Math.abs(n-original[i][j][key][k])<.12,
                        JSON.stringify({width,time:times[i],element:j,key,k,current:n,original:original[i][j][key][k]})));
                }
            }
        }
    }
    if(record) {
        fs.writeFileSync(fixture,JSON.stringify(references,null,2)+'\n');
        console.log('Recorded phase 5.0 approved scene states before phase 5.1 edits.');
        return;
    }
    console.log('PASS: 36 original scene hashes; same geometry after extension (<0.12 px scroll rounding).');
    const snapshot=()=>evaluate(`JSON.stringify([...document.querySelectorAll('.phone-story,.story-stage,.purpose-section,.purpose-section *')].map(el=>({style:el.style.cssText,hidden:el.getAttribute('aria-hidden'),inert:el.inert})))`);
    const geometry=()=>evaluate(`(()=>{
        const visible=el=>{for(let n=el;n&&n!==document.body;n=n.parentElement){const s=getComputedStyle(n);if(s.visibility==='hidden'||s.display==='none'||Number(s.opacity)<.95)return false;}return true;};
        const elements=[...document.querySelectorAll('.purpose-chapter h2,.purpose-chapter p,.purpose-chapter a,.purpose-friction,.purpose-friction h3,.purpose-friction p,.purpose-origin-caption,.purpose-nav')].filter(visible);
        return {outside:elements.filter(el=>{const r=el.getBoundingClientRect();return r.width && (r.left < -1 || r.right>innerWidth+1 || r.top<65 || r.bottom>innerHeight-14)}).map(el=>({text:el.textContent.slice(0,60),rect:el.getBoundingClientRect().toJSON()})),
            overflow:document.documentElement.scrollWidth>innerWidth,
            cards:[...document.querySelectorAll('.purpose-friction')].filter(visible).map(el=>el.getBoundingClientRect().toJSON())};
    })()`);
    const samples=[9.9,10.35,10.7,11.1,11.5,11.8,12.4,13.4,14.7,15.8,17.3,18.8,20,21.2,22.7,24.1,25.2];
    for(const [width,height] of [[1280,720],[390,844],[320,720],[768,1024],[1440,900]].filter(([width])=>!process.argv.includes('--quick')||width===1440)) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click();document.fonts.ready");
        assert.equal(await evaluate("document.querySelectorAll('.pin-spacer').length"),1);
        if(!await evaluate("document.querySelector('#proyecto').classList.contains('is-immersive')")) {
            assert(await evaluate("[...document.querySelectorAll('.purpose-chapter,.purpose-friction,.purpose-pillar')].every(el=>!el.inert && getComputedStyle(el).visibility==='visible' && Number(getComputedStyle(el).opacity)===1)"),'Readable narrow viewport fallback');
            console.log('PASS: natural readable document at '+width+'x'+height);
            continue;
        }
        const states=[];
        for(const time of samples) {
            await seek(time);
            if([1280,390,320].includes(width)) await screenshot('phase51-'+width+'-'+time);
            states.push(await snapshot());
            await evaluate('new Promise(resolve=>setTimeout(resolve,60))');
            assert.equal(await snapshot(),states.at(-1),'Stopped scroll holds '+width+' / '+time);
        }
        for(let i=samples.length-1;i>=0;i--) { await seek(samples[i]); assert.equal(await snapshot(),states[i],'Reverse scroll reconstructs '+width+' / '+samples[i]); }
        await seek(11.8);
        assert(await evaluate("(()=>{const r=document.querySelector('.purpose-screen-surface').getBoundingClientRect();return r.left<0&&r.top<0&&r.right>innerWidth&&r.bottom>innerHeight})()"),'Screen covers viewport before handoff');
        assert.equal(await evaluate("document.querySelectorAll('.phone-device').length"),1,'One device throughout');
        for(const time of [13.4,15.8,18.8,20,24.1,25.2]) {
            await seek(time);
            const result=await geometry();
            assert(!result.overflow && !result.outside.length,JSON.stringify({width,time,...result}));
            for(let i=1;i<result.cards.length;i++) {
                const a=result.cards[i-1],b=result.cards[i];
                assert(Math.min(a.right,b.right)-Math.max(a.left,b.left)<2 || Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)<2,'Reading cards overlap '+width+' / '+time);
            }
        }
        for(const id of ['que-es','problematica','objetivo','vision']) {
            await evaluate(`document.querySelector('.purpose-nav a[href="#${id}"]').click()`);
            await frame();
            assert.equal(await evaluate("document.querySelector('.purpose-nav [aria-current]')?.hash"),'#'+id);
            assert.equal(await evaluate('document.activeElement.id'),id,'Keyboard focus follows chapter link: '+JSON.stringify(await evaluate(`({time:ScrollTrigger.getById('liceomap-cinema').animation.time(),chapter:document.querySelector('#${id}').outerHTML.slice(0,500),root:document.querySelector('#proyecto').getAttribute('style'),inert:document.querySelector('#proyecto').inert,visibility:getComputedStyle(document.querySelector('#${id}')).visibility})`)));
        }
        const before=await snapshot();
        await evaluate("document.querySelector('#btn-open-admin').click();scrollBy({top:80,behavior:'instant'})");
        await frame();
        assert.equal(await snapshot(),before,'Administration freezes the complete master timeline');
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});
        await frame();
        await evaluate("document.querySelector('.purpose-skip').focus()");
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
        await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
        await until(()=>evaluate("document.querySelector('#app-preview').getBoundingClientRect().top<innerHeight"),'Keyboard skips to demo');
        console.log('PASS: cinematic geometry, screen coverage, held/reverse states, chapter focus, admin freeze, keyboard skip '+width+'x'+height);
    }
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await until(()=>evaluate("!document.querySelector('.is-immersive') && !document.querySelector('.pin-spacer')"),'Live reduced motion reverts pin');
    const readable=()=>evaluate(`({chapters:document.querySelectorAll('.purpose-chapter').length,visible:[...document.querySelectorAll('.purpose-chapter,.purpose-line,.purpose-friction,.purpose-pillar')].every(el=>{const s=getComputedStyle(el);return !el.inert && s.visibility==='visible' && Number(s.opacity)===1 && s.transform==='none';}),remaining:[...document.querySelectorAll('.purpose-chapter,.purpose-line,.purpose-friction,.purpose-pillar')].filter(el=>el.inert || getComputedStyle(el).visibility!=='visible'||Number(getComputedStyle(el).opacity)!==1||getComputedStyle(el).transform!=='none').map(el=>({class:el.className,style:el.style.cssText,inert:el.inert})),parent:document.querySelector('#proyecto').parentElement.id,pillars:document.querySelectorAll('.purpose-pillars > .purpose-pillar').length})`);
    let fallback=await readable();
    assert(fallback.visible && fallback.pillars===3,JSON.stringify(fallback));
    assert(await evaluate("getComputedStyle(document.querySelector('.phone-story')).transform==='none' && getComputedStyle(document.querySelector('.story-stage')).visibility==='visible' && Number(getComputedStyle(document.querySelector('.story-stage')).opacity)===1"),'Live preference restores the original static phone');
    await screenshot('phase51-reduced-motion');
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await until(()=>evaluate("!!document.querySelector('.is-immersive')"),'Live motion restored');
    await seek(18.8);
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:640,deviceScaleFactor:1,mobile:true});
    await until(()=>evaluate("!document.querySelector('.is-immersive')"),'Short viewport uses natural document flow');
    fallback=await readable();
    assert(fallback.visible && fallback.pillars===3,JSON.stringify(fallback));
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await until(()=>evaluate("!!document.querySelector('.is-immersive')"),'Portrait cinematic mode restored');
    for(const blocked of ['*gsap-3.15.0*','*ScrollTrigger-3.15.0*','*purpose.js*']) {
        await call('Network.setBlockedURLs',{urls:['https://*','http://*',blocked]});
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click()");
        fallback=await readable();
        assert(fallback.visible && fallback.chapters===4 && fallback.pillars===3,blocked+': '+JSON.stringify(fallback));
    }
    await call('Network.setBlockedURLs',{urls:['https://*','http://*']});
    await call('Emulation.setScriptExecutionDisabled',{value:true});
    await navigate(false);
    await call('Emulation.setScriptExecutionDisabled',{value:false});
    fallback=await readable();
    assert(fallback.visible && fallback.chapters===4,JSON.stringify(fallback));
    if(process.argv.includes('--video')) {
        await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click();document.fonts.ready");
        const timing=await evaluate(`(async()=>{
            const trigger=ScrollTrigger.getById('liceomap-cinema'),intervals=[];
            let last;
            for(let i=0;i<240;i++) {
                const now=await new Promise(requestAnimationFrame);
                if(last) intervals.push(now-last);last=now;
                scrollTo({top:trigger.start+(9.9+i/239*15.3)/trigger.animation.duration()*(trigger.end-trigger.start),behavior:'instant'});
            }
            const sorted=[...intervals].sort((a,b)=>a-b);
            return {frames:intervals.length,elapsedMs:intervals.reduce((a,b)=>a+b,0),medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],over34ms:intervals.filter(n=>n>34).length};
        })()`);
        fs.writeFileSync(path.join(profile,'phase51-performance.json'),JSON.stringify(timing,null,2));
        console.log('Synthetic Chrome rendering sample: '+JSON.stringify(timing));
        const frames=[];
        for(let i=0;i<104;i++) {
            await seek(9.9+i/103*15.3);
            frames.push((await call('Page.captureScreenshot',{format:'jpeg',quality:78})).data);
        }
        // Encode captured browser frames with native MediaRecorder: no new dependency.
        // This review clip is sampled at 12 fps; it is not an FPS benchmark.
        await call('Page.navigate',{url:'about:blank'});
        await evaluate('new Promise(resolve=>setTimeout(resolve,100))');
        const video=await evaluate(`(async()=>{
            const images=${JSON.stringify(frames)},canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
            const ctx=canvas.getContext('2d'),stream=canvas.captureStream(12),chunks=[];
            const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8',videoBitsPerSecond:1800000});
            const stopped=new Promise(resolve=>recorder.onstop=resolve);recorder.ondataavailable=e=>chunks.push(e.data);
            recorder.start();
            for(const data of images){const img=new Image();img.src='data:image/jpeg;base64,'+data;await img.decode();ctx.drawImage(img,0,0);await new Promise(resolve=>setTimeout(resolve,84));}
            recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
            return await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
        })()`);
        fs.writeFileSync(path.join(profile,'phase51-review.webm'),Buffer.from(video,'base64'));
        const review=path.join(web,'review','phase51');
        fs.mkdirSync(review,{recursive:true});
        fs.copyFileSync(path.join(profile,'phase51-review.webm'),path.join(review,'recorrido.webm'));
        fs.copyFileSync(path.join(profile,'phase51-performance.json'),path.join(review,'performance.json'));
        for(const name of ['1280-11.1','1280-13.4','1280-15.8','1280-18.8','1280-24.1','390-15.8','390-24.1'])
            fs.copyFileSync(path.join(profile,'phase51-'+name+'.png'),path.join(review,name+'.png'));
        console.log('Review clip: '+path.join(profile,'phase51-review.webm'));
    }
    console.log('PASS: live reduced motion, restored motion, missing dependencies/controller and no-JS semantic document. Artifacts: '+profile);
};
