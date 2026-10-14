// Round two: branding configurator, lifter demo, compare, payback, consultant, owners corner, sound.
import * as THREE from 'three';

const P = window.PBL, S = P.studio;
const { gsap, ScrollTrigger, RM, PRODUCTS, THUMB, ORDER, inr, M, SR, canvasTex } = P;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const go = sel => document.querySelector(sel)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });

const sfx = P.sfx;

/* ================================================================ studio: brand it */
const SW = {
  frame: [['Matte black', 0x1a1b1e], ['Graphite', 0x50535a], ['Arctic white', 0xdedfdc]],
  accent: [['Probodyline blue', 0x1d4ad6], ['Signal red', 0xb8231c], ['Safety orange', 0xdc5f17], ['Racing green', 0x1e6a3b], ['Champagne gold', 0xb08d3c]],
  pad: [['Black', 0x141415], ['Slate', 0x4a4d54], ['Saddle tan', 0x8a5532], ['Oxblood', 0x6e1c1f]],
};
const pick = { frame: 0, accent: 0, pad: 0 };
const brand = (() => {
  const SOURCES = { frame: [M.frame, SR.charcoal], accent: [SR.blue], pad: [M.pad] };
  const all = Object.values(SOURCES).flat(), STU = new Map();
  let touched = false, logo = null;
  // studio objects get their own material copies so the showroom floor keeps the stock colours
  function own(obj) { obj?.traverse(o => { if (!o.isMesh || Array.isArray(o.material)) return; const m = o.material; if (STU.has(m)) { o.material = STU.get(m); return; } if (all.includes(m)) { const c = m.clone(); STU.set(m, c); STU.set(c, c); o.material = c; } }); }
  function paint() {
    const f = SW.frame[pick.frame][1], a = SW.accent[pick.accent][1], p = SW.pad[pick.pad][1];
    SOURCES.frame.forEach(m => STU.get(m)?.color.set(f)); STU.get(SR.blue)?.color.set(a); STU.get(M.pad)?.color.set(p);
    [S.levers.L, S.levers.R].forEach(l => l.userData.mat.color.set(a));
    Object.keys(SW).forEach(k => $('#swn-' + k).textContent = SW[k][pick[k]][0]); link();
  }
  function link() {
    const d = PRODUCTS[S.cur];
    $('#orderBuild').href = P.waLink(`Hi Probodyline, I'd like a quote for a custom ${d.name}: ${SW.frame[pick.frame][0]} frame, ${SW.accent[pick.accent][0]} arms, ${SW.pad[pick.pad][0]} upholstery${logo ? ', with our gym logo' : ''}.`);
  }
  $$('.sw').forEach(row => {
    const k = row.dataset.k;
    row.innerHTML = SW[k].map(([n, c], i) => `<button type="button" style="background:#${c.toString(16).padStart(6, '0')}" aria-pressed="${i === 0}" aria-label="${n}" title="${n}" data-i="${i}"></button>`).join('');
    row.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; pick[k] = +b.dataset.i; row.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); touched = true; own(S.machine); own(S.obj); paint(); });
  });
  // logo decals
  const SPOTS = { press: [() => S.back, V(0, 1.107, -.315), V(-.2, Math.PI, 0), .3, .3], treadmill: [() => S.obj, V(0, .31, 1.027), V(0, 0, 0), .52, .2], station: [() => S.obj, V(0, 1.02, -.19), V(0, Math.PI, 0), .28, .3], elliptical: [() => S.obj, V(0, .44, .925), V(0, 0, 0), .3, .22] };
  const decals = {};
  function setLogo(img) {
    logo = img; Object.values(decals).forEach(d => d.parent?.remove(d)); for (const k in decals) delete decals[k];
    if (img) place(); link();
  }
  function place() {
    const spot = SPOTS[S.cur]; if (!logo || !spot || decals[S.cur]) return;
    const [host, pos, rot, mw, mh] = spot, tex = new THREE.Texture(logo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.needsUpdate = true;
    const ar = logo.width / logo.height, w = Math.min(mw, mh * ar), h = w / ar;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .55 }));
    m.position.copy(pos); m.rotation.set(rot.x, rot.y, rot.z); host().add(m); decals[S.cur] = m;
    if (!RM) gsap.from(m.scale, { x: .01, y: .01, duration: .6, ease: 'back.out(2)' });
  }
  $('#logoFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const img = new Image(); img.onload = () => setLogo(img); img.src = URL.createObjectURL(f); });
  $('#logoSample').addEventListener('click', () => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512; const g = c.getContext('2d');
    g.fillStyle = '#f3efe8'; g.beginPath(); g.arc(256, 256, 236, 0, 7); g.fill(); g.fillStyle = '#121214'; g.beginPath(); g.arc(256, 256, 214, 0, 7); g.fill();
    g.fillStyle = '#f3efe8'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 150px Archivo, sans-serif'; g.fillText('IH', 256, 236);
    g.font = '700 46px Archivo, sans-serif'; g.fillText('IRON HOUSE', 256, 352); setLogo(c);
  });
  $('#logoClear').addEventListener('click', () => setLogo(null));
  $('#prodRail').addEventListener('click', () => setTimeout(() => { if (touched) { own(S.obj); paint(); } place(); link(); }, 0));
  P.onRegion(link); link();
  Object.keys(SW).forEach(k => $('#swn-' + k).textContent = SW[k][0][0]);
  return { link };
})();

