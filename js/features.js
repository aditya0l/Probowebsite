// Probodyline site features, built on the shared 3D kit in index.html.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const P = window.PBL;
const { gsap, ScrollTrigger, M, SR, BAKED, PRODUCTS, RM, canvasTex } = P;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ORDER = ['press', 'treadmill', 'bike', 'elliptical', 'station', 'rack', 'dumbbells', 'bench'];
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const GST = (window.SITE && SITE.gstRate) ?? .18;

/* ---------------------------------------------------------------- shared 3D helpers */
const envCache = new WeakMap();
function env(r) { if (!envCache.has(r)) envCache.set(r, new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .04).texture); return envCache.get(r); }
function renderer(canvas, { alpha = false, shadows = true, dpr = 1.75, preserve = false } = {}) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, preserveDrawingBuffer: preserve });
  r.setPixelRatio(Math.min(devicePixelRatio, dpr)); r.toneMapping = THREE.ACESFilmicToneMapping;
  r.shadowMap.enabled = shadows; r.shadowMap.type = THREE.PCFSoftShadowMap; return r;
}
function lights(scene, span = 3, key = 2.4) {
  const k = new THREE.DirectionalLight(0xfff4ea, key); k.position.set(span * .9, span * 1.8, span * .8); k.castShadow = true;
  k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: .1, far: span * 6 });
  k.shadow.bias = -.0004; k.shadow.normalBias = .02; k.shadow.radius = 5; scene.add(k);
  const rim = new THREE.DirectionalLight(0xc8d3ff, 1.1); rim.position.set(-span, span * .8, -span); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x202024, .45)); return k;
}
function productMesh(key) {
  const g = new THREE.Group();
  BAKED[key].forEach(({ geo, mat }) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = !mat.isMeshBasicMaterial; g.add(m); });
  return g;
}
function centred(key) { // product mesh with its footprint centred on the origin
  const inner = productMesh(key), b = new THREE.Box3().setFromObject(inner), c = b.getCenter(new THREE.Vector3());
  inner.position.set(-c.x, 0, -c.z); const g = new THREE.Group(); g.add(inner);
  const size = b.getSize(new THREE.Vector3()); g.userData.size = size; return g;
}
function frameCam(cam, obj, { az = .8, el = .3, pad = 1 } = {}) {
  const b = new THREE.Box3().setFromObject(obj), c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).length() / 2;
  const d = r / Math.sin(THREE.MathUtils.degToRad(cam.fov / 2)) * pad;
  cam.position.set(c.x + Math.sin(az) * Math.cos(el) * d, c.y + Math.sin(el) * d, c.z + Math.cos(az) * Math.cos(el) * d); cam.lookAt(c); return c;
}
const views = [];
function addView(v) { v.visible = false; views.push(v); new IntersectionObserver(e => v.visible = e[0].isIntersecting, { rootMargin: '120px' }).observe(v.canvas); sizeView(v); return v; }
function sizeView(v) {
  const w = v.canvas.clientWidth, h = v.canvas.clientHeight; if (!w || !h) return;
  v.r.setSize(w, h, false);
  if (v.cam.isPerspectiveCamera) v.cam.aspect = w / h; else if (v.ortho) v.ortho(w, h);
  v.cam.updateProjectionMatrix(); v.resized && v.resized(w, h);
}
addEventListener('resize', () => views.forEach(sizeView));
let lastT = performance.now();
(function tick(t) { const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
  for (const v of views) if (v.visible) { v.frame && v.frame(t, dt); v.r.render(v.scene, v.cam); }
  requestAnimationFrame(tick); })(lastT);

/* ---------------------------------------------------------------- AR on phones (model-viewer) */
async function openAR(obj, note) {
  if (!matchMedia('(pointer:coarse)').matches) { note('Open this page on your phone and tap this button to place it on your floor at real size.'); return; }
  note('Preparing the 3D model...');
  try {
    await import('https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js');
    const glb = await new GLTFExporter().parseAsync(obj, { binary: true });
    const mv = $('#mv'); mv.src = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }));
    await new Promise(res => mv.addEventListener('load', res, { once: true }));
    if (mv.canActivateAR) { mv.activateAR(); note(''); } else note('AR is not available in this browser. Try Chrome on Android or Safari on iPhone.');
  } catch (err) { note('Could not start AR on this device.'); }
}

/* ---------------------------------------------------------------- regional routing (global) */
const DESKS = { a: { num: '917891712345', show: '+91 78917 12345', area: 'Rest of India' }, n: { num: '919403893899', show: '+91 94038 93899', area: 'Delhi NCR, Gujarat, Punjab, Haryana and Tamil Nadu' }, s: { num: '919403893399', show: '+91 94038 93399', area: 'Maharashtra, Uttar Pradesh and Bangalore' } };
const STATES = [['Rajasthan', 'a'], ['Delhi NCR', 'n'], ['Gujarat', 'n'], ['Punjab', 'n'], ['Haryana', 'n'], ['Tamil Nadu', 'n'], ['Maharashtra', 's'], ['Uttar Pradesh', 's'], ['Karnataka', 's'], ['Madhya Pradesh', 'a'], ['West Bengal', 'a'], ['Telangana', 'a'], ['Andhra Pradesh', 'a'], ['Kerala', 'a'], ['Bihar', 'a'], ['Odisha', 'a'], ['Assam', 'a'], ['Other', 'a']];
let region = 'Rajasthan'; try { region = localStorage.getItem('pbl-region') || region; } catch (e) { }
const desk = () => DESKS[(STATES.find(s => s[0] === region) || STATES[0])[1]];
const waLink = text => `https://wa.me/${desk().num}?text=${encodeURIComponent(text)}`;
const listeners = [];
function setRegion(r) {
  region = r; try { localStorage.setItem('pbl-region', r); } catch (e) { }
  $$('select[data-region]').forEach(s => s.value = r);
  $$('[data-desk]').forEach(el => el.textContent = `${desk().show} (${desk().area})`);
  $$('[data-desk-link]').forEach(a => a.href = 'tel:+' + desk().num);
  $$('#abWa').forEach(a => a.href = waLink('Hi Probodyline, I have a question.'));
  listeners.forEach(f => f());
}
$$('select[data-region]').forEach(s => { STATES.forEach(([n]) => s.add(new Option(n, n))); s.addEventListener('change', () => setRegion(s.value)); });

/* ---------------------------------------------------------------- product renders (one shared offscreen pass) */
const THUMB = {};
{
  const c = document.createElement('canvas'), r = renderer(c, { alpha: true, preserve: true, dpr: 1 }); r.setSize(800, 600, false);
  const s = new THREE.Scene(); s.environment = env(r); s.environmentIntensity = .8; lights(s, 2.2);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: .45 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  const cam = new THREE.PerspectiveCamera(26, 4 / 3, .05, 60);
  ORDER.forEach(k => { const g = productMesh(k); s.add(g); frameCam(cam, g, { az: .82, el: .26, pad: .92 }); r.render(s, cam); THUMB[k] = c.toDataURL('image/png'); s.remove(g); });
  r.dispose(); r.forceContextLoss();
}

THUMB.press3d = THUMB.press; THUMB.press = 'assets/spin/press/f006.webp';
const REAL = { press: true };

/* ---------------------------------------------------------------- catalogue */
if ($('#catGrid')) {
  const grid = $('#catGrid');
  grid.innerHTML = ORDER.map((k, i) => `<article class="pc${i === 0 ? ' big' : ''}" data-g="${PRODUCTS[k].g}">
    <div class="pc-img${REAL[k] ? ' real' : ''}"><img src="${THUMB[k]}" alt="${PRODUCTS[k].name}${REAL[k] ? ', filmed in the studio' : ', 3D preview'}" loading="lazy"></div>
    <div class="pc-body"><span class="pc-cat">${PRODUCTS[k].cat}</span><h3>${PRODUCTS[k].name}</h3>
    <div class="row"><button class="chip" data-3d="${k}"><i class="ph ph-cube"></i>Open in 3D</button><button class="chip" data-fit="${k}"><i class="ph ph-ruler"></i>Will it fit?</button><button class="chip cmp" data-cmp="${k}" aria-pressed="false"><i class="ph ph-columns"></i>Compare</button></div></div></article>`).join('');
  grid.addEventListener('click', e => {
    const a = e.target.closest('[data-3d]'), f = e.target.closest('[data-fit]');
    if (a) P.showProduct(a.dataset['3d']);
    if (f) { if (setFit) { setFit(f.dataset.fit); $('#fit').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); } else location.href = `product.html?fit=${f.dataset.fit}#fit`; }
  });
  $('#catFilter').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#catFilter button').forEach(x => x.setAttribute('aria-selected', x === b));
    $$('#catGrid .pc').forEach(c => c.hidden = !(b.dataset.g === 'all' || c.dataset.g === b.dataset.g));
    if (!RM) gsap.fromTo('#catGrid .pc:not([hidden])', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .04, ease: 'power3.out' });
  });
}

