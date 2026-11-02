// Renders the business profile from window.PROFILE (data.js). No build step, no framework.
(() => {
  const D = window.PROFILE, $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const tel = D.phone.replace(/[^\d+]/g, '');
  const dirUrl = `https://www.openstreetmap.org/directions?to=${D.lat}%2C${D.lng}`;

  const stars = (r, cls = '') => `<span class="stars ${cls}" aria-label="${r} out of 5 stars">${[1, 2, 3, 4, 5].map(i => `<i class="ph-fill ph-star${r >= i ? '' : r >= i - .5 ? '-half' : ''} ${r >= i - .5 ? 'on' : ''}"></i>`).join('')}</span>`;
  const t12 = t => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`; };

  // ---------------------------------------------------------------- header
  document.title = `${D.name} | Sitapura, Jaipur`;
  $('#name').textContent = D.name;
  $('#category').textContent = D.category;
  $('#legal').textContent = `${D.name} is a ${D.legalName} brand.`;
  $('#rating').innerHTML = D.rating
    ? `<b>${D.rating.toFixed(1)}</b>${stars(D.rating)}<a href="#" data-go="reviews">(${D.reviewCount.toLocaleString('en-IN')})</a>`
    : `<span class="muted">Rating to be added</span>`;

  // header photos: one large, two stacked
  const P = D.photos;
  $('#hero').innerHTML = `<button class="h-main" data-photo="0"><img src="${P[0].src}" alt="${esc(P[0].alt)}"></button>
    <div class="h-side"><button data-photo="1"><img src="${P[1].src}" alt="${esc(P[1].alt)}"></button><button data-photo="2"><img src="${P[2].src}" alt="${esc(P[2].alt)}"><span class="h-count"><i class="ph ph-images"></i>${P.length} photos</span></button></div>`;

  // ---------------------------------------------------------------- round action buttons
  const ACT = [['navigation-arrow', 'Directions', dirUrl, true], ['phone', 'Call', `tel:${tel}`], ['globe', 'Website', D.website, true], ['whatsapp-logo', 'WhatsApp', `https://wa.me/${D.whatsapp}`, true], ['share-network', 'Share', '#share']];
  $('#actions').innerHTML = ACT.map(([ic, l, h, ext], i) => `<a class="act ${i ? '' : 'primary'}" href="${h}"${ext ? ' target="_blank" rel="noopener"' : ''}><span><i class="ph ph-${ic}"></i></span>${l}</a>`).join('');
  $('#actions').addEventListener('click', async e => {
    const a = e.target.closest('a[href="#share"]'); if (!a) return; e.preventDefault();
    const data = { title: D.name, text: D.tagline, url: location.href };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast('Link copied'); } } catch (err) { /* share sheet closed */ }
  });

  // ---------------------------------------------------------------- overview
  $('#desc').textContent = D.description;
  const now = new Date(), today = DAYS[(now.getDay() + 6) % 7], todayH = D.hours[today];
  const known = DAYS.some(d => D.hours[d]);
  let status = 'Hours to be added';
  if (todayH === 'Closed') status = '<b class="closed">Closed</b> today';
  else if (Array.isArray(todayH)) {
    const mins = now.getHours() * 60 + now.getMinutes(), toM = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    status = mins >= toM(todayH[0]) && mins < toM(todayH[1]) ? `<b class="open">Open</b> · Closes ${t12(todayH[1])}` : `<b class="closed">Closed</b> · Opens ${t12(todayH[0])}`;
  }
  const hoursTable = `<table class="hours">${DAYS.map(d => { const h = D.hours[d]; return `<tr class="${d === today ? 'today' : ''}"><th>${d}</th><td>${h === 'Closed' ? 'Closed' : Array.isArray(h) ? `${t12(h[0])} to ${t12(h[1])}` : 'To be added'}</td></tr>`; }).join('')}</table>`;
  const row = (ic, html, extra = '') => `<li><i class="ph ph-${ic}"></i><div>${html}</div>${extra}</li>`;
  $('#info').innerHTML = [
    row('map-pin', esc(D.address), `<button class="copy" data-copy="${esc(D.address)}" aria-label="Copy address"><i class="ph ph-copy"></i></button>`),
    row('clock', known ? `<details><summary>${status}<i class="ph ph-caret-down"></i></summary>${hoursTable}</details>` : `<span class="muted">${status}</span>`),
    row('globe', `<a href="${D.website}" target="_blank" rel="noopener">${D.website.replace(/^https?:\/\/(www\.)?/, '')}</a>`),
    row('phone', `<a href="tel:${tel}">${esc(D.phone)}</a>`, `<button class="copy" data-copy="${esc(D.phone)}" aria-label="Copy phone number"><i class="ph ph-copy"></i></button>`),
    D.plusCode ? row('grid-four', esc(D.plusCode)) : '',
    row('users-three', D.socials.map(s => `<a class="soc" href="${s.url}" target="_blank" rel="noopener"><i class="ph ph-${s.icon}"></i>${s.label}</a>`).join('')),
  ].join('');

  // photo strip on the overview
  const photoGrid = (list, cls) => `<div class="${cls}">${list.map(p => `<button data-photo="${P.indexOf(p)}"><img src="${p.src}" alt="${esc(p.alt)}" loading="lazy"></button>`).join('')}</div>`;
  $('#ovPhotos').innerHTML = `<div class="b-head"><h2>Photos</h2><a href="#" data-go="photos">See all</a></div>${photoGrid(P.slice(3, 9), 'strip')}`;

  // ---------------------------------------------------------------- reviews
  const summary = () => D.rating ? `<div class="sum">
      <div class="bars">${[5, 4, 3, 2, 1].map((n, i) => `<div><span>${n}</span><i style="--w:${D.ratingBars ? D.ratingBars[i] : 0}%"></i></div>`).join('')}</div>
      <div class="big"><b>${D.rating.toFixed(1)}</b>${stars(D.rating)}<span>${D.reviewCount.toLocaleString('en-IN')} reviews</span></div></div>`
    : `<p class="empty"><i class="ph ph-star"></i>The rating and reviews will appear here once they are added.</p>`;
  const topics = () => D.topics.length ? `<div class="chips">${D.topics.map(t => `<span>${esc(t.label)} <b>${t.count}</b></span>`).join('')}</div>` : '';
  const review = r => `<article class="rev">
      <div class="r-who"><span class="av">${esc(r.name.trim()[0] || '?')}</span><div><b>${esc(r.name)}</b>${r.meta ? `<small>${esc(r.meta)}</small>` : ''}</div></div>
      <div class="r-meta">${stars(r.rating, 'sm')}<span>${esc(r.when)}</span></div>
      <p>${esc(r.text)}</p>
      ${r.reply ? `<div class="reply"><b>Response from the owner</b><small>${esc(r.reply.when)}</small><p>${esc(r.reply.text)}</p></div>` : ''}
    </article>`;
  const sortBox = `<label class="sort"><span>Sort</span><select id="sort"><option value="rel">Most relevant</option><option value="new">Newest</option><option value="high">Highest</option><option value="low">Lowest</option></select></label>`;
  const reviewList = (list) => list.length ? list.map(review).join('') : '';
  $('#ovReviews').innerHTML = `<div class="b-head"><h2>Reviews</h2>${D.reviews.length ? '<a href="#" data-go="reviews">See all</a>' : ''}</div>${summary()}${topics()}${reviewList(D.reviews.slice(0, 3))}`;
  const drawFull = (order = 'rel') => {
    const list = [...D.reviews];
    if (order === 'high') list.sort((a, b) => b.rating - a.rating); if (order === 'low') list.sort((a, b) => a.rating - b.rating);
    if (order === 'new') list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    $('#reviewsFull').innerHTML = `${summary()}${topics()}${D.reviews.length ? sortBox : ''}<div id="revList">${reviewList(list)}</div>
      <div class="write"><a class="btn" href="https://wa.me/${D.whatsapp}?text=${encodeURIComponent(`Hi ${D.name}, I would like to share feedback.`)}" target="_blank" rel="noopener"><i class="ph ph-pencil-simple-line"></i>Share your feedback</a></div>`;
    const s = $('#sort'); if (s) { s.value = order; s.addEventListener('change', () => drawFull(s.value)); }
  };
  drawFull();

  // ---------------------------------------------------------------- photos tab, with category chips
  const TAGS = ['All', ...new Set(P.map(p => p.tag))];
  const drawPhotos = (tag = 'All') => {
    $('#photosFull').innerHTML = `<div class="chips filter">${TAGS.map(t => `<button aria-pressed="${t === tag}" data-tag="${t}">${t}</button>`).join('')}</div>${photoGrid(tag === 'All' ? P : P.filter(p => p.tag === tag), 'masonry')}`;
  };
  drawPhotos();
  $('#photosFull').addEventListener('click', e => { const b = e.target.closest('[data-tag]'); if (b) drawPhotos(b.dataset.tag); });

  // ---------------------------------------------------------------- about tab
  $('#aboutFull').innerHTML = `<p class="desc">${esc(D.description)}</p>` + D.about.map(g => `<div class="ab"><h3>${esc(g.group)}</h3><ul>${g.items.map(i => `<li><i class="ph ph-check"></i>${esc(i)}</li>`).join('')}</ul></div>`).join('');

  // ---------------------------------------------------------------- tabs
  const show = name => {
    document.querySelectorAll('.tabs [role=tab]').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === name));
    document.querySelectorAll('.tab').forEach(p => p.hidden = p.dataset.panel !== name);
    const tabs = $('.tabs'); if ($('#panel').scrollTop > tabs.offsetTop || window.scrollY > tabs.offsetTop) tabs.scrollIntoView({ block: 'start' });
  };
  $('.tabs').addEventListener('click', e => { const t = e.target.closest('[role=tab]'); if (t) show(t.dataset.tab); });
  document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); show(g.dataset.go); } });

  // ---------------------------------------------------------------- copy buttons, toast
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 1800); };
  document.addEventListener('click', async e => { const c = e.target.closest('[data-copy]'); if (!c) return; try { await navigator.clipboard.writeText(c.dataset.copy); toast('Copied'); } catch (err) { toast('Could not copy'); } });

  // ---------------------------------------------------------------- photo viewer
  const V = $('#viewer'), VI = V.querySelector('img'), VC = V.querySelector('.v-cap'); let vi = 0;
  const open = i => { vi = (i + P.length) % P.length; VI.src = P[vi].src; VI.alt = P[vi].alt; VC.textContent = `${P[vi].alt} · ${vi + 1} of ${P.length}`; V.hidden = false; };
  document.addEventListener('click', e => { const b = e.target.closest('[data-photo]'); if (b) open(+b.dataset.photo); });
  V.addEventListener('click', e => { if (e.target.closest('.v-close') || e.target === V) V.hidden = true; if (e.target.closest('.v-prev')) open(vi - 1); if (e.target.closest('.v-next')) open(vi + 1); });
  document.addEventListener('keydown', e => { if (V.hidden) return; if (e.key === 'Escape') V.hidden = true; if (e.key === 'ArrowLeft') open(vi - 1); if (e.key === 'ArrowRight') open(vi + 1); });

  // ---------------------------------------------------------------- map (OpenStreetMap, no key needed)
  const d = .012;
  $('#map').innerHTML = `<iframe title="Map of ${esc(D.name)}" src="https://www.openstreetmap.org/export/embed.html?bbox=${D.lng - d}%2C${D.lat - d * .6}%2C${D.lng + d}%2C${D.lat + d * .6}&layer=mapnik&marker=${D.lat}%2C${D.lng}" loading="lazy"></iframe>
    <a class="map-open" href="https://www.openstreetmap.org/?mlat=${D.lat}&mlon=${D.lng}#map=17/${D.lat}/${D.lng}" target="_blank" rel="noopener"><i class="ph ph-arrows-out-simple"></i>Larger map</a>`;
})();