/* ================================================================ studio: the lifter */
{
  const ghost = new THREE.MeshPhysicalMaterial({ color: 0xaab9ff, transparent: true, opacity: .34, roughness: .3, depthWrite: false, emissive: 0x2f5cf2, emissiveIntensity: .25 });
  const lifter = new THREE.Group(); lifter.visible = false; S.machine.add(lifter);
  const Y = V(0, 1, 0);
  const ball = (r, p, sc) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), ghost); m.position.copy(p); if (sc) m.scale.set(...sc); lifter.add(m); return m; };
  const bone = r => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .9, 1, 16), ghost); lifter.add(m); return m; };
  const setBone = (m, a, b) => { m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(Y, b.clone().sub(a).normalize()); m.scale.set(1, a.distanceTo(b), 1); };
  ball(.13, V(0, .7, .05), [1.25, .75, 1]);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.15, .3, 8, 20), ghost); torso.position.set(0, .98, -.07); torso.rotation.x = -.2; torso.scale.set(1.15, 1, .72); lifter.add(torso);
  ball(.1, V(0, 1.47, -.23), [1, 1.12, 1]); setBone(bone(.045), V(0, 1.25, -.13), V(0, 1.4, -.2));
  [-1, 1].forEach(s => {
    const hip = V(s * .1, .68, .08), knee = V(s * .11, .66, .47), ankle = V(s * .12, .2, .6);
    setBone(bone(.07), hip, knee); setBone(bone(.052), knee, ankle); ball(.07, knee); ball(.05, ankle);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(.09, .06, .22), ghost); foot.position.set(s * .12, .17, .67); lifter.add(foot);
  });
  const arms = [-1, 1].map(s => ({ s, sh: V(s * .2, 1.22, -.08), up: bone(.05), lo: bone(.042), j: [ball(.07, V()), ball(.05, V()), ball(.05, V())] }));
  const grip = { L: V(.13, .045, .925), R: V(-.13, .045, .925) }; // pivot-local grip centres
  const A = .31, B = .31, T = new THREE.Vector3();
  function ik(sh, t, pole) {
    const d = t.clone().sub(sh), len = clamp(d.length(), .05, A + B - .002), dir = d.normalize();
    const x = (A * A - B * B + len * len) / (2 * len), h = Math.sqrt(Math.max(A * A - x * x, 0));
    const pp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
    return [sh.clone().addScaledVector(dir, x).addScaledVector(pp, h), sh.clone().addScaledVector(dir, len)];
  }
  let on = false;
  $('#lifter').addEventListener('click', e => { on = !on; e.currentTarget.setAttribute('aria-pressed', on); if (on && !RM) gsap.fromTo(ghost, { opacity: 0 }, { opacity: .34, duration: .6 }); });
  P.onStudioFrame = () => {
    lifter.visible = on && S.cur === 'press' && S.st.explode < .02; if (!lifter.visible) return;
    lifter.position.y = (S.st.seat - 4) * .028; lifter.updateMatrixWorld(true);
    arms.forEach(a => {
      const lv = a.s < 0 ? S.levers.L : S.levers.R; lv.updateMatrixWorld(true);
      T.copy(a.s < 0 ? grip.L : grip.R).applyMatrix4(lv.matrixWorld); lifter.worldToLocal(T);
      const [el, hand] = ik(a.sh, T, V(a.s, -.9, -.1));
      setBone(a.up, a.sh, el); setBone(a.lo, el, hand); a.j[0].position.copy(a.sh); a.j[1].position.copy(el); a.j[2].position.copy(hand);
    });
  };
}

