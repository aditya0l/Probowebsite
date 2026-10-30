// Sound design. Off until the visitor turns it on. Every cue is driven by the real animation
// state (lever angle, plate landing, camera travel, scroll speed), never by the button press alone.
const P = window.PBL, S = P.studio;
const { ScrollTrigger, RM } = P;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

let ctx = null, master, verb, on = false;
const now = () => ctx.currentTime;

/* ---------------------------------------------------------------- graph */
function impulse(sec, decay) {
  const r = ctx.sampleRate, len = r * sec | 0, b = ctx.createBuffer(2, len, r);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
  return b;
}
let noiseBuf;
const nb = () => { if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; };
function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = .004;
  master = ctx.createGain(); master.gain.value = 0; master.connect(comp).connect(ctx.destination);
  verb = ctx.createConvolver(); verb.buffer = impulse(2.8, 2.6); const wet = ctx.createGain(); wet.gain.value = .3; verb.connect(wet).connect(master);
  buildBeds();
}
function out(node, { pan = 0, send = .2 } = {}) {
  const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); p.connect(master);
  if (send) { const s = ctx.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); }
}
function env(g, t, a, peak, d) { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, .0002), t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
function tone(f, { type = 'sine', a = .004, d = .2, v = .05, to, pan, send, t = now() } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + a + d);
  env(g, t, a, v, d); o.connect(g); out(g, { pan, send }); o.start(t); o.stop(t + a + d + .05);
}
function noise({ f = 1000, q = .7, type = 'bandpass', a = .004, d = .2, v = .1, f2, pan, send, t = now() } = {}) {
  const s = ctx.createBufferSource(); s.buffer = nb(); s.loop = true;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
  const g = ctx.createGain(); env(g, t, a, v, d); s.connect(fl).connect(g); out(g, { pan, send }); s.start(t, Math.random()); s.stop(t + a + d + .05);
}
// struck steel: inharmonic partials plus a bright transient
function metal(f, { v = .08, d = .9, pan, send = .35, t = now() } = {}) {
  [1, 2.76, 5.4, 8.93].forEach((m, i) => tone(f * m, { a: .002, d: d / (1 + i * .7), v: v / (1 + i * 1.3), pan, send, t }));
  noise({ f: 4200, q: .5, a: .001, d: .04, v: v * 1.1, pan, send, t });
}

/* ---------------------------------------------------------------- one-shot cues */
const CUE = {
  click: () => tone(1900, { type: 'triangle', d: .035, v: .018, send: 0 }),
  slide: w => noise({ f: 2600, f2: 650, q: 1.3, a: .06, d: .48, v: .04 + w / 450, send: .08 }),           // plate travelling down the horn (0.6s tween)
  plate: w => { const f = 270 - w * 5; metal(f, { v: .05 + w / 260, d: .6 + w / 40 }); tone(f * .5, { d: .22, v: .06 + w / 220, send: .1 }); }, // fires on landing
  strip: n => { noise({ f: 900, f2: 2600, a: .02, d: .32, v: .06 }); for (let i = 0; i < Math.min(n, 6); i++) metal(300 + Math.random() * 140, { v: .028, d: .35, t: now() + .3 + i * .055, pan: i % 2 ? .45 : -.45 }); },
  lockout: pan => tone(300, { type: 'triangle', d: .14, v: .016, to: 360, pan, send: .1 }),                 // arm reaches the top of the rep
  touch: (load, vel, pan) => { const v = clamp(.035 + load / 320 + vel * .06, .03, .24); tone(72, { d: .26, v: v * 1.3, to: 44, pan, send: .15 }); if (load > 0) metal(185 - load * .8, { v: v * .55, d: .55, pan }); else noise({ f: 650, d: .07, v: v * .5, pan }); },
  step: (pan, big) => { noise({ f: 170 + Math.random() * 70, q: .9, type: 'lowpass', a: .003, d: .11, v: .2, pan, send: big ? .55 : .12 }); noise({ f: 2600, q: 1, a: .002, d: .025, v: .025, pan, send: big ? .4 : .08 }); },
  footfall: pan => { tone(62, { d: .1, v: .09, to: 40, pan, send: .05 }); noise({ f: 400, d: .05, v: .035, pan, send: 0 }); },
  whoosh: rev => noise({ f: rev ? 3200 : 240, f2: rev ? 240 : 3400, q: .6, a: .35, d: 1.05, v: .13, send: .45 }),
  bloom: () => { noise({ f: 220, f2: 1400, a: .7, d: 1.6, v: .06, send: .7 }); tone(110, { a: .5, d: 2.2, v: .045, send: .7 }); tone(164.8, { a: .6, d: 2.2, v: .03, send: .7 }); tone(220, { a: .8, d: 2.4, v: .02, send: .7 }); },
  tick: () => tone(2600, { type: 'square', d: .01, v: .009, send: 0 }),
  chime: () => { tone(880, { d: .5, v: .045 }); tone(1318.5, { d: .7, v: .035, t: now() + .1 }); },
  rise: i => tone(330 * Math.pow(2, i / 14), { d: .22, v: .022, send: .35, pan: (i % 2 ? .3 : -.3) }),
  msg: () => { tone(1046.5, { d: .07, v: .02 }); tone(1568, { d: .09, v: .016, t: now() + .055 }); },
  send: () => tone(784, { d: .06, v: .018, to: 1046.5 }),
  zone: () => { tone(523.3, { d: .7, v: .026, send: .7 }); tone(784, { d: .9, v: .02, send: .7, t: now() + .09 }); },
  scrub: v => noise({ f: 1100 + v * 45, q: 2.4, d: .028, v: .012 + Math.min(v, 18) * .0018, send: 0 }),
  paper: () => noise({ f: 2800, f2: 6200, q: .4, a: .02, d: .24, v: .045, send: .05 }),
  powerOn: () => { tone(220, { a: .02, d: .5, v: .04, to: 440, send: .3 }); tone(660, { a: .05, d: .6, v: .025, send: .4, t: now() + .12 }); },
};
const play = (k, ...a) => { if (on && ctx) CUE[k](...a); };

