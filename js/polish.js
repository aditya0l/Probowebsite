// Visual polish. Motion personality: premium. One signature ease (expo.out for entrances),
// three durations (0.18s feedback, 0.45s UI, 0.9s reveals), one entrance pattern (masked rise).
import Lenis from 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.mjs';

const P = window.PBL;
const { gsap, ScrollTrigger, RM, THREE } = P;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const EASE = 'expo.out', T = { quick: .18, ui: .45, reveal: .9 };
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

/* ---------------------------------------------------------------- smooth scroll */
if (!RM) {
  const lenis = new Lenis({ lerp: .085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return; const id = a.getAttribute('href'); if (id.length < 2) return;
    const el = document.querySelector(id); if (!el) return; e.preventDefault(); lenis.scrollTo(el, { offset: id === '#flight' ? 0 : -68, duration: 1.6 });
  });
  $$('dialog, #cpanel, #clog, .city-list').forEach(el => el.setAttribute('data-lenis-prevent', ''));
  P.lenis = lenis;
}

/* ---------------------------------------------------------------- film grain */
{
  const c = document.createElement('canvas'); c.width = c.height = 220; const g = c.getContext('2d'), d = g.createImageData(220, 220);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); $('.grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ---------------------------------------------------------------- progress + active nav */
gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: .3 } });
[['#flight', '#flight'], ['#walk', '#walk'], ['#machine', '#machine'], ['#plan', '#plan'], ['#proof', '#proof']].forEach(([sec, href]) => {
  const link = $(`.nav ul a[href="${href}"]`), el = $(sec); if (!link || !el) return;
  ScrollTrigger.create({ trigger: el, start: 'top 50%', end: 'bottom 50%', onToggle: s => link.classList.toggle('is-active', s.isActive) });
});

/* ---------------------------------------------------------------- masked word reveals */
function split(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.w>span')];
  const walk = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) { const frag = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) frag.append(t); else { const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.textContent = t; w.append(i); frag.append(w); } }); n.replaceWith(frag); }
    else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
  });
  walk(el); el.dataset.split = 1; return [...el.querySelectorAll('.w>span')];
}
if (!RM) {
  $$('.sec h2.display, .m-head h2, .ba-head h3, #visit h2, #walk .zone h2').forEach(el => {
    if (el.id === 'zoneT') return;
    const words = split(el);
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({ trigger: el, start: 'top 86%', once: true, onEnter: () => gsap.to(words, { yPercent: 0, duration: T.reveal, ease: EASE, stagger: Math.min(.06, .45 / words.length) }) });
  });
  // sub copy follows the headline as the secondary layer
  $$('.sec .sub, .m-head p').forEach(el => gsap.from(el, { scrollTrigger: { trigger: el, start: 'top 90%', once: true }, y: 18, opacity: 0, duration: T.reveal, delay: .15, ease: EASE }));
}

/* ---------------------------------------------------------------- hero intro, after the loader */
if (!RM && $('.hero h1')) {
  const h1 = split($('.hero h1')), rest = ['.hero p', '.hero .ctas .btn'];
  gsap.set(h1, { yPercent: 110 }); gsap.set(rest, { y: 20, opacity: 0 }); gsap.set('#earth', { scale: 1.08, opacity: 0 }); gsap.set('.nav', { y: -20, opacity: 0 });
  const go = () => {
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.to('#earth', { scale: 1, opacity: 1, duration: 2.2 }, 0)
      .to(h1, { yPercent: 0, duration: 1.1, stagger: .07 }, .35)
      .to('.hero p', { y: 0, opacity: 1, duration: T.reveal }, .8)
      .to('.hero .ctas .btn', { y: 0, opacity: 1, duration: T.reveal, stagger: .08 }, .95)
      .to('.nav', { y: 0, opacity: 1, duration: T.reveal }, 1);
  };
  const ld = $('#loader');
  if (!ld || ld.classList.contains('done')) go(); else new MutationObserver((m, o) => { if (ld.classList.contains('done')) { o.disconnect(); go(); } }).observe(ld, { attributes: true });
}

/* ---------------------------------------------------------------- magnetic CTAs */
if (fine && !RM) $$('.btn-primary, .cbtn').forEach(el => {
  el.style.transition = 'background .2s, border-color .2s';
  const icon = el.querySelector('i');
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    gsap.to(el, { x: dx * .22, y: dy * .3, duration: T.ui, ease: 'power3.out' }); if (icon) gsap.to(icon, { x: dx * .12, duration: T.ui, ease: 'power3.out' });
  });
  el.addEventListener('pointerleave', () => { gsap.to(el, { x: 0, y: 0, duration: .7, ease: EASE }); if (icon) gsap.to(icon, { x: 0, duration: .7, ease: EASE }); });
});