/* ================================================================ compare */
{
  const pickd = [], DIM = {};
  ORDER.forEach(k => { DIM[k] = new THREE.Box3().setFromObject(P.productMesh(k)).getSize(new THREE.Vector3()); });
  const bar = $('#cmpbar'), dlg = $('#cmpDlg');
  function sync() {
    $$('.cmp').forEach(b => b.setAttribute('aria-pressed', pickd.includes(b.dataset.cmp)));
    bar.classList.toggle('show', pickd.length > 0);
    $('#cmpTxt').textContent = pickd.length === 1 ? 'Pick one more machine to compare' : `${pickd.length} machines selected`;
    $('#cmpOpen').disabled = pickd.length < 2;
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.cmp'); if (!b) return; const k = b.dataset.cmp, i = pickd.indexOf(k);
    if (i >= 0) pickd.splice(i, 1); else { pickd.push(k); if (pickd.length > 3) pickd.shift(); } sync();
  });
  $('#cmpOpen').addEventListener('click', () => {
    const ks = [...pickd], n = ks.length, area = k => DIM[k].x * DIM[k].z;
    const minA = Math.min(...ks.map(area)), minP = Math.min(...ks.map(k => PRODUCTS[k].price));
    const cell = (h, vals) => `<div class="rh">${h}</div>` + vals.join('');
    const rows = [
      `<div></div>` + ks.map(k => `<div><img src="${THUMB[k]}" alt=""><h3>${PRODUCTS[k].name}</h3></div>`).join(''),
      cell('Category', ks.map(k => `<div>${PRODUCTS[k].cat}</div>`)),
      cell('Footprint', ks.map(k => `<div class="${area(k) === minA ? 'best' : ''}">${DIM[k].x.toFixed(2)} by ${DIM[k].z.toFixed(2)} m${area(k) === minA ? '<br><small>Smallest</small>' : ''}</div>`)),
      cell('Height', ks.map(k => `<div>${DIM[k].y.toFixed(2)} m</div>`)),
      cell('Trains', ks.map(k => `<div>${PRODUCTS[k].muscles.map(m => m === 'cardio' ? 'heart and lungs' : m).join(', ')}</div>`)),
      cell('Price (sample)', ks.map(k => `<div class="${PRODUCTS[k].price === minP ? 'best' : ''}">${inr(PRODUCTS[k].price)}</div>`)),
      cell('', ks.map(k => `<div class="row"><button class="chip" data-go3d="${k}"><i class="ph ph-cube"></i>3D</button><button class="chip" data-gofit="${k}"><i class="ph ph-ruler"></i>Fit</button></div>`)),
    ];
    dlg.innerHTML = `<div class="sheet-head"><h2>Compare</h2><button class="chip" data-x>Close</button></div><div class="cmp-grid" style="grid-template-columns:150px repeat(${n},1fr)">${rows.join('')}</div>`;
    dlg.showModal();
  });
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('[data-x]')) dlg.close();
    const a = e.target.closest('[data-go3d]'), f = e.target.closest('[data-gofit]');
    if (a) { dlg.close(); P.showProduct(a.dataset.go3d); }
    if (f) { dlg.close(); document.querySelector(`#fitProd [data-p="${f.dataset.gofit}"]`)?.click(); go('#fit'); }
  });
  sync();
}

