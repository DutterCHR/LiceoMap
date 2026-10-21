// Deterministic lifecycle checks without timers, network or a browser dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8').split('const hamburgerToggle')[0];

function create(mode = '') {
    const target = () => {
        const listeners = new Map();
        return {
            listeners,
            addEventListener(type, fn) {
                if (!listeners.has(type)) listeners.set(type, new Set());
                listeners.get(type).add(fn);
            },
            removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
            emit(type, event = {}) { [...(listeners.get(type) || [])].forEach(fn => fn(event)); }
        };
    };
    const animations = [], observers = [], timers = [];
    const animate = (owner) => (frames, options) => {
        if ((mode === 'error' && owner === 'intro') || (mode === 'entry-error' && owner === 'entrance')) throw Error('Animation unavailable');
        const animation = { owner, frames, options, playState: 'running',
            cancel() { this.playState = 'idle'; }, play() { this.playState = 'running'; },
            pause() { this.playState = 'paused'; } };
        animations.push(animation);
        return animation;
    };
    const motion = { ...target(), matches: mode === 'reduce' };
    const skip = target();
    const title = { setAttribute() {}, focus() { this.focused = true; } };
    const entrance = { animate: animate('entrance') }, floating = { animate: animate('float') };
    const selectors=['.eyebrow','h1','.scene-lead','.scene-actions','.scene-note'];
    const hero=selectors.map((selector,index)=>({animate:animate('hero-'+index)}));
    const scene = { querySelector: selector => selector === '.phone-entrance' ? entrance : floating };
    const intro = { hidden: true, animate: mode === 'unsupported' ? undefined : animate('intro'),
        querySelector: selector => selector === '.intro-skip' ? skip : { animate: animate('intro') },
        querySelectorAll: () => Array.from({ length: 3 }, () => ({ animate: animate('intro') })),
        contains: element => element === skip };
    const document = { ...target(), hidden: false, activeElement: skip,
        documentElement: { classList: new Set(['intro-preparing']) },
        querySelector: selector => selector==='.hero-phone'?scene:hero[selectors.indexOf(selector.replace('.hero ',''))],
        getElementById: id => id === 'app-preloader' ? intro : title };
    class IntersectionObserver {
        constructor(callback) { if (mode === 'observer-error') throw Error('Observer unavailable'); this.callback = callback; observers.push(this); }
        observe() {}
        disconnect() { this.disconnected = true; }
        show(visible) { this.callback([{ isIntersecting: visible }]); }
    }
    const window = { ...target(), matchMedia: () => motion, scrollY: mode === 'scrolled' ? 100 : 0,
        location: { hash: mode === 'hash' ? '#mapa-container' : '' },
        setTimeout: fn => (timers.push(fn), timers.length), clearTimeout() {} };
    if (mode !== 'no-observer') window.IntersectionObserver = IntersectionObserver;
    document.documentElement.classList.contains = document.documentElement.classList.has.bind(document.documentElement.classList);
    document.documentElement.classList.remove = document.documentElement.classList.delete.bind(document.documentElement.classList);
    const controllers=vm.runInNewContext(source+'\n;({revealHeroPhone});', { document, window, IntersectionObserver, initStory: () => ({ setPaused() {} }) });
    return { document, window, motion, skip, title, intro, animations, observers, timers, controller:controllers.revealHeroPhone };
}