/* ---------------------------------------------------------------- the numbers band (one marquee, reacts to scroll velocity) */
if ($('#mq')) {
  const track = $('#mq'), set = track.querySelector('.mq-set'); track.append(set.cloneNode(true)); track.lastChild.setAttribute('aria-hidden', 'true');
  if (!RM) {
    let x = 0, boost = 0, dir = -1; const w = () => set.offsetWidth;
    ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onUpdate: s => { const v = s.getVelocity(); boost = Math.min(Math.abs(v) / 120, 14); dir = v < 0 ? 1 : -1; } });
    gsap.ticker.add((t, dt) => {
      boost *= .92; x += dir * (1 + boost) * dt * .06; const W = w(); if (x <= -W) x += W; if (x > 0) x -= W;
      gsap.set(track, { x, skewX: -dir * Math.min(boost, 8) * .6 });
    });
  }
}

/* ---------------------------------------------------------------- cursor spotlight on cards */
if (fine) {
  const sel = '.pc, .card, .roi-out, .mini, .fit-status';
  $$(sel).forEach(el => el.classList.add('spot'));
  document.addEventListener('pointermove', e => { const el = e.target.closest(sel); if (!el) return; const r = el.getBoundingClientRect(); el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`); });
  new MutationObserver(() => $$(sel).forEach(el => el.classList.add('spot'))).observe(document.body, { childList: true, subtree: true });
}

/* ---------------------------------------------------------------- showroom air: dust in the light, soft beams under the LEDs */
{
  const { scene } = P.hall, N = 1800, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 22; pos[i * 3 + 1] = Math.random() * 5.8; pos[i * 3 + 2] = 10 - Math.random() * 104; seed[i] = Math.random() * 100; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { t: { value: 0 } },
    vertexShader: `attribute float seed;uniform float t;varying float a;
      void main(){vec3 p=position;p.x+=sin(t*.00021+seed)*.35;p.y+=sin(t*.00017+seed*1.7)*.25;p.z+=cos(t*.00013+seed)*.3;
      vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(26./-mv.z,1.,7.);a=smoothstep(30.,4.,-mv.z)*(.35+.65*fract(seed*7.3));gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying float a;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.95,.88),smoothstep(.5,0.,d)*a*.55);}`,
  });
  scene.add(new THREE.Points(geo, mat));
  const beamTex = P.canvasTex(32, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,248,235,.55)'); gr.addColorStop(.6, 'rgba(255,248,235,.08)'); gr.addColorStop(1, 'rgba(255,248,235,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const beamMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: .22 });
  [-8, -4, 0, 4, 8].forEach(x => { const b = new THREE.Mesh(new THREE.PlaneGeometry(100, 5.6), beamMat); b.rotation.y = Math.PI / 2; b.position.set(x, 3.3, -43); scene.add(b); });
  P.onHallFrame = t => { mat.uniforms.t.value = RM ? 0 : t; };
}

/* ---------------------------------------------------------------- footer wordmark fills as you arrive */
$('#bigmark') && gsap.to('#bigmark', { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: '#bigmark', start: 'top bottom', end: 'bottom bottom', scrub: .6 } });

/* ---------------------------------------------------------------- micro feedback: tactile press on every chip and button */
if (!RM) document.addEventListener('pointerdown', e => { const b = e.target.closest('.chip, .rail button, .tabs button, .slots button, .cal button, .sw button'); if (b) gsap.fromTo(b, { scale: .96 }, { scale: 1, duration: .35, ease: 'power3.out' }); });

ScrollTrigger.refresh();

/* ---------------------------------------------------------------- home: scroll hint fades once the flight starts */
{ const hints = $$('.scroll-hint, .scroll-hint-inline'); if (hints.length) ScrollTrigger.create({ trigger: document.body, start: 'top -40', onEnter: () => hints.forEach(h => h.classList.add('gone')), onLeaveBack: () => hints.forEach(h => h.classList.remove('gone')) }); }

/* ---------------------------------------------------------------- footage loads near the viewport, plays while visible */
{ const vids = $$('video[data-src]');
  if (vids.length && !RM) {
    const io = new IntersectionObserver(es => es.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { if (!v.getAttribute('src')) v.src = v.dataset.src; v.play().catch(() => {}); } else if (!v.paused) v.pause();
    }), { rootMargin: '400px 0px' });
    vids.forEach(v => io.observe(v));
  } }
