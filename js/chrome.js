// Site chrome shared by every page: header, menu overlay, footer, mobile action bar, consultant and compare.
// Loaded as a classic script so the markup exists before the modules bind to it.
(function () {
  const me = document.currentScript, part = me.dataset.part || 'header', page = document.body.dataset.page || '';
  const NAV = [['equipment.html', 'Equipment', 'equipment'], ['solutions.html', 'Solutions', 'solutions'], ['plan.html', 'Plan your gym', 'plan'], ['showroom.html', 'Showroom', 'showroom'], ['projects.html', 'Projects', 'projects']];
  const MENU = [
    ['Equipment', [['equipment.html', 'All equipment'], ['strength.html', 'Strength'], ['equipment.html#cardio', 'Cardio'], ['equipment.html#free-weights', 'Free weights'], ['iso-lateral-press.html', 'Iso-lateral press']]],
    ['Solutions', [['solutions.html', 'All solutions'], ['commercial-gyms.html', 'Commercial gyms'], ['solutions.html#home', 'Home gyms'], ['solutions.html#hotels', 'Hotels and offices']]],
    ['Company', [['showroom.html', 'Showroom'], ['projects.html', 'Projects'], ['about.html', 'About'], ['contact.html', 'Contact']]],
    ['Owners', [['support.html', 'Support'], ['support.html#warranty', 'Warranty'], ['support.html#service', 'Book a service'], ['support.html#spares', 'Spares']]],
  ];
  const html = {
    header: `
<div class="grain" aria-hidden="true"></div>
<header class="nav${page === 'home' ? '' : ' solid'}" id="nav">
  <i class="progress-bar" id="progress" aria-hidden="true"></i>
  <a href="index.html" class="wordmark" aria-label="Probodyline home">PROBODYLINE</a>
  <ul>${NAV.map(([h, l, k]) => `<li><a href="${h}"${k === page ? ' aria-current="page" class="is-active"' : ''}>${l}</a></li>`).join('')}</ul>
  <div class="nav-r">
    <label class="region" title="Your state. Every call and WhatsApp button goes to the sales desk that covers it."><i class="ph ph-map-pin"></i><select data-region aria-label="Your state"></select></label>
    <button class="sound" id="sound" aria-pressed="false" aria-label="Turn sound on" title="Sound"><span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>
    <a class="btn btn-primary nav-cta" href="showroom.html#book">Book a visit</a>
    <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menu"><span></span><span></span><b>Menu</b></button>
  </div>
</header>
<div class="menu" id="menu" hidden>
  <div class="menu-in">
    <div class="menu-cols">${MENU.map(([t, ls]) => `<div><h3>${t}</h3><ul>${ls.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>`).join('')}</div>
    <div class="menu-side">
      <p class="lab">Showroom</p><p>F-1293, Phase-3, RIICO Industrial Area<br>Sitapura, Jaipur 302022</p>
      <p class="lab" style="margin-top:22px">Your sales desk</p><p><a data-desk-link><span data-desk></span></a></p>
      <a class="btn btn-primary" href="showroom.html#book" style="margin-top:24px">Book a visit</a>
    </div>
  </div>
</div>`,
    footer: `
<section class="pre-foot">
  <video data-src="assets/v/banner.mp4" poster="assets/v/banner.jpg" muted playsinline loop preload="none" aria-hidden="true"></video><div class="pf-shade" aria-hidden="true"></div>
  <div class="wrap pre-foot-in">
    <h2 class="display">Come lift something.</h2>
    <div class="row"><a class="btn btn-primary" href="showroom.html#book">Book a visit</a><a class="btn btn-ghost" href="plan.html">Plan your gym</a></div>
  </div>
</section>
<footer id="visit" class="site-foot">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-brand"><a href="index.html" class="wordmark">PROBODYLINE</a><p>India's biggest gym equipment showroom. Twenty-five years of building gyms, from one address in Jaipur.</p>
        <p class="lab" style="margin-top:22px">Showroom</p><p>F-1293, Phase-3, RIICO Industrial Area<br>Sitapura, Jaipur, Rajasthan 302022</p>
        <div class="row" style="margin-top:16px"><a class="chip" href="https://www.google.com/maps/search/?api=1&query=F-1293+RIICO+Industrial+Area+Sitapura+Jaipur" target="_blank" rel="noopener"><i class="ph ph-navigation-arrow"></i>Directions</a><a class="chip" href="https://instagram.com/probodyline" target="_blank" rel="noopener"><i class="ph ph-instagram-logo"></i>Instagram</a><a class="chip" href="https://youtube.com/@probodyline" target="_blank" rel="noopener"><i class="ph ph-youtube-logo"></i>YouTube</a></div></div>
      ${MENU.map(([t, ls]) => `<div><h3>${t}</h3><ul>${ls.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>`).join('')}
    </div>
    <div class="foot-desks">
      <div><p class="lab">Your desk</p><a data-desk-link><span data-desk></span></a></div>
      <div><p class="lab">Delhi NCR, Gujarat, Punjab, Haryana, Tamil Nadu</p><a href="tel:+919403893899">+91 94038 93899</a></div>
      <div><p class="lab">Maharashtra, Uttar Pradesh, Bangalore</p><a href="tel:+919403893399">+91 94038 93399</a></div>
      <div><p class="lab">Rest of India</p><a href="tel:+917891712345">+91 78917 12345</a></div>
    </div>
    <div class="foot">
      <span>&copy; <span id="yr">${new Date().getFullYear()}</span> Creative Enterprises. All rights reserved.</span>
      <span class="foot-legal"><a href="contact.html">Privacy</a><a href="contact.html">Terms</a><a href="support.html#warranty">Warranty</a></span>
    </div>
  </div>
  <div class="bigmark" id="bigmark" aria-hidden="true">PROBODYLINE</div>
</footer>
<nav class="actionbar" aria-label="Quick actions"><a data-desk-link><i class="ph ph-phone"></i>Call</a><a id="abWa" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i>WhatsApp</a><a href="showroom.html#book"><i class="ph ph-calendar-check"></i>Visit</a></nav>
<div class="cmpbar" id="cmpbar"><span id="cmpTxt"></span><button class="btn btn-primary" id="cmpOpen">Compare</button></div>
<dialog class="sheet" id="cmpDlg" aria-label="Compare machines"></dialog>
<button class="cbtn" id="cbtn" aria-expanded="false" aria-controls="cpanel"><i class="ph ph-chats-circle"></i><span>Plan with a consultant</span></button>
<div class="cpanel" id="cpanel" hidden role="dialog" aria-label="Gym consultant">
  <div class="chead"><div class="av"><i class="ph ph-barbell"></i></div><div><b>Probodyline consultant</b><span>Four questions to a full plan</span></div><button id="cclose" aria-label="Close"><i class="ph ph-x"></i></button></div>
  <div class="clog" id="clog" aria-live="polite"></div>
  <div class="cchips" id="cchips"></div>
  <div class="cfoot">Your plan goes to the sales desk for your state on WhatsApp.</div>
</div>
<div class="curtain" id="curtain" aria-hidden="true"><span class="wordmark">PROBODYLINE</span></div>`,
  };
  me.insertAdjacentHTML('beforebegin', html[part]);
  if (part !== 'footer') return;

  // menu overlay
  const btn = document.getElementById('menuBtn'), menu = document.getElementById('menu');
  const setMenu = open => { menu.hidden = !open; btn.setAttribute('aria-expanded', open); document.documentElement.classList.toggle('menu-open', open); if (window.PBL?.lenis) open ? PBL.lenis.stop() : PBL.lenis.start(); };
  btn.addEventListener('click', () => setMenu(menu.hidden));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // page transitions: a curtain closes before leaving and opens on arrival
  const curtain = document.getElementById('curtain');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => curtain.classList.add('open'));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || (url.pathname === location.pathname && url.hash)) return;
    e.preventDefault(); setMenu(false); curtain.classList.remove('open'); curtain.classList.add('closing');
    setTimeout(() => location.href = a.href, 520);
  });
  addEventListener('pageshow', e => { if (e.persisted) { curtain.classList.remove('closing'); curtain.classList.add('open'); } });
})();
