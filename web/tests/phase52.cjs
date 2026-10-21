const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async function({call,evaluate,navigate,until,screenshot,profile,web,reviewDirectory='phase52'}) {
    const privacyProbe=await call('Page.addScriptToEvaluateOnNewDocument',{source:`
        window.__phase52Effects={network:0,storage:0,logs:0,submits:0};
        const track=(target,key,counter)=>{const original=target[key];target[key]=function(...args){window.__phase52Effects[counter]++;return original.apply(this,args);};};
        track(window,'fetch','network');track(XMLHttpRequest.prototype,'send','network');track(navigator,'sendBeacon','network');
        track(Storage.prototype,'setItem','storage');track(console,'log','logs');
        document.addEventListener('submit',event=>{if(event.target.id==='student-demo-form')window.__phase52Effects.submits++;});
    `});
    const frame=()=>evaluate(`(async()=>{
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        while(window.ScrollTrigger?.getAll().some(t=>t.getTween()?.isActive?.())) await new Promise(requestAnimationFrame);
    })()`);
    const seek=async time=>{await evaluate(`(()=>{const t=ScrollTrigger.getById('liceomap-cinema');scrollTo({top:t.start+${time}/t.animation.duration()*(t.end-t.start),behavior:'instant'})})()`);await frame();};
    const finale=async progress=>{await evaluate(`(()=>{const t=ScrollTrigger.getById('liceomap-finale');scrollTo({top:t.start+${progress}*(t.end-t.start),behavior:'instant'})})()`);await frame();};
    const report=[];
    const snapshot=()=>evaluate("JSON.stringify([...document.querySelectorAll('.purpose-origin-outro,.purpose-dusk,.purpose-outro-edge,.demo-night,.demo-title-line,.demo-interface-reveal,.demo-coordinate,.demo-edge-night')].map(el=>el.style.cssText))");
    for(const [width,height] of [[1280,720],[1440,900],[390,844],[320,720],[768,1024],[375,780]]) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<900});
        await navigate();
        await evaluate("document.querySelector('.intro-skip').click();document.fonts.ready");
        const immersive=await evaluate("document.querySelector('#proyecto').classList.contains('is-immersive')");
        for(const time of [13.4,15.8,18.8,24.1]) {
        if(!immersive) {await evaluate("scrollTo({top:document.querySelector('#vision').getBoundingClientRect().top+scrollY-130,behavior:'instant'})");await frame();assert(await evaluate("[...document.querySelectorAll('.purpose-chapter')].every(el=>!el.inert && getComputedStyle(el).visibility==='visible')"));continue;}
            await seek(time);
            await screenshot('phase52-'+width+'-chapter-'+time);
            const reading=await evaluate(`(()=>{
                const visible=el=>{for(let p=el;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.95)return false;}return true;};
                return {width:innerWidth,time:${time},outside:[...document.querySelectorAll('.purpose-chapter h2,.purpose-chapter p,.purpose-chapter a,.purpose-deck p,.purpose-deck h3,.purpose-nav')].filter(visible).filter(el=>{const r=el.getBoundingClientRect();return r.width&&(r.top<64||r.bottom>innerHeight-12||r.left<0||r.right>innerWidth)}).map(el=>({text:el.textContent.slice(0,50),font:getComputedStyle(el).fontSize,rect:el.getBoundingClientRect().toJSON()}))};
            })()`);
            assert.deepEqual(reading.outside,[],JSON.stringify(reading));
            if(time===18.8) assert(await evaluate("(()=>{const hub=document.querySelector('.purpose-hub').getBoundingClientRect(),card=document.querySelector('.purpose-deck .purpose-friction').getBoundingClientRect();return card.top>=hub.bottom-1})()"),'Hub remains above connected cards');
        }
        assert(await evaluate("(()=>{const el=document.querySelector('.purpose-intro .purpose-copy');return parseFloat(getComputedStyle(el).fontSize)>="+(width>900?17:16)+"})()"),'Main reading size');
        const states=[];
        for(const progress of [0,.25,.5,.75,1]) {
            await finale(progress);await screenshot('phase52-'+width+'-finale-'+progress);states.push(await snapshot());
            assert.equal(await evaluate("document.querySelector('#course-demo').dataset.state"),'identity','Scrolling never starts simulation');
        }
        for(let i=4;i>=0;i--) {await finale(i*.25);assert.equal(await snapshot(),states[i],'Finale reconstructs on reverse scroll');}
        await finale(1);
        assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'),'No horizontal overflow');
        // Scroll to the interface on mobile: the unpinned ending stays in native flow.
        await evaluate("document.querySelector('#course-demo').scrollIntoView({block:'start',behavior:'instant'})");await frame();
        const box=()=>evaluate("(()=>{const r=document.querySelector('#course-demo').getBoundingClientRect();return {height:r.height,width:r.width,top:r.top}})()");
        const originalBox=await box();
        const axIdentity=await call('Accessibility.getFullAXTree');
        assert(axIdentity.nodes.some(n=>!n.ignored && n.role?.value==='button' && n.name?.value==='Ver demostraci'+String.fromCharCode(243)+'n'),'Accessible start button');
        assert(!axIdentity.nodes.some(n=>!n.ignored && n.name?.value==='3'+String.fromCharCode(176)+' Medio A'),'Inactive result absent from accessibility tree');
        await evaluate("document.querySelector('#course-demo-start').focus()");
        assert.equal(await evaluate('document.activeElement.id'),'course-demo-start','Start receives keyboard focus');
        await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
        await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
        assert.equal(await evaluate("document.querySelector('#course-demo').dataset.state"),'process');
        assert.equal(await evaluate('document.activeElement.id'),'course-demo-skip');
        await screenshot('phase52-'+width+'-process');
        await until(()=>evaluate("document.querySelector('#course-demo').dataset.state==='result'"),'Demo result');
        await until(()=>evaluate("Number(getComputedStyle(document.querySelector('.demo-result-card')).opacity)===1"),'Confirmation settles');
        assert.equal(await evaluate("document.querySelector('#rut-input').value"),'','No personal identifier required');
        assert.equal(await evaluate('document.activeElement.id'),'course-result-title');
        assert.equal(await evaluate("document.querySelector('#course-stage').getAttribute('aria-busy')"),'false');
        assert.equal(await evaluate("document.querySelector('#course-result-title').textContent"),'3'+String.fromCharCode(176)+' Medio A');
        const resultBox=await box();
        assert(Math.abs(resultBox.height-originalBox.height)<1,'Interface reserves space across states: '+JSON.stringify({width,originalBox,resultBox}));
        await screenshot('phase52-'+width+'-result');
        for(let i=0;i<2;i++) {
            await evaluate("document.querySelector('#course-demo-repeat').click();document.querySelector('#course-demo-skip').click()");await frame();
            assert.equal(await evaluate("document.querySelector('#course-demo').dataset.state"),'result','Skip and repeat');
            assert.equal(await evaluate("document.querySelector('#course-result-title').textContent"),'3'+String.fromCharCode(176)+' Medio A','Fixed fictional course');
        }
        await evaluate("document.querySelector('.demo-manual').open=true;document.querySelector('#rut-input').value='12';document.querySelector('#student-demo-form').requestSubmit()");
        assert.equal(await evaluate("document.querySelector('#rut-input').getAttribute('aria-invalid')"),'true');
        await evaluate("document.querySelector('#rut-input').value='227096314';document.querySelector('#rut-input').dispatchEvent(new Event('input'));document.querySelector('#student-demo-form').requestSubmit()");
        assert.equal(await evaluate("document.querySelector('#rut-input').getAttribute('aria-invalid')"),'false');
        assert(await evaluate("document.querySelector('#student-demo-status').textContent.includes('3'+String.fromCharCode(176)+' Medio A') && !document.querySelector('#student-demo-status').textContent.includes('detectado')"),'Validator only reports demonstration');
        assert.deepEqual(await evaluate('window.__phase52Effects'),{network:0,storage:0,logs:0,submits:2},'No requests, storage, console identifiers or submissions from scrolling/simulation');
        await screenshot('phase52-'+width+'-manual');
        report.push({width,height,immersive,reverse:true,keyboard:true,fixedResult:true,validator:true,stableLayout:true});
    }
    // Reduced motion must complete immediately, even if changed during a run.
    await evaluate("document.querySelector('.demo-manual').open=false;document.querySelector('#course-demo-repeat').click()");
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await until(()=>evaluate("document.querySelector('#course-demo').dataset.state==='result' && !ScrollTrigger.getById('liceomap-finale')"),'Reduced motion completes and reverts');
    assert(await evaluate("[...document.querySelectorAll('.demo-title-line,.demo-interface-reveal,.purpose-origin-outro')].every(el=>getComputedStyle(el).transform==='none'&&Number(getComputedStyle(el).opacity)===1)"),'Reduced motion cleans transforms');
    await evaluate("document.querySelector('#course-demo-repeat').click()");
    assert.equal(await evaluate("document.querySelector('#course-demo').dataset.state"),'result','Reduced motion has no wait');
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await until(()=>evaluate("!!ScrollTrigger.getById('liceomap-finale')"),'Motion restores');
    // A conservative bright ambient background for all narrative body colors.
    const contrast=await evaluate(`(()=>{
        const luminance=rgb=>rgb.map(n=>n/255).map(n=>n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
        const background=luminance([43,85,85]);
        return [...document.querySelectorAll('.purpose-copy,.purpose-friction > p,.purpose-pillar p,.app-preview-text > p,.demo-view-copy,.demo-live')].map(el=>({class:el.className,ratio:(luminance(getComputedStyle(el).color.match(/[0-9.]+/g).slice(0,3).map(Number))+.05)/(background+.05)}));
    })()`);
    assert(contrast.every(item=>item.ratio>=4.5),'Body contrast: '+JSON.stringify(contrast));
    await call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
    await navigate();await evaluate("document.querySelector('.intro-skip').click();document.fonts.ready");
    const timing=await evaluate(`(async()=>{
        const t=ScrollTrigger.getById('liceomap-finale'),intervals=[];let previous;
        for(let i=0;i<180;i++){const now=await new Promise(requestAnimationFrame);if(previous)intervals.push(now-previous);previous=now;scrollTo({top:t.start+i/179*(t.end-t.start),behavior:'instant'});}
        const sorted=[...intervals].sort((a,b)=>a-b);
        return {samples:intervals.length,medianMs:sorted[Math.floor(sorted.length*.5)],p95Ms:sorted[Math.floor(sorted.length*.95)],over34ms:intervals.filter(n=>n>34).length};
    })()`);
    console.log('Finale synthetic rendering: '+JSON.stringify(timing));
    fs.writeFileSync(path.join(profile,'phase52-performance.json'),JSON.stringify(timing,null,2));
    // Opening administration during the final interaction freezes it without
    // changing its original modal, focus trap or scroll locking implementation.
    await evaluate("document.querySelector('#course-demo-start').click();document.querySelector('#btn-open-admin').click()");
    const paused=await evaluate("document.querySelector('#course-demo').dataset.state");
    await evaluate('new Promise(resolve=>setTimeout(resolve,1150))');
    assert.equal(await evaluate("document.querySelector('#course-demo').dataset.state"),paused,'Administration pauses the finite interaction');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape'});
    await until(()=>evaluate("document.querySelector('#course-demo').dataset.state==='result'"),'Interaction resumes after administration');
    // Exercise the interaction with animation dependencies missing.
    for(const blocked of ['*gsap-3.15.0*','*ScrollTrigger-3.15.0*']) {
        await call('Network.setBlockedURLs',{urls:['https://*','http://*',blocked]});await navigate();
        await evaluate("document.querySelector('.intro-skip').click();document.querySelector('#course-demo-start').click()");
        await until(()=>evaluate("document.querySelector('#course-demo').dataset.state==='result'"),'Missing dependency interaction');
        assert(await evaluate("[...document.querySelectorAll('.demo-title-line,.demo-interface-reveal')].every(el=>getComputedStyle(el).visibility==='visible'&&Number(getComputedStyle(el).opacity)===1)"),'Static ending readable');
    }
    await call('Network.setBlockedURLs',{urls:['https://*','http://*']});
    await call('Emulation.setScriptExecutionDisabled',{value:true});await navigate(false);
    await call('Emulation.setScriptExecutionDisabled',{value:false});
    assert(await evaluate("document.querySelector('.demo-static-result').textContent.includes('3'+String.fromCharCode(176)+' Medio A')"),'No-JS fictional result present');
    await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:privacyProbe.identifier});
    fs.writeFileSync(path.join(profile,'phase52.json'),JSON.stringify(report,null,2));
    const review=path.join(web,'review',reviewDirectory);fs.mkdirSync(review,{recursive:true});
    for(const suffix of ['1280-chapter-13.4','1280-chapter-15.8','1280-chapter-18.8','1280-chapter-24.1','1280-finale-0.5','1280-finale-1','1280-process','1280-result','390-chapter-15.8','390-chapter-18.8','390-chapter-24.1','390-finale-1','390-result'])
        fs.copyFileSync(path.join(profile,'phase52-'+suffix+'.png'),path.join(review,suffix+'.png'));
    fs.copyFileSync(path.join(profile,'phase52.json'),path.join(review,'checks.json'));
    fs.copyFileSync(path.join(profile,'phase52-performance.json'),path.join(review,'performance.json'));
    console.log('Visual inspection artifacts: '+profile);
};
