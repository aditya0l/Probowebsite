// Arrival: after the Earth lands on the roof, scroll scrubs real footage from the front of the building,
// through the doors into the main hall, and across both floors. Each clip is encoded with short keyframe
// gaps so seeking follows the scroll; the playhead eases toward its target to stay smooth.
const P = window.PBL, { ScrollTrigger, RM } = P;
const root = document.getElementById('arrive');
if (root) {
  const $$ = s => [...root.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const scenes = $$('.av'), copy = $$('.av-copy'), rail = $$('.av-rail li'), vids = scenes.map(s => s.querySelector('video'));
  // where each clip owns the scroll, and where the next one takes over
  const SPAN = [[0, .38], [.3, .7], [.62, 1]], IN = [[0, 0], [.3, .42], [.62, .74]];
  let p = 0, scene = -1, visible = false;
  ScrollTrigger.create({ trigger: root, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => p = s.progress, onToggle: s => visible = s.isActive });
  new IntersectionObserver(e => { if (e[0].isIntersecting) vids.forEach(v => v.preload = 'auto'); }, { rootMargin: '150% 0px' }).observe(root);

  const target = vids.map(() => 0);
  function frame() {
    if (visible || scene < 0) {
      scenes.forEach((el, i) => {
        const [a, b] = SPAN[i], [ia, ib] = IN[i], local = seg(p, a, b), open = i ? ease(seg(p, ia, ib)) : 1;
        // the hall opens from the centre like a pair of doors; the floor pan rises from below
        el.style.clipPath = i === 1 ? `inset(0 ${50 * (1 - open)}% 0 ${50 * (1 - open)}%)` : i === 2 ? `inset(${100 * (1 - open)}% 0 0 0)` : 'none';
        const next = SPAN[i + 1], leave = next ? ease(seg(p, IN[i + 1][0], IN[i + 1][1])) : 0;
        el.style.transform = `scale(${1.12 - .08 * local + .1 * leave})`;
        el.style.filter = leave ? `brightness(${1 - .55 * leave})` : '';
        el.style.visibility = (i === 0 || open > 0) && leave < 1 ? 'visible' : 'hidden';
        const v = vids[i]; if (v.duration) target[i] = local * (v.duration - .05);
      });
      const now = p < .36 ? 0 : p < .68 ? 1 : 2;
      if (now !== scene) { if (scene >= 0) P.sfx?.whoosh?.(now < scene); scene = now; rail.forEach((li, i) => li.classList.toggle('on', i <= now)); }
      copy.forEach((el, i) => {
        const [a, b] = SPAN[i], inn = seg(p, a + (i ? .1 : 0), a + (i ? .16 : .06)), out = i < 2 ? seg(p, b - .1, b - .04) : 0, o = Math.min(inn, 1 - out);
        el.style.opacity = o; el.style.transform = `translateY(${(1 - inn) * 40 - out * 30}px)`; el.style.pointerEvents = o > .5 ? 'auto' : 'none';
      });
      root.style.setProperty('--rail', p);
    }
    // ease each playhead toward its target; skip while the decoder is still seeking
    vids.forEach((v, i) => { if (!v.duration || v.seeking) return; const d = target[i] - v.currentTime; if (Math.abs(d) > 1 / 60) v.currentTime += RM ? d : d * .35; });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