for (const mode of ['skip', 'escape', 'scroll', 'focus', 'timeout', 'reduce', 'unsupported', 'hash', 'scrolled', 'error']) {
    const state = create(mode);
    if (mode === 'skip') state.skip.emit('click');
    if (mode === 'escape') state.document.emit('keydown', { key: 'Escape' });
    if (mode === 'scroll') state.window.emit('scroll');
    if (mode === 'focus') state.document.emit('focusin', { target: {} });
    if (mode === 'timeout') state.timers[0]();
    assert(state.intro.hidden, mode);
    assert(!state.document.documentElement.classList.contains('intro-preparing'), mode + ': early preparation released');
    assert.equal(state.observers.length, 0, mode + ': static phone fallback');
    assert(state.animations.filter(animation=>animation.owner.startsWith('hero-')).every(animation=>animation.playState==='idle'),mode+': no hidden hero remains');
}
const state = create();
assert(!state.intro.hidden);
assert(state.document.documentElement.classList.contains('intro-preparing'),'Phone hidden before and during loader fade');
assert.equal(state.observers.length, 0, 'No phone motion under loader');
assert.equal(state.animations.filter(animation=>animation.owner.startsWith('hero-') && animation.playState==='paused').length,5,'Hero prepared behind loader');
state.document.hidden=true; state.document.emit('visibilitychange');
state.document.hidden=false; state.document.emit('visibilitychange');
assert(state.animations.filter(animation=>animation.owner.startsWith('hero-')).every(animation=>animation.playState==='paused'),'Returning to tab cannot start hero before entry');
state.animations.at(-1).onfinish();
assert(state.intro.hidden);
assert(state.title.focused);
const observer = state.observers[0];
observer.show(false);
assert(!state.animations.some(animation => animation.owner === 'entrance'));
observer.show(true);
assert(!state.document.documentElement.classList.contains('intro-preparing'),'Reveal only after native entry first frame exists');
const entry = state.animations.at(-1);
assert.equal(entry.owner, 'entrance');
assert(entry.frames[0].transform.includes('translate3d(0, 100vh'));
assert(observer.disconnected, 'Entry observer released as soon as entry starts');
assert(state.animations.filter(animation=>animation.owner.startsWith('hero-')).every(animation=>animation.playState==='running'),'Hero and phone start together');
state.document.hidden=true; state.document.emit('visibilitychange');
assert.equal(entry.playState,'paused');
assert(state.animations.filter(animation=>animation.owner.startsWith('hero-')).every(animation=>animation.playState==='paused'),'Hidden tab pauses entire entrance');
state.document.hidden=false; state.document.emit('visibilitychange');
entry.onfinish();
assert.equal(entry.playState, 'idle', 'Entry releases its animation after completion');
assert(state.animations.filter(animation=>animation.owner.startsWith('hero-')).every(animation=>animation.playState==='idle'),'Finished entry clears all hero effects');

const reduced = create();
reduced.animations.at(-1).onfinish();
reduced.observers[0].show(true);
reduced.motion.matches = true;
reduced.motion.emit('change');
assert(reduced.observers[0].disconnected);
assert.equal(reduced.animations.at(-1).playState, 'idle');
assert(reduced.animations.filter(animation=>animation.owner.startsWith('hero-')).every(animation=>animation.playState==='idle'));
const interrupted=create();
interrupted.animations.at(-1).onfinish(); interrupted.observers[0].show(true);
interrupted.controller.setPaused(true);
assert(interrupted.animations.filter(animation=>animation.owner.startsWith('hero-') || animation.owner==='entrance').every(animation=>animation.playState==='idle'),'Administration settles complete entry');
const unsupported = create('no-observer');
unsupported.animations.at(-1).onfinish();
assert.equal(unsupported.observers.length, 0);
for (const mode of ['entry-error', 'observer-error']) {
    const failed = create(mode);
    failed.animations.at(-1).onfinish();
    if (mode === 'entry-error') failed.observers[0].show(true);
    assert(!failed.document.documentElement.classList.contains('intro-preparing'),mode+': fail open');
    assert(failed.animations.filter(item=>item.owner.startsWith('hero-')).every(item=>item.playState==='idle'),mode+': hero also released');
}
const expired = create();
expired.document.documentElement.classList.remove('intro-preparing');
expired.animations.at(-1).onfinish();
assert.equal(expired.observers.length,0,'Expired early safety cannot launch a late entry after showing static phone');
console.log('PASS: loader exits, natural handoff, deferred entry, no idle float loop, reduced-motion cleanup, static fallbacks.');