// product images anywhere on the page: <img data-thumb="treadmill">
$$('img[data-thumb]').forEach(i => { i.src = THUMB[i.dataset.thumb]; if (REAL[i.dataset.thumb]) i.classList.add('real'); });
// catalogue starts filtered when the page or the link asks for it
{ const want = $('#catGrid')?.dataset.preset || ({ '#cardio': 'Cardio', '#strength': 'Strength', '#free-weights': 'Free weights' })[location.hash]; if (want) $(`#catFilter [data-g="${want}"]`)?.click(); }

/* ---------------------------------------------------------------- will it fit + AR */
const FIT = { w: 4.2, l: 5.4, key: 'treadmill', rot: 0, x: 0, z: 0, ft: false };
const CLEAR = .6;
let setFit;
if ($('#fitView')) {
  const canvas = $('#fitView'), stage = $('#fitStage');
  const r = renderer(canvas); const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0e0f11);
  scene.environment = env(r); scene.environmentIntensity = .55; const key = lights(scene, 7, 2.2);
  const lamp = new THREE.PointLight(0xffe8d0, 18, 12, 1.5); lamp.position.set(0, 2.6, 0); scene.add(lamp);
  const cam = new THREE.PerspectiveCamera(34, 1, .05, 80);
  const ctl = new OrbitControls(cam, canvas); ctl.enableDamping = true; ctl.enablePan = false; ctl.enableZoom = false; ctl.minPolarAngle = .35; ctl.maxPolarAngle = 1.2;

  const wood = canvasTex(1024, 1024, (g, W) => { for (let y = 0; y < W; y += 64) for (let x = -(y / 64 % 2) * 180; x < W; x += 360) { const t = 70 + Math.random() * 26 | 0; g.fillStyle = `rgb(${t + 40},${t + 22},${t})`; g.fillRect(x, y, 358, 62); for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(40,25,15,${Math.random() * .12})`; g.fillRect(x, y + Math.random() * 62, 358, 1 + Math.random() * 2); } } });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: wood, roughness: .6 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: .9 });
  const wallB = new THREE.Mesh(new THREE.BoxGeometry(1, 2.7, .12), wallMat), wallL = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.7, 1), wallMat);
  [wallB, wallL].forEach(w => { w.receiveShadow = true; scene.add(w); });
  const skirt = new THREE.MeshStandardMaterial({ color: 0xd9d9d6, roughness: .5 });
  const skB = new THREE.Mesh(new THREE.BoxGeometry(1, .08, .02), skirt), skL = new THREE.Mesh(new THREE.BoxGeometry(.02, .08, 1), skirt); scene.add(skB, skL);
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffe31a, transparent: true, opacity: .55 });
  const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-.5, 0, -.5), V(.5, 0, -.5), V(.5, 0, .5), V(-.5, 0, .5)]), edgeMat); edge.position.y = .004; scene.add(edge);
  const clearMat = new THREE.MeshBasicMaterial({ color: 0xffe31a, transparent: true, opacity: .16, depthWrite: false });
  const clearZone = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), clearMat); clearZone.rotation.x = -Math.PI / 2; clearZone.position.y = .006; scene.add(clearZone);
  const clearEdge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-.5, 0, -.5), V(.5, 0, -.5), V(.5, 0, .5), V(-.5, 0, .5)]), new THREE.LineDashedMaterial({ color: 0xffe31a, dashSize: .08, gapSize: .06 }));
  clearEdge.computeLineDistances(); clearEdge.position.y = .008; scene.add(clearEdge);
  let piece = null;
  const lbls = ['w', 'l'].map(() => { const d = document.createElement('div'); d.className = 'dimlbl'; stage.append(d); return d; });

  const fmt = m => FIT.ft ? `${(m * 3.281).toFixed(1)} ft` : `${m.toFixed(2)} m`;
  function foot() { const s = piece.userData.size; return FIT.rot % 2 ? [s.z, s.x] : [s.x, s.z]; }
  function layout(refocus) {
    const { w, l } = FIT;
    floor.scale.set(w, l, 1); wood.repeat.set(w / 2.2, l / 2.2);
    wallB.scale.x = w + .24; wallB.position.set(0, 1.35, -l / 2 - .06); wallL.scale.z = l; wallL.position.set(-w / 2 - .06, 1.35, 0);
    skB.scale.x = w; skB.position.set(0, .04, -l / 2 + .01); skL.scale.z = l; skL.position.set(-w / 2 + .01, .04, 0);
    edge.scale.set(w, 1, l);
    const [pw, pd] = foot();
    FIT.x = pw > w ? 0 : clamp(FIT.x, -(w - pw) / 2, (w - pw) / 2); FIT.z = pd > l ? 0 : clamp(FIT.z, -(l - pd) / 2, (l - pd) / 2);
    piece.position.set(FIT.x, 0, FIT.z); piece.rotation.y = FIT.rot * Math.PI / 2;
    clearZone.scale.set(pw + CLEAR * 2, pd + CLEAR * 2, 1); clearZone.position.x = FIT.x; clearZone.position.z = FIT.z;
    clearEdge.scale.set(pw + CLEAR * 2, 1, pd + CLEAR * 2); clearEdge.position.x = FIT.x; clearEdge.position.z = FIT.z;
    key.shadow.camera.left = key.shadow.camera.bottom = -Math.max(w, l); key.shadow.camera.right = key.shadow.camera.top = Math.max(w, l); key.shadow.camera.updateProjectionMatrix();
    $('#roomWV').textContent = fmt(w); $('#roomLV').textContent = fmt(l);
    // verdict
    const st = $('#fitStatus'), ic = st.querySelector('i'), b = st.querySelector('b'), sp = st.querySelector('span');
    let state;
    if (pw > w || pd > l) { state = 'bad'; b.textContent = 'Too big for this room'; sp.textContent = `The machine alone needs ${fmt(pw)} by ${fmt(pd)}.`; ic.className = 'ph ph-x-circle'; }
    else {
      const m = Math.min(FIT.x - pw / 2 + w / 2, w / 2 - FIT.x - pw / 2, FIT.z - pd / 2 + l / 2, l / 2 - FIT.z - pd / 2);
      if (m < CLEAR - .005) { state = 'tight'; b.textContent = 'It fits, but it is tight'; sp.textContent = `Leave ${fmt(CLEAR)} clear on every side to train safely. Move it or rotate it.`; ic.className = 'ph ph-warning-circle'; }
      else { state = 'ok'; b.textContent = 'Fits, with room to train'; sp.textContent = `${fmt(pw)} by ${fmt(pd)} footprint, plus ${fmt(CLEAR)} clear on every side.`; ic.className = 'ph ph-check-circle'; }
    }
    st.dataset.s = state; clearMat.color.set(state === 'bad' ? 0xff6b5a : state === 'tight' ? 0xe8b86a : 0xffe31a); clearEdge.material.color.set(state === 'ok' ? 0xffe31a : state === 'tight' ? 0xe8b86a : 0xff8f80);
    if (refocus) { ctl.target.set(0, .5, 0); const d = Math.max(w, l) * 1.05 + 1.4; cam.position.set(d * .62, d * .74, d * .86); }
  }
  setFit = key => {
    FIT.key = key; if (piece) scene.remove(piece); piece = centred(key); scene.add(piece);
    $$('#fitProd button').forEach(b => b.setAttribute('aria-selected', b.dataset.p === key));
    FIT.x = 0; FIT.z = 0; layout(false);
    if (!RM) gsap.from(piece.position, { y: .6, duration: .6, ease: 'bounce.out' });
  };
  $('#fitProd').innerHTML = ORDER.map(k => `<button data-p="${k}" aria-selected="false">${PRODUCTS[k].short}</button>`).join('');
  $('#fitProd').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setFit(b.dataset.p); });
  $('#roomW').addEventListener('input', e => { FIT.w = +e.target.value; layout(); });
  $('#roomL').addEventListener('input', e => { FIT.l = +e.target.value; layout(); });
  $('#fitRotate').addEventListener('click', () => { FIT.rot = (FIT.rot + 1) % 4; layout(); });
  $('#fitUnits').addEventListener('click', e => { FIT.ft = !FIT.ft; e.currentTarget.setAttribute('aria-pressed', FIT.ft); layout(); });

  // drag the machine across the floor
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), plane = new THREE.Plane(V(0, 1, 0), 0), hit = new THREE.Vector3(); let drag = null;
  const toPtr = e => { const b = canvas.getBoundingClientRect(); ptr.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(ptr, cam); };
  canvas.addEventListener('pointerdown', e => { toPtr(e); if (!ray.intersectObject(piece, true).length) return; ray.ray.intersectPlane(plane, hit); drag = { dx: FIT.x - hit.x, dz: FIT.z - hit.z }; ctl.enabled = false; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', e => { toPtr(e); if (drag) { if (ray.ray.intersectPlane(plane, hit)) { FIT.x = hit.x + drag.dx; FIT.z = hit.z + drag.dz; layout(); } } else canvas.style.cursor = ray.intersectObject(piece, true).length ? 'grab' : ''; });
  const up = () => { drag = null; ctl.enabled = true; canvas.style.cursor = ''; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  const pv = new THREE.Vector3();
  addView({ canvas, r, scene, cam, frame() {
    ctl.update();
    const W = canvas.clientWidth, H = canvas.clientHeight;
    [[V(0, 0, FIT.l / 2 + .25), `${fmt(FIT.w)} wide`], [V(FIT.w / 2 + .25, 0, 0), `${fmt(FIT.l)} long`]].forEach(([p3, t], i) => { pv.copy(p3).project(cam); lbls[i].textContent = t; lbls[i].style.transform = `translate(${(pv.x + 1) / 2 * W}px,${(1 - pv.y) / 2 * H}px) translate(-50%,-50%)`; });
  } });
  setFit(new URLSearchParams(location.search).get('fit') || $('#fit').dataset.default || 'treadmill'); layout(true);

  // AR: export the same model to GLB and hand it to model-viewer on phones
  const note = t => { const n = $('#arNote'); n.textContent = t; n.hidden = false; };
  $('#arBtn').addEventListener('click', async () => { const b = $('#arBtn'); b.disabled = true; await openAR(centred(FIT.key), t => { const n = $('#arNote'); n.textContent = t; n.hidden = !t; }); b.disabled = false;  });
}

/* ---------------------------------------------------------------- muscle map finder */
if ($('#body')) {
  const MUS = {
    chest: ['Chest', 'Pressing muscles. Presses, benches and chest stations build them.'],
    shoulders: ['Shoulders', 'Overhead and incline pressing, plus dumbbell raises.'],
    arms: ['Arms', 'Biceps, triceps and forearms. Free weights and guided stations.'],
    back: ['Back', 'Pulling muscles. Rows, pulldowns and deadlifts from the rack.'],
    core: ['Core', 'Bracing under a bar, and steady full-body cardio.'],
    glutes: ['Glutes', 'Squats, hinges, and every climb on a bike or treadmill.'],
    legs: ['Legs', 'Quads, hamstrings and calves. Racks for strength, cardio for endurance.'],
    cardio: ['Heart and lungs', 'Endurance work. Treadmills, bikes and cross-trainers.'],
  };
  const canvas = $('#body'); const r = renderer(canvas, { alpha: true });
  const scene = new THREE.Scene(); scene.environment = env(r); scene.environmentIntensity = .7; lights(scene, 1.6, 2.2);
  const cam = new THREE.PerspectiveCamera(30, 1, .05, 30); cam.position.set(0, 1.15, 4.4);
  const ctl = new OrbitControls(cam, canvas); ctl.target.set(0, .92, 0); ctl.enableDamping = true; ctl.enablePan = false; ctl.enableZoom = false; ctl.minPolarAngle = 1.2; ctl.maxPolarAngle = 1.75; ctl.autoRotate = !RM; ctl.autoRotateSpeed = 1.1;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(1.2, 64), new THREE.ShadowMaterial({ opacity: .5 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.62, .64, 96), new THREE.MeshBasicMaterial({ color: 0xffe31a, transparent: true, opacity: .35 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .002; scene.add(ring);
  const base = new THREE.MeshPhysicalMaterial({ color: 0x2c2e34, roughness: .5, metalness: .1, clearcoat: .4, clearcoatRoughness: .4 });
  const body = new THREE.Group(); scene.add(body); const regions = {};
  function add(geo, pos, { sc, rz = 0, rx = 0, m } = {}) {
    const mat = m ? (regions[m] ||= { mat: base.clone(), meshes: [] }).mat : base;
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(...pos); if (sc) mesh.scale.set(...sc); mesh.rotation.z = rz; mesh.rotation.x = rx;
    mesh.castShadow = true; mesh.userData.m = m; body.add(mesh); if (m) regions[m].meshes.push(mesh); return mesh;
  }
  const S = (r, w = 32, h = 24) => new THREE.SphereGeometry(r, w, h), C = (r, l) => new THREE.CapsuleGeometry(r, l, 10, 24);
  add(S(.1), [0, 1.66, 0], { sc: [1, 1.15, 1.05] });
  add(C(.048, .07), [0, 1.52, 0]);
  add(C(.155, .3), [0, 1.22, 0], { sc: [1.12, 1, .7] });
  [-1, 1].forEach(s => {
    add(S(.105), [s * .085, 1.34, .06], { sc: [1.05, .72, .52], m: 'chest' });
    add(S(.082), [s * .215, 1.4, 0], { m: 'shoulders' });
    add(C(.052, .2), [s * .255, 1.2, 0], { rz: s * .1, m: 'arms' });
    add(C(.043, .2), [s * .29, .93, .03], { rz: s * .05, m: 'arms' });
    add(S(.045), [s * .3, .76, .04]);
    add(S(.098), [s * .078, .9, -.075], { sc: [1, 1, .85], m: 'glutes' });
    add(C(.078, .3), [s * .095, .64, 0], { m: 'legs' });
    add(C(.056, .28), [s * .1, .26, -.01], { m: 'legs' });
    add(new THREE.BoxGeometry(.085, .05, .22), [s * .1, .025, .04]);
  });
  add(C(.125, .28), [0, 1.25, -.065], { sc: [1.25, 1, .42], m: 'back' });
  add(C(.098, .14), [0, 1.06, .085], { sc: [1.12, 1, .42], m: 'core' });
  add(C(.14, .05), [0, .93, 0], { sc: [1.12, 1, .78] });
  const heart = add(S(.05), [.03, 1.3, .1], { m: 'cardio' }); heart.material.transparent = true;

  let sel = 'chest', hov = null;
  function paint() {
    for (const [k, R] of Object.entries(regions)) {
      const on = k === sel || (sel === 'cardio' && (k === 'legs' || k === 'glutes'));
      R.mat.color.set(on ? 0xffe31a : k === hov ? 0x4a4e58 : 0x2c2e34); R.mat.emissive.set(on ? 0x1b3ab8 : 0x000000); R.mat.emissiveIntensity = on ? .55 : 0;
    }
    regions.cardio.mat.opacity = sel === 'cardio' ? 1 : 0;
  }
  function choose(k) {
    sel = k; paint();
    $$('#musChips button').forEach(b => b.setAttribute('aria-selected', b.dataset.m === k));
    $('#musTitle').textContent = MUS[k][0]; $('#musDesc').textContent = MUS[k][1];
    const list = ORDER.filter(p => PRODUCTS[p].muscles.includes(k));
    $('#musList').innerHTML = list.map(p => `<button class="mini" data-3d="${p}"><img src="${THUMB[p]}" alt=""><span><b>${PRODUCTS[p].name}</b><span>Open in 3D</span></span></button>`).join('');
    if (!RM) gsap.fromTo('#musList .mini', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .05, ease: 'power3.out' });
  }
  $('#musChips').innerHTML = Object.keys(MUS).map(k => `<button data-m="${k}" aria-selected="false">${MUS[k][0]}</button>`).join('');
  $('#musChips').addEventListener('click', e => { const b = e.target.closest('button'); if (b) choose(b.dataset.m); });
  $('#musList').addEventListener('click', e => { const b = e.target.closest('[data-3d]'); if (b) P.showProduct(b.dataset['3d']); });
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
  const pick = e => { const b = canvas.getBoundingClientRect(); ptr.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(ptr, cam); const h = ray.intersectObjects(body.children).find(h => h.object.userData.m && h.object.userData.m !== 'cardio'); return h ? h.object.userData.m : null; };
  canvas.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
  canvas.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const m = pick(e); if (m) choose(m); } down = null; });
  canvas.addEventListener('pointermove', e => { const m = pick(e); if (m !== hov) { hov = m; canvas.style.cursor = m ? 'pointer' : ''; paint(); } });
  ctl.addEventListener('start', () => ctl.autoRotate = false);
  addView({ canvas, r, scene, cam, frame(t) { ctl.update(); if (sel === 'cardio' && !RM) heart.scale.setScalar(1 + Math.max(0, Math.sin(t * .008)) * .35); } });
  choose('chest');
}

/* ---------------------------------------------------------------- india install map */
if ($('#map')) {
  // [name, lat, lon, weight, desk key, label]
  const CITY = [['Jaipur showroom', 26.84, 75.82, 1, 'a', 'Showroom and head office'], ['Delhi NCR', 28.61, 77.21, .72, 'n', 'North desk'], ['Chandigarh', 30.73, 76.78, .5, 'n', 'Punjab and Haryana'], ['Ahmedabad', 23.02, 72.57, .6, 'n', 'Gujarat'], ['Chennai', 13.08, 80.27, .55, 'n', 'Tamil Nadu'], ['Mumbai', 19.08, 72.88, .72, 's', 'Maharashtra desk'], ['Pune', 18.52, 73.86, .45, 's', 'Maharashtra'], ['Lucknow', 26.85, 80.95, .55, 's', 'Uttar Pradesh'], ['Bengaluru', 12.97, 77.59, .62, 's', 'Bangalore'], ['Kolkata', 22.57, 88.36, .45, 'a', 'East'], ['Hyderabad', 17.39, 78.49, .5, 'a', 'Telangana and Andhra'], ['Indore', 22.72, 75.86, .4, 'a', 'Madhya Pradesh'], ['Guwahati', 26.14, 91.74, .35, 'a', 'North east'], ['Kochi', 9.93, 76.27, .4, 'a', 'Kerala']];
  const LON0 = 64, LON1 = 100, LAT0 = 4, LAT1 = 38, K = .28;
  const xy = (la, lo) => V((lo - (LON0 + LON1) / 2) * K, 0, -(la - (LAT0 + LAT1) / 2) * K);
  const canvas = $('#map'), r = renderer(canvas, { shadows: false });
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x06070a);
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const ctl = new OrbitControls(cam, canvas); ctl.enableDamping = true; ctl.enablePan = false; ctl.enableZoom = false; ctl.minPolarAngle = .3; ctl.maxPolarAngle = 1.05; ctl.minAzimuthAngle = -.6; ctl.maxAzimuthAngle = .6;
  ctl.target.set(0, 0, .5); cam.position.set(0, 10.6, 8.6);
  const TL = new THREE.TextureLoader(), day = TL.load('assets/tex/earth-blue-marble.jpg'), night = TL.load('assets/tex/earth-night.jpg');
  day.colorSpace = night.colorSpace = THREE.SRGBColorSpace; day.anisotropy = night.anisotropy = 8;
  const W = (LON1 - LON0) * K, H = (LAT1 - LAT0) * K;
  const mapMat = new THREE.ShaderMaterial({
    uniforms: { day: { value: day }, night: { value: night }, o: { value: new THREE.Vector4((LON0 + 180) / 360, (LAT0 + 90) / 180, (LON1 - LON0) / 360, (LAT1 - LAT0) / 180) } }, transparent: true,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `uniform sampler2D day,night;uniform vec4 o;varying vec2 vUv;
      void main(){vec2 u=o.xy+vUv*o.zw;vec3 d=texture2D(day,u).rgb;vec3 n=texture2D(night,u).rgb;
      float l=dot(d,vec3(.3,.59,.11));float land=smoothstep(.06,.14,l-d.b*.55+.05);
      vec3 col=mix(vec3(.018,.024,.04),vec3(.07,.08,.1)+d*.18,land)+pow(n,vec3(1.6))*vec3(1.,.72,.42)*1.3;
      vec2 e=min(vUv,1.-vUv);float a=smoothstep(0.,.12,min(e.x,e.y));
      gl_FragColor=vec4(col,a);
      #include <colorspace_fragment>
      }` });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mapMat); plane.rotation.x = -Math.PI / 2; scene.add(plane);
  const grid = new THREE.GridHelper(Math.max(W, H) * 1.4, 36, 0x1a2240, 0x10141f); grid.position.y = -.01; scene.add(grid);
  const glowTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(142,165,255,.9)'); gr.addColorStop(1, 'rgba(142,165,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const pillarGeo = new THREE.CylinderGeometry(.045, .045, 1, 16).translate(0, .5, 0);
  const pillarMat = new THREE.MeshBasicMaterial({ color: 0x5b7cff }), hotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const hitGeo = new THREE.CylinderGeometry(.18, .18, 1, 8).translate(0, .5, 0), hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const max = 1;
  const jp = xy(26.84, 75.82);
  const pillars = CITY.map(([n, la, lo, c], i) => {
    const g = new THREE.Group(); g.position.copy(xy(la, lo)); scene.add(g);
    const h = .25 + c / max * 1.6; const p = new THREE.Mesh(pillarGeo, i === 0 ? hotMat : pillarMat); p.scale.y = h; g.add(p);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 12), hotMat); cap.position.y = h; g.add(cap);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.rotation.x = -Math.PI / 2; glow.scale.set(.9, .9, 1); glow.position.y = .015; g.add(glow);
    const hit = new THREE.Mesh(hitGeo, hitMat); hit.scale.y = h; hit.userData.i = i; g.add(hit);
    g.scale.y = .001; g.userData = { h, cap, hit, glow };
    if (i !== 0) {
      const b = g.position, m = jp.clone().lerp(b, .5); m.y = .6 + jp.distanceTo(b) * .18;
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(jp.clone().setY(.02), m, b.clone().setY(.02)).getPoints(48)), new THREE.LineDashedMaterial({ color: 0xffe31a, dashSize: .12, gapSize: .1, transparent: true, opacity: .5 }));
      line.computeLineDistances(); scene.add(line); g.userData.line = line;
    }
    return g;
  });
  let active = 0;
  const card = $('#cityCard'), list = $('#cityList');
  list.innerHTML = CITY.map((c, i) => `<li><button data-i="${i}"><span>${c[0]}</span><b style="font-family:var(--sans);font-size:12px;color:var(--muted)">${c[5]}</b></button></li>`).join('');
  function focus(i, move = true) {
    active = i; const [n, , , , dk, lab] = CITY[i], d = DESKS[dk];
    card.innerHTML = i === 0
      ? `<h3>Jaipur</h3><p class="muted" style="margin-top:6px">Showroom and head office</p><p style="margin-top:14px;font-size:15px">F-1293, Phase-3, RIICO Industrial Area, Sitapura, Jaipur 302022</p><div class="row" style="margin-top:16px"><a class="btn btn-primary" href="#book" style="height:40px">Book a visit</a><a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=F-1293+RIICO+Industrial+Area+Sitapura+Jaipur" target="_blank" rel="noopener" style="height:40px">Directions</a></div>`
      : `<h3>${n}</h3><p class="muted" style="margin-top:6px">${lab}</p><div class="n" style="font-size:30px">${d.show}</div><p class="note" style="margin-top:10px">Covers ${d.area}.</p><div class="row" style="margin-top:14px"><a class="btn btn-primary" href="tel:+${d.num}" style="height:40px"><i class="ph ph-phone"></i>Call</a><a class="btn btn-ghost" href="https://wa.me/${d.num}" target="_blank" rel="noopener" style="height:40px"><i class="ph ph-whatsapp-logo"></i>WhatsApp</a></div>`;
    $$('#cityList button').forEach(b => b.setAttribute('aria-current', +b.dataset.i === i));
    pillars.forEach((p, k) => { p.userData.cap.scale.setScalar(k === i ? 1.8 : 1); p.userData.glow.scale.setScalar(k === i ? 1.6 : .9); });
    if (move) { const t = pillars[i].position; gsap.to(ctl.target, { x: t.x * .6, z: t.z * .6 + .4, duration: 1.1, ease: 'power3.inOut' }); }
  }
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (b) focus(+b.dataset.i); });
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
  const pick = e => { const b = canvas.getBoundingClientRect(); ptr.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); ray.setFromCamera(ptr, cam); const h = ray.intersectObjects(pillars.map(p => p.userData.hit)); return h.length ? h[0].object.userData.i : -1; };
  canvas.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
  canvas.addEventListener('pointerup', e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) { const i = pick(e); if (i >= 0) focus(i); } down = null; });
  canvas.addEventListener('pointermove', e => canvas.style.cursor = pick(e) >= 0 ? 'pointer' : '');
  ScrollTrigger.create({ trigger: '#mapWrap', start: 'top 70%', once: true, onEnter: () => pillars.forEach((p, i) => gsap.to(p.scale, { y: 1, duration: RM ? 0 : 1.2, delay: RM ? 0 : i * .05, ease: 'expo.out' })) });
  addView({ canvas, r, scene, cam, frame(t) { ctl.update(); if (!RM) pillars.forEach(p => { if (p.userData.line) p.userData.line.material.dashOffset -= .004; }); } });
  focus(0, false);
}

