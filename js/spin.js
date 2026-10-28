// Real-footage viewer for the flagship press: 68 frames from the studio turntable shot.
// Any .real-view on the page becomes a viewer. The studio's one only shows in Real footage mode;
// others (the product page hero) are always on. Frames are loaded once and shared.
const P = window.PBL, S = P.studio, { RM } = P;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const N = 68, frames = new Array(N), src = i => `assets/spin/press/f${String(i + 1).padStart(3, '0')}.webp`;
let loaded = 0, started = false; const listeners = [];
function loadAll() {
  if (started) return; started = true;
  const order = [6, ...Array.from({ length: N }, (_, i) => i).filter(i => i !== 6)]; let next = 0;
  const pump = () => { if (next >= order.length) return; const i = order[next++]; const img = new Image(); img.decoding = 'async'; img.src = src(i);
    img.decode().then(() => { frames[i] = img; loaded++; listeners.forEach(f => f()); }).catch(() => {}).finally(pump); };
  for (let k = 0; k < 6; k++) pump();
}
const nearest = i => { for (let d = 0; d < N; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; } return null; };

let studioView = '3d', lens = false;
function mount(host, { always }) {
  const cv = host.querySelector('canvas'), g = cv.getContext('2d');
  const loupe = host.querySelector('.loupe'), lc = loupe?.querySelector('canvas'), lg = lc?.getContext('2d');
  const bar = host.querySelector('.spin-load'), hintEl = host.querySelector('.spin-hint');
  let idx = 6, vel = 0, dragging = false, lastX = 0, lastMove = 0, idleT = 0, ptr = null, interacted = false, box = {}, phase = 0, tweening = false;
  new IntersectionObserver(e => { if (e[0].isIntersecting && (always || studioView === 'real')) loadAll(); }, { rootMargin: '900px' }).observe(host);
  function draw() {
    const w = host.clientWidth, h = host.clientHeight, dpr = Math.min(devicePixelRatio, 2); if (!w) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const img = nearest(Math.round(idx)); g.clearRect(0, 0, cv.width, cv.height); if (!img) return;
    const s = Math.min(w * .9 / img.width, h * .9 / img.height), dw = img.width * s, dh = img.height * s;
    box = { x: (w - dw) / 2, y: (h - dh) / 2 + h * .01, w: dw, h: dh, img };
    g.drawImage(img, box.x * dpr, box.y * dpr, dw * dpr, dh * dpr);
    if (lens && ptr && lg) {
      const u = (ptr.x - box.x) / box.w, v = (ptr.y - box.y) / box.h, Z = 2.6, half = lc.width / 2 / (box.w / img.width) / Z;
      lg.fillStyle = '#fff'; lg.fillRect(0, 0, lc.width, lc.height); lg.drawImage(img, u * img.width - half, v * img.height - half, half * 2, half * 2, 0, 0, lc.width, lc.height);
      loupe.style.left = ptr.x + 'px'; loupe.style.top = ptr.y + 'px';
    }
  }
  listeners.push(() => { if (bar) { bar.style.transform = `scaleX(${loaded / N})`; if (loaded === N) bar.style.opacity = 0; } draw(); });
  const ppf = () => host.clientWidth * .75 / N;
  const hint = () => { if (!interacted && hintEl) { interacted = true; hintEl.style.opacity = 0; } };
  host.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastMove = performance.now(); vel = 0; host.setPointerCapture(e.pointerId); host.classList.add('drag'); hint(); });
  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect(); ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (dragging) { const dx = e.clientX - lastX, t = performance.now(); idx = clamp(idx - dx / ppf(), 0, N - 1); vel = -dx / ppf() / Math.max(1, t - lastMove) * 16; lastX = e.clientX; lastMove = t; idleT = 0; }
    loupe?.classList.toggle('on', lens && !dragging); draw();
  });
  const up = () => { dragging = false; host.classList.remove('drag'); loupe?.classList.toggle('on', lens); };
  host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
  host.addEventListener('pointerleave', () => { ptr = null; loupe?.classList.remove('on'); });
  host.tabIndex = 0;
  host.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { idx = clamp(idx + (e.key === 'ArrowRight' ? 2 : -2), 0, N - 1); idleT = 0; hint(); draw(); e.preventDefault(); } });
  host.goTo = i => { idleT = 0; tweening = true; hint(); const o = { v: idx }; P.gsap.to(o, { v: i, duration: RM ? 0 : .9, ease: 'power3.inOut', onUpdate: () => { idx = o.v; draw(); }, onComplete: () => tweening = false }); };
  let last = performance.now();
  (function tick(t) {
    const dt = Math.min(.05, (t - last) / 1000); last = t;
    const show = always || (S.cur === 'press' && studioView === 'real' && S.st.mode === 'inspect');
    if (!always && host.hidden === show) { host.hidden = !show; if (show) draw(); }
    if (show && loaded && !tweening) {
      if (!dragging && Math.abs(vel) > .01) { idx = clamp(idx + vel, 0, N - 1); vel *= .92; if (idx === 0 || idx === N - 1) vel = 0; draw(); }
      else if (!dragging && !RM) { idleT += dt; if (idleT > 2.5 && !(lens && ptr)) { phase += dt * .32; const target = (N - 1) * (.5 - .5 * Math.cos(phase)); idx += (target - idx) * .04; draw(); } else phase = Math.acos(clamp(1 - 2 * idx / (N - 1), -1, 1)); }
    }
    requestAnimationFrame(tick);
  })(last);
  addEventListener('resize', draw);
  return host;
}

$$('.real-view').forEach(h => mount(h, { always: h.id !== 'realView' }));

// studio view switch: interactive 3D by default, real footage and the detail lens one tap away
$('#viewSwitch')?.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.v === 'loupe') { lens = !lens; b.setAttribute('aria-selected', lens); if (lens && studioView !== 'real') setView('real'); return; }
  setView(b.dataset.v);
});
function setView(v) { studioView = v; if (v === 'real') loadAll(); $$('#viewSwitch [data-v=real], #viewSwitch [data-v="3d"]').forEach(b => b.setAttribute('aria-selected', b.dataset.v === v)); }
// product page: jump to a key angle
$$('[data-angle]').forEach(b => b.addEventListener('click', () => { b.closest('.pdp-media')?.querySelector('.real-view')?.goTo(+b.dataset.angle); $$('[data-angle]').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