/* ---------------------------------------------------------------- continuous beds */
const BED = {};
function bed(build) { const g = ctx.createGain(); g.gain.value = 0; build(g); g.connect(master); return g; }
function loopNoise(type, f, q) { const s = ctx.createBufferSource(); s.buffer = nb(); s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; s.connect(fl); s.start(); return fl; }
function buildBeds() {
  // wind in the flight, brighter as altitude drops
  BED.wind = bed(g => { BED.windF = loopNoise('lowpass', 400, .5); BED.windF.connect(g); const s = ctx.createGain(); s.gain.value = .4; g.connect(s); s.connect(verb); });
  // showroom room tone: mains hum plus distant machines
  BED.hall = bed(g => { const h = ctx.createOscillator(); h.frequency.value = 50; const hg = ctx.createGain(); hg.gain.value = .25; h.connect(hg).connect(g); h.start(); loopNoise('lowpass', 160, .7).connect(g); const far = loopNoise('bandpass', 900, 4); const fg = ctx.createGain(); fg.gain.value = .25; far.connect(fg).connect(g); });
  // treadmill motor and belt
  BED.motor = bed(g => { BED.motorO = ctx.createOscillator(); BED.motorO.type = 'sawtooth'; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; BED.motorO.connect(lp).connect(g); BED.motorO.start(); const hiss = loopNoise('bandpass', 1900, 1.4); const hg = ctx.createGain(); hg.gain.value = .5; hiss.connect(hg).connect(g); });
  // flywheel whir
  BED.fly = bed(g => { BED.flyF = loopNoise('bandpass', 300, 5); BED.flyF.connect(g); BED.flyO = ctx.createOscillator(); BED.flyO.type = 'triangle'; const og = ctx.createGain(); og.gain.value = .25; BED.flyO.connect(og).connect(g); BED.flyO.start(); });
}
const set = (param, v, tc = .12) => param.setTargetAtTime(v, now(), tc);

/* ---------------------------------------------------------------- what is on screen */
const seen = {};
['#flight', '#walk', '#rig', '#mapWrap'].forEach(sel => { const el = $(sel); if (el) new IntersectionObserver(e => seen[sel] = e[0].isIntersecting).observe(el); });