/* ---------------------------------------------------------------- before / after (rendered shell vs fitted floor) */
if ($('#ba')) {
  const c = document.createElement('canvas'), r = renderer(c, { preserve: true, dpr: 1 }); r.setSize(1600, 900, false);
  const s = new THREE.Scene(); s.environment = env(r);
  const cam = new THREE.PerspectiveCamera(46, 16 / 9, .1, 80); cam.position.set(7.2, 2.3, 5.4); cam.lookAt(-1.5, 1.0, -2.2);
  const RW = 16, RL = 12;
  const conc = canvasTex(1024, 1024, (g, Wd) => { g.fillStyle = '#7d7b77'; g.fillRect(0, 0, Wd, Wd); for (let i = 0; i < 40000; i++) { const v = 90 + Math.random() * 60 | 0; g.fillStyle = `rgba(${v},${v - 3},${v - 8},${Math.random() * .25})`; g.fillRect(Math.random() * Wd, Math.random() * Wd, 2, 2); } for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(60,55,50,${.06 + Math.random() * .08})`; g.beginPath(); g.ellipse(Math.random() * Wd, Math.random() * Wd, 60 + Math.random() * 120, 40 + Math.random() * 80, Math.random() * 3, 0, 7); g.fill(); } });
  conc.wrapS = conc.wrapT = THREE.RepeatWrapping; conc.repeat.set(4, 3);
  const rub = canvasTex(512, 512, (g, Wd) => { g.fillStyle = '#18191b'; g.fillRect(0, 0, Wd, Wd); for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < .08 ? 'rgba(80,110,220,.5)' : 'rgba(70,70,74,.5)'; g.fillRect(Math.random() * Wd, Math.random() * Wd, 2, 2); } g.strokeStyle = '#0e0e10'; g.lineWidth = 3; g.strokeRect(0, 0, Wd, Wd); });
  rub.wrapS = rub.wrapT = THREE.RepeatWrapping; rub.repeat.set(16, 12);
  const floorM = new THREE.MeshStandardMaterial({ map: conc, roughness: .95 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RL), floorM); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  const wallM = new THREE.MeshStandardMaterial({ color: 0x8a8884, roughness: .95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(RW, 4.2), wallM); back.position.set(0, 2.1, -RL / 2); s.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(RL, 4.2), wallM); left.rotation.y = Math.PI / 2; left.position.set(-RW / 2, 2.1, 0); s.add(left);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RL), new THREE.MeshStandardMaterial({ color: 0x6d6b67, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.2; s.add(ceil);
  const winM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.65, 1.75) });
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), winM); w.position.set(-5.5 + i * 3.6, 2.4, -RL / 2 + .02); s.add(w); }
  const col = new THREE.MeshStandardMaterial({ color: 0x8f8d89, roughness: .9 });
  [[-2.5, -1.5], [2.5, -1.5]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(.5, 4.2, .5), col); p.position.set(x, 2.1, z); p.castShadow = p.receiveShadow = true; s.add(p); });
  const sun = new THREE.DirectionalLight(0xdfe7ff, 1.4); sun.position.set(-2, 6, -9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, far: 30 }); s.add(sun);
  const hemi = new THREE.HemisphereLight(0xdfe6f0, 0x50504c, .9); s.add(hemi);
  // "before": dull site light, a few construction bits
  const site = new THREE.Group(); s.add(site);
  const bag = new THREE.MeshStandardMaterial({ color: 0xb9ae98, roughness: 1 });
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .18, .4), bag); b.position.set(-5 + i * .1, .09 + i * .18 * (i < 3 ? 1 : 0), -4 + (i > 2 ? .5 : 0)); b.castShadow = true; site.add(b); }
  const ladder = new THREE.Group(); ladder.position.set(1, 0, -3); ladder.rotation.y = .4; site.add(ladder);
  [-.25, .25].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(.05, 2.2, .05), new THREE.MeshStandardMaterial({ color: 0xc9a227 })); l.position.set(x, 1.05, 0); l.rotation.x = -.18; l.castShadow = true; ladder.add(l); });
  s.environmentIntensity = .25; r.toneMappingExposure = .9; r.render(s, cam); $('#baBefore').src = c.toDataURL('image/jpeg', .9);
  // "after": rubber floor, LED lines, mirror wall, equipment rows
  site.visible = false; floorM.map = rub; floorM.roughness = .8; floorM.color.set(0xffffff); floorM.needsUpdate = true;
  wallM.color.set(0x25272b); ceil.material.color.set(0x141518); col.color.set(0x2a2c30);
  const fit = new THREE.Group(); s.add(fit);
  const led = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.35, 2.2) });
  for (let x = -6; x <= 6; x += 3) { const l = new THREE.Mesh(new THREE.BoxGeometry(.08, .03, RL - 1), led); l.position.set(x, 4.17, 0); fit.add(l); }
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(RW, .08), new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, .8, 3) })); stripe.position.set(0, 3.2, -RL / 2 + .03); fit.add(stripe);
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(RL - 2, 2.2), new THREE.MeshStandardMaterial({ color: 0x9aa2b0, metalness: 1, roughness: .05 })); mirror.rotation.y = Math.PI / 2; mirror.position.set(-RW / 2 + .03, 1.4, 0); fit.add(mirror);
  const brand = canvasTex(2048, 256, (g, Wd, Hd) => { g.fillStyle = '#fff'; g.font = '800 180px Archivo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PROBODYLINE', Wd / 2, Hd / 2 + 8); });
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(6, .75), new THREE.MeshBasicMaterial({ map: brand, transparent: true, color: new THREE.Color(1.3, 1.3, 1.3) })); bp.position.set(2.2, 3.65, -RL / 2 + .04); fit.add(bp);
  const put = (k, x, z, ry = 0) => { const g = productMesh(k); g.position.set(x, 0, z); g.rotation.y = ry; fit.add(g); };
  for (let i = 0; i < 6; i++) put('treadmill', -5.6 + i * 1.15, -4.6, 0);
  for (let i = 0; i < 4; i++) put('bike', 1.8 + i * 1.0, -4.8, 0);
  for (let i = 0; i < 3; i++) put('press', -6.6, -1.6 + i * 2.4, Math.PI / 2);
  for (let i = 0; i < 2; i++) put('station', -3.6 + i * 2.2, 1.2, 0);
  put('rack', 1.2, 1.4, 0); put('rack', 4.4, 1.4, 0);
  put('dumbbells', 5.5, -1.6, -Math.PI / 2); put('bench', 4.6, 4.2, 0); put('elliptical', -3.2, 4.4, Math.PI);
  s.environmentIntensity = .7; hemi.intensity = .55; sun.intensity = 1.6; r.toneMappingExposure = 1.05;
  const pl = new THREE.PointLight(0xffe2c4, 40, 14, 1.6); pl.position.set(0, 3.6, 0); s.add(pl);
  r.render(s, cam); $('#baAfter').src = c.toDataURL('image/jpeg', .9);
  r.dispose(); r.forceContextLoss();
  const set = v => { $('#baBeforeWrap').style.clipPath = `inset(0 ${100 - v}% 0 0)`; $('#baHandle').style.left = v + '%'; };
  $('#baRange').addEventListener('input', e => set(+e.target.value)); set(50);
  if (!RM) ScrollTrigger.create({ trigger: '#ba', start: 'top 75%', once: true, onEnter: () => { const o = { v: 82 }; gsap.to(o, { v: 50, duration: 1.4, ease: 'power3.inOut', onUpdate: () => { set(o.v); $('#baRange').value = o.v; } }); } });
}

/* ---------------------------------------------------------------- gym planner: 3D layout, pricing, proforma */
const PLAN = { sqft: 2500, kind: 'commercial', focus: 'balanced' };
if ($('#planView')) {
  const MIX = { cardio: { T: .32, B: .2, E: .16, S: .22, F: .1 }, balanced: { T: .2, B: .12, E: .1, S: .38, F: .2 }, strength: { T: .1, B: .06, E: .05, S: .47, F: .32 } };
  const PER = { home: 140, studio: 110, commercial: 105, hotel: 120 };
  const FOOT = { treadmill: [1.15, 2.55], bike: [.95, 1.55], elliptical: [1.0, 2.35], press: [1.85, 2.3], station: [1.55, 2.1], rack: [2.0, 3.3], dumbbells: [3.0, 1.45], bench: [1.0, 1.8] };
  const ZONES = [['dumbbells', 'bench'], ['rack', 'station', 'press'], ['bike', 'elliptical', 'treadmill']];
  const canvas = $('#planView'), r = renderer(canvas); r.toneMappingExposure = 1.15;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0e0f11); scene.environment = env(r); scene.environmentIntensity = .9;
  const key = lights(scene, 14, 2.2); key.color.set(0xffe9d2);
  scene.add(new THREE.HemisphereLight(0xfff2e2, 0x1a1c20, .5));
  const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 400); let viewSize = 20;
  const ctl = new OrbitControls(cam, canvas); ctl.enableDamping = true; ctl.enablePan = false; ctl.enableZoom = false; ctl.minPolarAngle = .5; ctl.maxPolarAngle = 1.15;
  const rub = canvasTex(512, 512, (g, Wd) => { g.fillStyle = '#2a2b2f'; g.fillRect(0, 0, Wd, Wd); for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < .07 ? 'rgba(2,151,222,.45)' : Math.random() < .5 ? 'rgba(90,92,98,.55)' : 'rgba(20,21,24,.55)'; g.fillRect(Math.random() * Wd, Math.random() * Wd, 2, 2); } g.strokeStyle = '#18191c'; g.lineWidth = 3; g.strokeRect(0, 0, Wd, Wd); });
  rub.wrapS = rub.wrapT = THREE.RepeatWrapping;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: rub, roughness: .85 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallM = new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: .85 });
  // a real gym floor: mirrors on the side wall, a lit cove along the top and light vinyl under the cardio row
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.9), new THREE.MeshStandardMaterial({ color: 0xc9d2da, metalness: 1, roughness: .06, envMapIntensity: 1.4 })); mirror.rotation.y = Math.PI / 2; scene.add(mirror);
  const ledM = new THREE.MeshBasicMaterial({ color: 0x2fb4ff, toneMapped: false });
  const ledB = new THREE.Mesh(new THREE.BoxGeometry(1, .06, .06), ledM), ledL = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, 1), ledM); scene.add(ledB, ledL);
  const vinyl = canvasTex(512, 512, (g, Wd) => { g.fillStyle = '#56595f'; g.fillRect(0, 0, Wd, Wd); for (let y = 0; y < Wd; y += 64) { g.fillStyle = `rgba(${y % 128 ? '255,255,255,.04' : '0,0,0,.06'})`; g.fillRect(0, y, Wd, 64); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, Wd, 2); g.fillRect(((y / 64) % 3) * 170, y, 2, 64); } });
  vinyl.wrapS = vinyl.wrapT = THREE.RepeatWrapping;
  const turfT = canvasTex(256, 1024, (g, Wd, Hd) => { g.fillStyle = '#2f6b34'; g.fillRect(0, 0, Wd, Hd); for (let i = 0; i < 6000; i++) { g.fillStyle = Math.random() < .5 ? 'rgba(70,140,70,.5)' : 'rgba(20,60,25,.5)'; g.fillRect(Math.random() * Wd, Math.random() * Hd, 1, 3); } g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(0, 0, Wd, 6); g.fillRect(0, Hd - 6, Wd, 6); for (let y = 0; y < Hd; y += 128) g.fillRect(0, y, Wd, 3); });
  const turf = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: turfT, roughness: 1 })); turf.rotation.x = -Math.PI / 2; turf.rotation.z = Math.PI / 2; turf.position.y = .003; turf.receiveShadow = true; scene.add(turf);
  const slatT = canvasTex(1024, 256, (g, Wd, Hd) => { for (let x = 0; x < Wd; x += 16) { g.fillStyle = `hsl(28,${38 + Math.random() * 10}%,${30 + Math.random() * 8}%)`; g.fillRect(x, 0, 12, Hd); g.fillStyle = '#121212'; g.fillRect(x + 12, 0, 4, Hd); } });
  const slats = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.2), new THREE.MeshStandardMaterial({ map: slatT, roughness: .7 })); scene.add(slats);
  const vinylM = new THREE.MeshStandardMaterial({ map: vinyl, roughness: .45 });
  const pads = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), vinylM); m.rotation.x = -Math.PI / 2; m.position.y = .004; m.receiveShadow = true; m.visible = false; scene.add(m); return m; });
  const wB = new THREE.Mesh(new THREE.BoxGeometry(1, 2.6, .15), wallM), wL = new THREE.Mesh(new THREE.BoxGeometry(.15, 2.6, 1), wallM); [wB, wL].forEach(w => { w.castShadow = w.receiveShadow = true; scene.add(w); });
  const brand = canvasTex(2048, 256, (g, Wd, Hd) => { g.fillStyle = '#fff'; g.font = '800 170px Archivo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PROBODYLINE', Wd / 2, Hd / 2 + 8); });
  const brandP = new THREE.Mesh(new THREE.PlaneGeometry(1, .125), new THREE.MeshBasicMaterial({ map: brand, transparent: true })); scene.add(brandP);
  const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-.5, 0, -.5), V(.5, 0, -.5), V(.5, 0, .5), V(-.5, 0, .5)]), new THREE.LineBasicMaterial({ color: 0xffe31a, transparent: true, opacity: .6 })); edge.position.y = .01; scene.add(edge);
  const zoneTex = t => canvasTex(512, 96, (g, Wd, Hd) => { g.fillStyle = 'rgba(142,165,255,.85)'; g.font = '700 54px Archivo, sans-serif'; g.textBaseline = 'middle'; g.fillText(t, 8, Hd / 2); });
  const zoneLbl = ['FREE WEIGHTS', 'STRENGTH', 'CARDIO'].map(t => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .45), new THREE.MeshBasicMaterial({ map: zoneTex(t), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; scene.add(m); return m; });
  const CAP = 140, INST = {};
  Object.keys(BAKED).forEach(k => { const grp = new THREE.Group(); scene.add(grp); INST[k] = { grp, ims: BAKED[k].map(({ geo, mat }) => { const im = new THREE.InstancedMesh(geo, mat, CAP); im.count = 0; im.castShadow = im.receiveShadow = !mat.isMeshBasicMaterial; im.frustumCulled = false; grp.add(im); return im; }) }; });
  const _m = new THREE.Matrix4();
  let counts = {}, placed = {}, W = 10, D = 10;
  function compute(nOverride) {
    const area = PLAN.sqft * .0929, n = nOverride ?? clamp(Math.round(PLAN.sqft / PER[PLAN.kind]), 4, 220), mix = MIX[PLAN.focus];
    const c = {}; let sum = 0; for (const k in mix) { c[k] = Math.round(n * mix[k]); sum += c[k]; } c.S += n - sum;
    const S = c.S, F = c.F, press = Math.round(S * .4), station = Math.round(S * .4), dumbbells = Math.max(F > 0 ? 1 : 0, Math.round(F * .3));
    counts = { treadmill: c.T, bike: c.B, elliptical: c.E, press, station, rack: S - press - station, dumbbells, bench: F - dumbbells };
    W = Math.sqrt(area * 1.45); D = area / W; return area;
  }
  function pack() {
    placed = {}; let unplaced = 0;
    let z = -D / 2 + .5, x = -W / 2 + .5, rowD = 0; const zoneStarts = [];
    ZONES.forEach(zone => {
      let first = true;
      zone.forEach(k => {
        const [fw, fd] = FOOT[k]; placed[k] = [];
        for (let i = 0; i < counts[k]; i++) {
          if (x + fw > W / 2 - .4) { x = -W / 2 + .5; z += rowD + .9; rowD = 0; }
          if (z + fd > D / 2 - .4 || placed[k].length >= CAP) { unplaced++; continue; }
          if (first) { zoneStarts.push(z); first = false; }
          placed[k].push([x + fw / 2, z + fd / 2]); x += fw; rowD = Math.max(rowD, fd);
        }
      });
      if (first) zoneStarts.push(D);
    });
    return { unplaced, zoneStarts };
  }
  function layout(anim) {
    let n = clamp(Math.round(PLAN.sqft / PER[PLAN.kind]), 4, 220), area = compute(n), res = pack(), cut = 0;
    for (let t = 0; t < 10 && res.unplaced > 0 && n > 4; t++) { const d = Math.max(1, Math.ceil(res.unplaced * .7)); n -= d; cut += d; area = compute(n); res = pack(); }
    const { unplaced, zoneStarts } = res;
    Object.entries(INST).forEach(([k, { grp, ims }]) => {
      const list = placed[k] || [];
      ims.forEach(im => { list.forEach(([x, zz], i) => { _m.makeTranslation(x, 0, zz); im.setMatrixAt(i, _m); }); im.count = list.length; im.instanceMatrix.needsUpdate = true; });
      if (anim && !RM && list.length) gsap.fromTo(grp.scale, { y: .02 }, { y: 1, duration: .7, delay: ORDER.indexOf(k) * .06, ease: 'back.out(1.6)' });
    });
    floor.scale.set(W, D, 1); rub.repeat.set(W / 1, D / 1);
    // one vinyl pad under each run of treadmills and cross-trainers
    const runs = {}; ['treadmill', 'elliptical'].forEach(k => (placed[k] || []).forEach(([x, zz]) => { const [fw, fd] = FOOT[k], r = runs[(zz - fd / 2).toFixed(2)] ??= { x0: 1e9, x1: -1e9, z0: zz - fd / 2, z1: -1e9 }; r.x0 = Math.min(r.x0, x - fw / 2); r.x1 = Math.max(r.x1, x + fw / 2); r.z1 = Math.max(r.z1, zz + fd / 2); }));
    pads.forEach((m, i) => { const r = Object.values(runs)[i]; m.visible = !!r; if (!r) return; m.scale.set(r.x1 - r.x0 + .6, r.z1 - r.z0 + .6, 1); m.position.x = (r.x0 + r.x1) / 2; m.position.z = (r.z0 + r.z1) / 2; });
    vinyl.repeat.set(1, 1);
    // turf lane along the front, wood slats behind the logo
    turf.scale.set(1.4, W * .62, 1); turf.position.set(-W * .12, .003, D / 2 - 1.1);
    const sw = Math.min(W * .55, 10); slats.scale.x = sw; slats.position.set(0, 1.25, -D / 2 + .005); brandP.position.z = -D / 2 + .02;
    mirror.scale.x = D * .8; mirror.position.set(-W / 2 + .01, 1.25, 0);
    ledB.scale.x = W + .3; ledB.position.set(0, 2.62, -D / 2 - .02); ledL.scale.z = D; ledL.position.set(-W / 2 - .02, 2.62, 0);
    wB.scale.x = W + .3; wB.position.set(0, 1.3, -D / 2 - .075); wL.scale.z = D; wL.position.set(-W / 2 - .075, 1.3, 0);
    brandP.scale.set(Math.min(W * .5, 9), Math.min(W * .5, 9), 1); brandP.position.set(0, 1.9, -D / 2 + .01);
    edge.scale.set(W, 1, D);
    zoneLbl.forEach((m, i) => { m.position.set(-W / 2 + 1.7, .02, Math.min(zoneStarts[i] - .2, D / 2 - .4)); m.visible = zoneStarts[i] < D / 2 - .6; });
    const sp = Math.max(W, D); Object.assign(key.shadow.camera, { left: -sp, right: sp, top: sp, bottom: -sp }); key.shadow.camera.updateProjectionMatrix(); key.position.set(sp * .5, sp * 1.2, sp * .6);
    viewSize = Math.max(W, D) * .92 + 1.5; sizeView(view);
    const total = Object.values(placed).reduce((a, l) => a + l.length, 0);
    $('#total').textContent = total; $('#area').textContent = Math.round(area).toLocaleString('en-IN');
    $('#legend').innerHTML = ORDER.filter(k => (placed[k] || []).length).map(k => `<span>${PRODUCTS[k].short} <b>${placed[k].length}</b></span>`).join('');
    const warn = $('#planWarn'); warn.hidden = !cut; warn.textContent = `Trimmed by ${cut} machine${cut === 1 ? '' : 's'} to keep safe aisles between every row.`;
    updWa(); document.dispatchEvent(new Event('plan'));
  }
  function lines() { return ORDER.filter(k => (placed[k] || []).length).map(k => ({ k, q: placed[k].length, rate: PRODUCTS[k].price ?? null })); }
  function updWa() {
    const msg = `Hi Probodyline, I'm planning a ${PLAN.kind} gym of ${PLAN.sqft} sq ft in ${region} (${PLAN.focus} focus). Layout: ` + lines().map(l => `${l.q} x ${PRODUCTS[l.k].short}`).join(', ') + '. Please send a quote.';
    $('#wa').href = waLink(msg);
  }
  listeners.push(updWa);
  const view = addView({ canvas, r, scene, cam, ortho(w, h) { const a = w / h; cam.left = -viewSize * a / 2; cam.right = viewSize * a / 2; cam.top = viewSize / 2; cam.bottom = -viewSize / 2; }, frame() { ctl.update(); } });
  cam.position.set(30, 34, 38); ctl.target.set(0, 0, 0); ctl.update();
  ['kind', 'focus'].forEach(id => $$('#' + id + ' button').forEach(b => b.addEventListener('click', () => { $$('#' + id + ' button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); PLAN[id] = b.dataset.v; layout(true); })));
  let deb; $('#sqft').addEventListener('input', e => { PLAN.sqft = +e.target.value; $('#sqftV').textContent = PLAN.sqft.toLocaleString('en-IN'); clearTimeout(deb); deb = setTimeout(() => layout(false), 60); });
  P.plan = {
    state: () => { const L = lines(), priced = L.length && L.every(l => l.rate), sub = priced ? L.reduce((a, l) => a + l.q * l.rate, 0) : 0; return { ...PLAN, lines: L, priced, sub, total: sub * (1 + GST), machines: L.reduce((a, l) => a + l.q, 0), area: W * D }; },
    apply(o) { Object.assign(PLAN, o); $('#sqft').value = PLAN.sqft; $('#sqftV').textContent = PLAN.sqft.toLocaleString('en-IN'); ['kind', 'focus'].forEach(id => $$('#' + id + ' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === PLAN[id]))); layout(true); },
    group() { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: .9 })); f.rotation.x = -Math.PI / 2; g.add(f);
      Object.entries(placed).forEach(([k, l]) => l.forEach(([x, z]) => { const m = productMesh(k); m.position.set(x, 0, z); g.add(m); })); return g; },
  };
  $('#planAR').addEventListener('click', () => openAR(P.plan.group(), t => { const n = $('#planWarn'); n.hidden = !t; n.textContent = t; }));
  try { const h = JSON.parse(sessionStorage.getItem('pbl-plan') || 'null'); if (h) { sessionStorage.removeItem('pbl-plan'); Object.assign(PLAN, h); $('#sqft').value = PLAN.sqft; $('#sqftV').textContent = PLAN.sqft.toLocaleString('en-IN'); ['kind', 'focus'].forEach(id => $$('#' + id + ' button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === PLAN[id]))); } } catch (e) { }
  layout(false);
  ScrollTrigger.create({ trigger: '#plan', start: 'top 60%', once: true, onEnter: () => layout(true) });

  // proforma
  const dlg = $('#proforma');
  $('#proformaBtn').addEventListener('click', () => {
    const L = lines(), priced = L.length && L.every(l => l.rate), sub = priced ? L.reduce((a, l) => a + l.q * l.rate, 0) : 0, gst = sub * GST, d = new Date();
    const no = `PBL-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fd = x => x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const rate = l => priced ? inr(l.rate) : 'On request', amt = l => priced ? inr(l.q * l.rate) : '';
    dlg.innerHTML = `<div class="doc">
      <div class="doc-top"><div><div class="wm">PROBODYLINE</div><div style="color:#666;font-size:12px;margin-top:4px">Creative Enterprises<br>F-1293, Phase-3, RIICO Industrial Area, Sitapura, Jaipur 302022</div></div>
      <div class="t"><b>${priced ? 'Proforma invoice' : 'Quotation request'}</b><span style="font-family:var(--mono)">${no}</span><br><span style="color:#666;font-size:12px">${fd(d)}</span></div></div>
      <div class="doc-meta"><div><small>Prepared for</small><input value="" placeholder="Your gym or company name" aria-label="Prepared for"></div><div><small>Project</small><b style="font-size:15px">${PLAN.kind[0].toUpperCase() + PLAN.kind.slice(1)} gym, ${PLAN.sqft.toLocaleString('en-IN')} sq ft, ${region}</b></div></div>
      <table><thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
      <tbody>${L.map((l, i) => `<tr><td>${i + 1}</td><td>${PRODUCTS[l.k].name}<br><small style="color:#777">${PRODUCTS[l.k].cat}</small></td><td class="r">${l.q}</td><td class="r">${rate(l)}</td><td class="r">${amt(l)}</td></tr>`).join('')}
      <tr><td>${L.length + 1}</td><td>Delivery, installation and floor layout</td><td class="r">1</td><td class="r">${priced ? 'Included' : 'On request'}</td><td class="r"></td></tr></tbody>
      ${priced ? `<tfoot><tr><td colspan="4" class="r">Subtotal</td><td class="r">${inr(sub)}</td></tr><tr><td colspan="4" class="r">GST at ${Math.round(GST * 100)}%</td><td class="r">${inr(gst)}</td></tr><tr class="tot"><td colspan="4" class="r">Total</td><td class="r">${inr(sub + gst)}</td></tr></tfoot>` : `<tfoot><tr class="tot"><td colspan="2">Total machines</td><td class="r">${L.reduce((a, l) => a + l.q, 0)}</td><td colspan="2"></td></tr></tfoot>`}</table>
      <p class="fine">${priced ? `Prices include delivery and installation. GST at ${Math.round(GST * 100)}% applies.` : 'Models, prices and delivery dates are confirmed by the sales desk.'} Sales desk for ${region}: ${desk().show}.</p>
    </div>
    <div class="doc-actions"><button class="btn btn-ghost" style="color:var(--ink)" data-x="close">Close</button><button class="btn btn-ghost" style="color:var(--ink)" data-x="print"><i class="ph ph-printer"></i>Print or save PDF</button><a class="btn btn-primary" target="_blank" rel="noopener" href="${waLink(`Hi Probodyline, please quote request ${no}: ` + L.map(l => `${l.q} x ${PRODUCTS[l.k].short}`).join(', ') + ` for a ${PLAN.kind} gym of ${PLAN.sqft} sq ft in ${region}.`)}"><i class="ph ph-whatsapp-logo"></i>Send to sales</a></div>`;
    dlg.showModal();
  });
  dlg.addEventListener('click', e => { const x = e.target.closest('[data-x]'); if (e.target === dlg || (x && x.dataset.x === 'close')) dlg.close(); if (x && x.dataset.x === 'print') print(); });
}

/* ---------------------------------------------------------------- showroom visit booking */
if ($('#cal')) {
  const days = [], today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 21; i++) days.push(new Date(today.getTime() + i * 864e5));
  const B = { day: null, slot: null, interests: new Set(['Strength']), video: false };
  const cal = $('#cal'), DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const lead = (today.getDay() + 6) % 7;
  cal.innerHTML = DOW.map(d => `<span class="dow">${d}</span>`).join('') + '<span></span>'.repeat(lead) + days.map((d, i) => `<button type="button" data-i="${i}" aria-pressed="false" aria-label="${d.toDateString()}">${d.getDate()}<small>${d.toLocaleDateString('en-IN', { month: 'short' })}</small></button>`).join('');
  $('#calMonth').textContent = days[0].toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) + (days[20].getMonth() !== days[0].getMonth() ? ' to ' + days[20].toLocaleDateString('en-IN', { month: 'long' }) : '');
  const SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  function drawSlots() {
    const now = new Date();
    $('#slots').innerHTML = SLOTS.map(s => { const past = B.day === 0 && +s.slice(0, 2) <= now.getHours(); return `<button type="button" data-s="${s}" ${past ? 'disabled' : ''} aria-pressed="${B.slot === s}">${s}</button>`; }).join('');
  }
  $('#interest').innerHTML = ['Cardio', 'Strength', 'Free weights', 'Full gym setup', 'Home gym'].map(t => `<button type="button" class="chip" data-t="${t}" aria-pressed="${B.interests.has(t)}">${t}</button>`).join('');
  cal.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; B.day = +b.dataset.i; $$('#cal button').forEach(x => x.setAttribute('aria-pressed', x === b)); if (B.day === 0) B.slot = null; drawSlots(); sum(); });
  $('#slots').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; B.slot = b.dataset.s; $$('#slots button').forEach(x => x.setAttribute('aria-pressed', x === b)); sum(); });
  $('#interest').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const t = b.dataset.t; B.interests.has(t) ? B.interests.delete(t) : B.interests.add(t); b.setAttribute('aria-pressed', B.interests.has(t)); sum(); });
  $('#videoTour').addEventListener('change', e => { B.video = e.target.checked; sum(); });
  const fmtDay = i => days[i].toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  function sum() {
    $('#bSummary').innerHTML = `<b>${B.video ? 'Live video tour' : 'Showroom visit'}</b><br>${B.day === null ? 'Pick a day' : fmtDay(B.day)}${B.slot ? ', ' + B.slot : B.day !== null ? ', pick a time' : ''}<br>${[...B.interests].join(', ') || 'Anything you like'}<br><span class="muted">Confirmed by ${desk().show}</span>`;
  }
  listeners.push(sum);
  const err = (id, t) => { $('#' + id + 'Err').textContent = t; $('#' + id).setAttribute('aria-invalid', !!t); };
  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#bName').value.trim(), phone = $('#bPhone').value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    err('bName', name.length < 2 ? 'Tell us your name.' : ''); err('bPhone', /^[6-9]\d{9}$/.test(phone) ? '' : 'Enter a 10 digit mobile number.');
    if (B.day === null || !B.slot) { $('#bSummary').innerHTML += '<br><span style="color:#ff9d90">Pick a day and a time first.</span>'; return; }
    if (name.length < 2 || !/^[6-9]\d{9}$/.test(phone)) return;
    const what = B.video ? 'a live video tour of the showroom' : 'a showroom visit';
    const msg = `Hi Probodyline, I'm ${name} (${phone}). I'd like to book ${what} on ${fmtDay(B.day)} at ${B.slot}. Interested in: ${[...B.interests].join(', ') || 'everything'}. I'm in ${region}.`;
    window.open(waLink(msg), '_blank', 'noopener');
    const start = new Date(days[B.day]); start.setHours(+B.slot.slice(0, 2), 0, 0, 0); const end = new Date(start.getTime() + 90 * 6e4);
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Probodyline//Visit//EN', 'BEGIN:VEVENT', `UID:${Date.now()}@probodyline`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART:${start.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTEND:${end.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `SUMMARY:${B.video ? 'Probodyline video tour' : 'Probodyline showroom visit'}`, 'LOCATION:F-1293 Phase-3 RIICO Industrial Area Sitapura Jaipur 302022', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const done = $('#bookDone'); $('#bookForm').hidden = true; done.hidden = false;
    done.innerHTML = `<div class="done-ic"><i class="ph ph-check"></i></div><h3 class="display" style="font-size:44px">Almost booked, ${name.split(' ')[0]}.</h3><p class="muted">WhatsApp opened with your request. Press send there and the ${desk().area} desk confirms your slot.</p><div class="summary">${$('#bSummary').innerHTML}</div><div class="row"><a class="btn btn-ghost" href="${url}" download="probodyline-visit.ics"><i class="ph ph-calendar-plus"></i>Add to calendar</a><button class="btn btn-ghost" id="bookAgain">Change details</button></div>`;
    $('#bookAgain').onclick = () => { done.hidden = true; $('#bookForm').hidden = false; };
    if (!RM) gsap.from(done, { y: 20, opacity: 0, duration: .5, ease: 'power3.out' });
  });
  drawSlots(); sum();
}

/* ---------------------------------------------------------------- shared with more.js */
Object.assign(P, { THUMB, ORDER, inr, waLink, desk, setRegion, getRegion: () => region, STATES, productMesh, centred, renderer, env, lights, addView, frameCam, openAR, onRegion: f => listeners.push(f) });

/* ---------------------------------------------------------------- finish */
setRegion(region);
if (!RM) {
  ScrollTrigger.batch('.pc, .card, .roi-out', { start: 'top 92%', onEnter: els => gsap.from(els, { y: 36, opacity: 0, duration: .8, stagger: .06, ease: 'power3.out' }) });
}
ScrollTrigger.refresh();