/* ================================================================ payback */
{
  const R = { inv: 3000000, fee: 1800, mem: 220, cost: 220000, synced: true };
  const money = n => { const a = Math.abs(n), s = n < 0 ? '−' : ''; return s + '₹' + (a >= 1e7 ? (a / 1e7).toFixed(2) + ' Cr' : a >= 1e5 ? (a / 1e5).toFixed(1) + ' L' : Math.round(a).toLocaleString('en-IN')); };
  const ids = { inv: 'roiInv', fee: 'roiFee', mem: 'roiMem', cost: 'roiCost' };
  function fromPlan() {
    const st = P.plan.state(); if (!st.total) return;
    R.inv = clamp(Math.round(st.total / 50000) * 50000, 200000, 20000000);
    R.mem = clamp(Math.round(st.machines * 11 / 10) * 10, 20, 1500);
    R.cost = clamp(Math.round((st.area * 650 + 70000) / 10000) * 10000, 20000, 2000000);
    R.fee = { home: 0, studio: 2500, commercial: 1800, hotel: 0 }[st.kind] || R.fee;
    Object.entries(ids).forEach(([k, id]) => $('#' + id).value = R[k]); draw();
  }
  function draw() {
    $('#roiInvV').textContent = money(R.inv); $('#roiFeeV').textContent = '₹' + R.fee.toLocaleString('en-IN'); $('#roiMemV').textContent = R.mem.toLocaleString('en-IN'); $('#roiCostV').textContent = money(R.cost);
    const profit = R.fee * R.mem - R.cost, pay = profit > 0 ? Math.ceil(R.inv / profit) : Infinity;
    const cum = Array.from({ length: 37 }, (_, m) => -R.inv + profit * m);
    $('#roiPay').textContent = pay === Infinity ? 'Never' : pay > 36 ? `${(pay / 12).toFixed(1)} yrs` : `${pay} months`;
    $('#roiProfit').textContent = money(profit); $('#roiY3').textContent = money(cum[36]);
    const lo = Math.min(...cum, 0), hi = Math.max(...cum, 0), X = m => 56 + m / 36 * 724, Yv = v => 20 + (hi - v) / ((hi - lo) || 1) * 250;
    const line = cum.map((v, m) => `${m ? 'L' : 'M'}${X(m).toFixed(1)},${Yv(v).toFixed(1)}`).join('');
    const z = Yv(0);
    let svg = `<defs><linearGradient id="rg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#2f5cf2" stop-opacity=".35"/><stop offset="1" stop-color="#2f5cf2" stop-opacity="0"/></linearGradient><clipPath id="above"><rect x="0" y="0" width="800" height="${z}"/></clipPath><clipPath id="below"><rect x="0" y="${z}" width="800" height="300"/></clipPath></defs>`;
    svg += `<path d="${line}L${X(36)},${z}L${X(0)},${z}Z" fill="url(#rg)" clip-path="url(#above)"/><path d="${line}L${X(36)},${z}L${X(0)},${z}Z" fill="rgba(255,143,128,.12)" clip-path="url(#below)"/>`;
    svg += `<line x1="${X(0)}" x2="${X(36)}" y1="${z}" y2="${z}" stroke="rgba(236,235,231,.35)" stroke-dasharray="4 4"/>`;
    [0, 6, 12, 18, 24, 30, 36].forEach(m => svg += `<text x="${X(m)}" y="292" text-anchor="middle">${m}</text>`);
    svg += `<text x="48" y="${Yv(hi) + 4}" text-anchor="end">${money(hi)}</text><text x="48" y="${z + 4}" text-anchor="end">0</text><text x="48" y="${Yv(lo) + 4}" text-anchor="end">${money(lo)}</text>`;
    svg += `<path d="${line}" fill="none" stroke="#8ea5ff" stroke-width="2.5" stroke-linejoin="round" class="roi-line"/>`;
    if (pay <= 36) svg += `<line x1="${X(pay)}" x2="${X(pay)}" y1="20" y2="270" stroke="#ecebe7" stroke-dasharray="2 4"/><circle cx="${X(pay)}" cy="${z}" r="6" fill="#ecebe7"/><text x="${X(pay) + 10}" y="36" style="fill:#ecebe7">Paid back, month ${pay}</text>`;
    $('#roiChart').innerHTML = svg;
  }
  Object.entries(ids).forEach(([k, id]) => $('#' + id).addEventListener('input', e => { R[k] = +e.target.value; if (k === 'inv') R.synced = false; draw(); }));
  $('#roiSync').addEventListener('click', () => { R.synced = true; fromPlan(); });
  document.addEventListener('plan', () => { if (R.synced) fromPlan(); });
  fromPlan(); draw();
  if (!RM) ScrollTrigger.create({ trigger: '#roiChart', start: 'top 80%', once: true, onEnter: () => { const p = $('#roiChart .roi-line'); if (!p) return; const L = p.getTotalLength(); gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', onComplete: () => p.removeAttribute('style') }); } });
}

/* ================================================================ consultant */
{
  const btn = $('#cbtn'), panel = $('#cpanel'), log = $('#clog'), chips = $('#cchips');
  const A = {};
  const say = (html, who = 'bot') => new Promise(res => {
    if (who === 'me') { log.insertAdjacentHTML('beforeend', `<div class="msg me">${html}</div>`); log.scrollTop = log.scrollHeight; return res(); }
    const t = document.createElement('div'); t.className = 'msg bot typing'; t.textContent = 'Typing...'; log.append(t); log.scrollTop = log.scrollHeight;
    setTimeout(() => { t.className = 'msg bot'; t.innerHTML = html; log.scrollTop = log.scrollHeight; res(); }, RM ? 0 : 650);
  });
  const ask = (opts, cb) => { chips.innerHTML = opts.map(([l, v], i) => `<button class="chip" data-i="${i}">${l}</button>`).join(''); chips.onclick = e => { const b = e.target.closest('button'); if (!b) return; const [l, v] = opts[+b.dataset.i]; chips.innerHTML = ''; say(l, 'me').then(() => cb(v, l)); }; };
  const STEPS = [
    ['What are you building?', [['Home gym', 'home'], ['Studio', 'studio'], ['Commercial gym', 'commercial'], ['Hotel or office', 'hotel']], 'kind'],
    ['How big is the space?', [['Under 800 sq ft', 600], ['800 to 2,000 sq ft', 1400], ['2,000 to 5,000 sq ft', 3500], ['5,000 sq ft or more', 7000]], 'sqft'],
    ['What will people train most?', [['Mostly cardio', 'cardio'], ['A bit of everything', 'balanced'], ['Mostly strength', 'strength']], 'focus'],
    ['Which state is it in? I will route you to the right sales desk.', [['Rajasthan', 'Rajasthan'], ['Delhi NCR', 'Delhi NCR'], ['Maharashtra', 'Maharashtra'], ['Gujarat', 'Gujarat'], ['Karnataka', 'Karnataka'], ['Uttar Pradesh', 'Uttar Pradesh'], ['Punjab', 'Punjab'], ['Somewhere else', 'Other']], 'state'],
  ];
  async function step(i) {
    if (i < STEPS.length) { const [q, o, key] = STEPS[i]; await say(q); ask(o, v => { A[key] = v; step(i + 1); }); return; }
    P.plan.apply({ kind: A.kind, sqft: A.sqft, focus: A.focus }); P.setRegion(A.state);
    const st = P.plan.state(), top = st.lines.sort((a, b) => b.q - a.q).slice(0, 3).map(l => `${l.q} ${PRODUCTS[l.k].short.toLowerCase()}${l.q > 1 && !/s$/.test(PRODUCTS[l.k].short) ? 's' : ''}`).join(', ');
    await say(`Here is your starting plan: <b>${st.machines} machines</b> on about ${Math.round(st.area)} m², led by ${top}.`);
    await say(`Equipment comes to about <b>${inr(st.total)}</b> including GST, at sample prices. Your desk is ${P.desk().show}.`);
    await say('I have laid it out in 3D and set up the payback numbers. Where to next?');
    ask([['Show me the 3D layout', '#plan'], ['When does it pay back?', '#roi'], ['Book a showroom visit', '#book'], ['Start again', 'again']], v => { if (v === 'again') { log.innerHTML = ''; start(); } else { open(false); go(v); } });
  }
  async function start() { await say('Hi. Tell me about the gym you are planning. I will lay it out, price it and send it to your nearest sales desk.'); step(0); }
  function open(v) { panel.hidden = !v; btn.setAttribute('aria-expanded', v); if (v && !log.children.length) start(); if (v && !RM) gsap.fromTo(panel, { y: 20, opacity: 0, scale: .98 }, { y: 0, opacity: 1, scale: 1, duration: .35, ease: 'power3.out' }); }
  btn.addEventListener('click', () => open(panel.hidden));
  $('#cclose').addEventListener('click', () => open(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) open(false); });
  document.addEventListener('click', e => { if (e.target.closest('a[href="#consult"]')) { e.preventDefault(); open(true); } });
}

/* ================================================================ owners corner */
{
  let mode = 'warranty';
  const LABEL = { warranty: 'Register warranty', service: 'Book a service', spares: 'Order spares' };
  $('#oModel').innerHTML = ORDER.map(k => `<option value="${k}">${PRODUCTS[k].name}</option>`).join('');
  $('#oIssue').innerHTML = ['Noise or wobble', 'Cable or belt', 'Console', 'Upholstery', 'Something else'].map((t, i) => `<button type="button" class="chip" aria-pressed="${i === 0}">${t}</button>`).join('');
  $('#oIssue').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#oIssue button').forEach(x => x.setAttribute('aria-pressed', x === b)); });
  $$('.own-tabs button').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.o; $$('.own-tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    $$('[data-o-for]').forEach(el => el.hidden = el.dataset.oFor !== mode);
    $('#oSubmit').innerHTML = `<i class="ph ph-whatsapp-logo"></i>${LABEL[mode]}`;
  }));
  const SERIAL = 'PBL-24-01873';
  try { const q = qrcode(0, 'M'); q.addData(`https://www.probodyline.com/owners?model=press&serial=${SERIAL}`); q.make(); $('#plQr').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { $('#plQr').textContent = 'QR'; }
  $('#oModel').addEventListener('change', e => $('#plModel').textContent = PRODUCTS[e.target.value].short.toUpperCase());
  $('#scanSim').addEventListener('click', () => {
    if (!RM) gsap.fromTo('#plate', { scale: 1 }, { scale: .97, yoyo: true, repeat: 1, duration: .15 });
    $('#oModel').value = 'press'; $('#oSerial').value = SERIAL; $('#plModel').textContent = 'ISO-LATERAL PRESS';
    sfx.chime(); setTimeout(() => { $('#ownForm').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); $('#oName').focus({ preventScroll: true }); }, 300);
    if (!RM) gsap.fromTo(['#oModel', '#oSerial'], { boxShadow: '0 0 0 3px rgba(142,165,255,.7)' }, { boxShadow: '0 0 0 0 rgba(142,165,255,0)', duration: 1.4, delay: .3 });
  });
  const err = (id, t) => { $('#' + id + 'Err').textContent = t; $('#' + id).setAttribute('aria-invalid', !!t); };
  $('#ownForm').addEventListener('submit', e => {
    e.preventDefault();
    const serial = $('#oSerial').value.trim().toUpperCase(), name = $('#oName').value.trim();
    err('oSerial', serial.length < 6 ? 'Enter the serial number from the plate on the machine.' : ''); err('oName', name.length < 2 ? 'Tell us your name or your gym.' : '');
    if (serial.length < 6 || name.length < 2) return;
    const model = PRODUCTS[$('#oModel').value].name;
    const extra = mode === 'service' ? ` Issue: ${$('#oIssue [aria-pressed=true]')?.textContent}.` : mode === 'spares' ? ` Part needed: ${$('#oPart').value}.` : '';
    const msg = `Hi Probodyline, this is ${name}. I'd like to ${LABEL[mode].toLowerCase()} for my ${model}, serial ${serial}.${extra}`;
    window.open(P.waLink(msg), '_blank', 'noopener'); sfx.chime();
    const b = $('#oSubmit'), was = b.innerHTML; b.innerHTML = '<i class="ph ph-check"></i>WhatsApp opened'; setTimeout(() => b.innerHTML = was, 2600);
  });
}

ScrollTrigger.refresh();