/* ---------------------------------------------------------------- per-frame sync */
const MAX = .62, lever = { L: { prev: 0, peak: 0, top: false }, R: { prev: 0, peak: 0, top: false } };
let lastT = performance.now(), lastFp = P.flight(), lastWalkZ = null, walkAcc = 0, stepSide = 1, lastStepAt = 0, footAcc = 0, footSide = 1;
const perSide = () => S.levers.L.userData.plates.reduce((a, p) => a + p.userData.w, 0);
function frame(t) {
  const dt = Math.min(.1, (t - lastT) / 1000) || .016; lastT = t;
  if (on && ctx) {
    // flight: wind follows scroll speed, the lens opening gets its own cue
    const fp = P.flight(), dp = Math.abs(fp - lastFp) / dt;
    set(BED.wind.gain, seen['#flight'] && fp < .86 ? clamp(dp * 1.4, 0, .16) : 0, .18);
    set(BED.windF.frequency, 300 + clamp(fp / .84, 0, 1) * 2600, .3);
    if (lastFp < .8 && fp >= .8) { CUE.whoosh(false); setTimeout(() => play('bloom'), 450); }
    if (lastFp >= .8 && fp < .8) CUE.whoosh(true);
    if (lastFp < .925 && fp >= .925) for (let i = 1; i <= 26; i++) setTimeout(() => play('tick'), 1800 * (1 - Math.cbrt(1 - i / 26)));   // matches the power3.out count-up
    lastFp = fp;
    // walk: a footstep every 0.78 m of camera travel, room tone while inside
    const z = 16 + (-82 - 16) * P.walk();
    set(BED.hall.gain, seen['#walk'] && z < 10 ? .05 : 0, .4);
    if (seen['#walk'] && lastWalkZ !== null) {
      walkAcc += Math.abs(z - lastWalkZ);
      if (walkAcc > .78 && t - lastStepAt > 110) { walkAcc = 0; lastStepAt = t; stepSide *= -1; CUE.step(stepSide * .18, z < 10); }
    }
    lastWalkZ = z;
    // studio: lever lockout and touchdown, treadmill motor and footfalls, flywheel whir
    const studio = seen['#rig'];
    if (studio && S.cur === 'press') ['L', 'R'].forEach(sd => {
      const a = S.st.ang[sd], L = lever[sd], vel = Math.abs(a - L.prev) / dt, pan = sd === 'L' ? -.35 : .35;
      L.peak = Math.max(L.peak, a);
      if (!L.top && a > MAX * .85) { L.top = true; CUE.lockout(pan); }
      if (a < MAX * .5) L.top = false;
      if (L.prev >= .03 && a < .03 && L.peak > .15) { CUE.touch(perSide(), clamp(vel / 3, 0, 1), pan); L.peak = 0; }
      L.prev = a;
    });
    const train = studio && S.st.mode === 'train';
    const speed = train && S.cur === 'treadmill' ? S.st.speed : 0;
    set(BED.motor.gain, speed ? .018 + speed / 18 * .04 : 0, .25); set(BED.motorO.frequency, 32 + speed * 7, .3);
    if (speed > .5) { const spm = speed < 6.5 ? 100 + speed * 8 : 150 + speed * 2.2; footAcc += dt * spm / 60; if (footAcc >= 1) { footAcc = 0; footSide *= -1; CUE.footfall(footSide * .2); } }
    const rpm = train && S.cur === 'bike' ? S.st.rpm : 0;
    set(BED.fly.gain, rpm ? .015 + rpm / 130 * .05 : 0, .3); set(BED.flyF.frequency, 180 + rpm * 6, .3); set(BED.flyO.frequency, 40 + rpm * .9, .3);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------------------------------------------------------------- event wiring */
addEventListener('pbl:slide', e => play('slide', e.detail.w));
addEventListener('pbl:plate', e => play('plate', e.detail.w));
addEventListener('pbl:strip', e => play('strip', e.detail.n));
document.addEventListener('click', e => {
  if (e.target.closest('#plateBtns, #cchips, #sound, #clearPlates')) return;
  if (e.target.closest('#quotePrint')) return play('paper');
  if (e.target.closest('button, .btn, .chip')) play('click');
}, true);
$('#zoneT') && new MutationObserver(() => play('zone')).observe($('#zoneT'), { childList: true, characterData: true, subtree: true });
new MutationObserver(muts => muts.forEach(m => {
  m.addedNodes.forEach(n => { if (n.classList?.contains('me')) play('send'); });
  if (m.type === 'attributes' && m.target.classList.contains('bot') && !m.target.classList.contains('typing')) play('msg');
})).observe($('#clog') || document.createElement('i'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
$('#mapWrap') && ScrollTrigger.create({ trigger: '#mapWrap', start: 'top 70%', once: true, onEnter: () => { for (let i = 0; i < 21; i++) setTimeout(() => play('rise', i), 60 + i * 50); } }); // same trigger and stagger as the pillars
if ($('#baRange')) { let last = 50; $('#baRange').addEventListener('input', e => { const v = +e.target.value; play('scrub', Math.abs(v - last)); last = v; }); }
$('#bookDone') && new MutationObserver(() => { if (!$('#bookDone').hidden) play('chime'); }).observe($('#bookDone'), { attributes: true, attributeFilter: ['hidden'] });

/* ---------------------------------------------------------------- toggle */
const btn = $('#sound');
btn && btn.addEventListener('click', () => {
  init(); on = !on; ctx.resume();
  master.gain.cancelScheduledValues(now()); master.gain.setTargetAtTime(on ? 1 : 0, now(), .12);
  btn.setAttribute('aria-pressed', on); btn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  if (on) CUE.powerOn();
});

P.sfx = { chime: () => play('chime'), whoosh: rev => play('whoosh', rev), get on() { return on; } };
