// The planning assistant and the owners corner. Neither needs the 3D engine, so they also run on the light pages.
import { PRODUCTS, ORDER, inr } from './data.js';
import { desk, waLink, setRegion } from './region.js';

const P = window.PBL || (window.PBL = {});
const { gsap } = window;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const go = sel => document.querySelector(sel)?.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });

/* ================================================================ consultant */
if ($('#cbtn')) {
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
    setRegion(A.state);
    if (!P.plan) { try { sessionStorage.setItem('pbl-plan', JSON.stringify({ kind: A.kind, sqft: A.sqft, focus: A.focus })); } catch (e) { } await say('Opening your plan in the 3D planner...'); setTimeout(() => location.href = 'plan.html#plan', 700); return; }
    P.plan.apply({ kind: A.kind, sqft: A.sqft, focus: A.focus });
    const st = P.plan.state(), top = st.lines.sort((a, b) => b.q - a.q).slice(0, 3).map(l => `${l.q} ${PRODUCTS[l.k].short.toLowerCase()}${l.q > 1 && !/s$/.test(PRODUCTS[l.k].short) ? 's' : ''}`).join(', ');
    await say(`Here is your starting plan: <b>${st.machines} machines</b> on about ${Math.round(st.area)} m², led by ${top}.`);
    await say(st.priced ? `Equipment comes to about <b>${inr(st.total)}</b> including GST. Your desk is ${desk().show}.` : `Your sales desk, ${desk().show}, prices it and suggests exact models.`);
    await say('I have laid it out in 3D and set up the payback numbers. Where to next?');
    ask([['Show me the 3D layout', '#plan'], ['When does it pay back?', '#roi'], ['Book a showroom visit', '#book'], ['Start again', 'again']], v => { if (v === 'again') { log.innerHTML = ''; start(); } else { open(false); go(v); } });
  }
  async function start() { await say('Hi. Tell me about the gym you are planning. I will lay it out and send it to your nearest sales desk for prices.'); step(0); }
  function open(v) { panel.hidden = !v; btn.setAttribute('aria-expanded', v); if (v && !log.children.length) start(); if (v && !RM) gsap.fromTo(panel, { y: 20, opacity: 0, scale: .98 }, { y: 0, opacity: 1, scale: 1, duration: .35, ease: 'power3.out' }); }
  btn.addEventListener('click', () => open(panel.hidden));
  $('#cclose').addEventListener('click', () => open(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) open(false); });
  document.addEventListener('click', e => { if (e.target.closest('a[href="#consult"]')) { e.preventDefault(); open(true); } });
}

/* ================================================================ owners corner */
if ($('#ownForm')) {
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
    P.sfx?.chime(); setTimeout(() => { $('#ownForm').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' }); $('#oName').focus({ preventScroll: true }); }, 300);
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
    window.open(waLink(msg), '_blank', 'noopener'); P.sfx?.chime();
    const b = $('#oSubmit'), was = b.innerHTML; b.innerHTML = '<i class="ph ph-check"></i>WhatsApp opened'; setTimeout(() => b.innerHTML = was, 2600);
  });
}
