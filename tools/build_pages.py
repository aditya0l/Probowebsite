#!/usr/bin/env python3
"""Builds the Probodyline subpages from one shared shell plus per-page content.

Run from the project root:  python3 tools/build_pages.py
Interactive sections live in partials/ and bind to the shared engine (js/core.js and friends).
Content marked as example is placeholder layout; it is replaced with Probodyline's own material before launch.
"""
import re
import time
from pathlib import Path

VERSION = time.strftime('%Y%m%d%H%M%S')

ROOT = Path(__file__).resolve().parent.parent
P = lambda name: (ROOT / 'partials' / f'{name}.html').read_text()

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Probodyline</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0e0f11">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/icon-180.png">
<link rel="manifest" href="site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>
<link rel="stylesheet" href="css/site.css">
<script type="importmap">
{{ "imports": {{
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
}} }}
</script>
<script src="site.config.js"></script>
</head>
<body data-page="{key}">
<a class="skip" href="#main">Skip to content</a>
<script src="js/chrome.js"></script>
<main id="main">
"""
FOOT = """</main>
<script src="js/chrome.js" data-part="footer"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
{extra}<script type="module" src="js/core.js"></script>
<script type="module" src="js/features.js"></script>
<script type="module" src="js/sound.js"></script>
<script type="module" src="js/more.js"></script>
<script type="module" src="js/spin.js"></script>
<script type="module" src="js/polish.js"></script>
{inline}</body>
</html>
"""


SOL_ALT = {'commercial': 'Plate-loaded strength floor under hexagon lights, fitted out with Probodyline machines', 'home': 'Ellipticals and a Probodyline treadmill in a compact cardio room', 'hotels': 'A bright, clean selectorised strength room fitted by Probodyline', 'studios': 'Rows of spin bikes in a studio with a blue lit ceiling'}


def shot(name):
    return f'<figure class="phm shot"><img src="assets/img/sol/{name}.jpg" alt="{SOL_ALT[name]}" loading="lazy" decoding="async"></figure>'


def ph(caption, icon='image', cls='', kind='Photo'):
    return f'<div class="phm {cls}"><div class="phm-cap"><i class="ph ph-{icon}"></i><span><b>{kind}:</b> {caption}</span></div></div>'


def vid(name, pos='50% 50%'):
    return f'<video data-src="assets/v/{name}.mp4" poster="assets/v/{name}.jpg" muted playsinline loop preload="none" aria-hidden="true" style="object-position:{pos}"></video>'


def reel(name, label, cls='port', pos='50% 50%'):
    return f'<figure class="phm reel {cls}">{vid(name, pos)}<figcaption class="phm-cap"><i class="ph ph-play-circle"></i><span>{label}</span></figcaption></figure>'


def crumbs(*items):
    parts = ['<a href="index.html">Home</a>']
    for href, label in items:
        parts.append('<i class="ph ph-caret-right"></i>' + (f'<a href="{href}">{label}</a>' if href else f'<span>{label}</span>'))
    return f'<nav class="crumbs" aria-label="Breadcrumb">{"".join(parts)}</nav>'


def hero(h1, sub, crumb, ctas='', extra='', bg=None):
    # every page opens on real footage or a real photo when one is given
    if not bg:
        return f'<section class="page-hero"><div class="wrap">{crumb}<h1 class="display">{h1}</h1><p class="sub">{sub}</p>{ctas}{extra}</div></section>'
    return f'<section class="page-hero media"><div class="bgm">{bg}</div><div class="wrap">{crumb}<h1 class="display">{h1}</h1><p class="sub">{sub}</p>{ctas}{extra}</div></section>'


def img(path, alt, pos='50% 50%', lazy=True):
    return f'<img src="assets/img/{path}.jpg" alt="{alt}" style="object-position:{pos}"{" loading=\"lazy\"" if lazy else ""} decoding="async">'


def photo(path, alt, cls='', pos='50% 50%'):
    return f'<figure class="phm shot {cls}">{img(path, alt, pos)}</figure>'


# real Probodyline photos used for cases and guides
CASE_IMG = {'gym floor after opening': ('home/project-1', 'A plate-loaded floor under blue lights'), 'strength zone': ('home/strength', 'Yellow plate-loaded strength machines'),
            'hotel fitness room': ('sol/hotels', 'A bright selectorised strength room'), 'home gym': ('sol/home', 'Cross-trainers and a treadmill in a compact room'),
            'spin room': ('sol/studios', 'Rows of spin bikes in a studio'), 'office gym': ('home/selectorised', 'A row of selectorised machines')}


def case_img(c):
    return photo(*CASE_IMG[c])


def tiles(keys):
    names = {'press': ('Iso-lateral press', 'Plate-loaded strength', 'iso-lateral-press.html'), 'treadmill': ('Treadmills', 'Cardio', 'equipment.html#cardio'), 'bike': ('Spin bikes', 'Cardio', 'equipment.html#cardio'),
             'elliptical': ('Cross-trainers', 'Cardio', 'equipment.html#cardio'), 'station': ('Stations', 'Selectorised strength', 'strength.html'), 'rack': ('Power racks', 'Racks and rigs', 'strength.html'),
             'dumbbells': ('Dumbbells', 'Free weights', 'equipment.html#free-weights'), 'bench': ('Benches', 'Free weights', 'equipment.html#free-weights')}
    out = []
    for k in keys:
        n, c, h = names[k]
        out.append(f'<a class="tile" href="{h}"><div class="ti"><img data-thumb="{"press3d" if k == "press" else k}" alt="{n}"></div><div class="tb"><div><h3>{n}</h3><p>{c}</p></div><i class="ph ph-arrow-up-right"></i></div></a>')
    return '<div class="tiles">' + ''.join(out) + '</div>'


def faq(items):
    return '<div class="faq">' + ''.join(f'<details><summary>{q}<i class="ph ph-plus"></i></summary><p>{a}</p></details>' for q, a in items) + '</div>'


EXAMPLE = '<p class="note" style="margin-top:-36px;margin-bottom:36px"><i class="ph ph-info"></i> Example content to show the layout. Replaced with Probodyline material before launch.</p>'

CATALOGUE = '''<section id="equipment" class="s" style="padding-top:20px"><div class="wrap">
  <div class="rail" id="catFilter"><button aria-selected="true" data-g="all">All</button><button aria-selected="false" data-g="Cardio">Cardio</button><button aria-selected="false" data-g="Strength">Strength</button><button aria-selected="false" data-g="Free weights">Free weights</button></div>
  <div class="cat-grid" id="catGrid"{preset}></div></div></section>'''

def BA():
    pr = P('proof')
    return '<section class="s tone" style="padding-top:40px">' + pr[pr.index('<div class="wrap ba-head"'):pr.rindex('</section>')] + '</section>'


PAGES = {}

# ------------------------------------------------------------------ equipment
PAGES['equipment'] = dict(title='Gym equipment', desc='Cardio, strength and free weights for commercial and home gyms. See every machine in 3D, check it fits your room and ask for a price.', body=
    hero('Every machine, <em>one place.</em>', 'Cardio, strength and free weights for commercial floors and home gyms. Open any machine in 3D, check it fits and ask for a price.', crumbs((None, 'Equipment')), bg=vid('zones'),
         extra='<div class="kpis"><div><b>3,500+</b><span>Machines on display in Jaipur</span></div><div><b>8</b><span>Categories</span></div><div><b>3</b><span>Regional sales desks</span></div></div>')
    + CATALOGUE.format(preset='')
    + P('muscles').replace('class="sec" style="padding-top:40px"', 'class="sec s tone"')
    + '''<section class="s"><div class="wrap split2"><div class="s-head" style="margin:0"><h2 class="display">Not sure where to start?</h2><p>Four questions and our consultant lays out the right mix for your space, then sends it to your sales desk.</p><div class="row"><a class="btn btn-primary" href="#consult">Plan with a consultant</a><a class="btn btn-ghost" href="plan.html">Open the planner</a></div></div>''' + reel('strength-floor', 'The plate-loaded floor in Jaipur', 'wide') + '</div></section>')

# ------------------------------------------------------------------ category (strength)
PAGES['strength'] = dict(title='Strength equipment', desc='Plate-loaded, selectorised and racks for commercial and home gyms.', body=
    f'''<section class="page-hero media"><div class="bgm">{vid('reel-plate', '50% 58%')}</div><div class="wrap">{crumbs(('equipment.html', 'Equipment'), (None, 'Strength'))}<h1 class="display">Strength <em>equipment.</em></h1><p class="sub">Plate-loaded, selectorised and racks. Built for commercial floors that run all day, and home gyms that need to last.</p></div></section>'''
    + '''<section class="s" style="padding-bottom:0"><div class="wrap"><div class="rail"><button aria-selected="true">All strength</button><button aria-selected="false">Plate-loaded</button><button aria-selected="false">Selectorised</button><button aria-selected="false">Racks and rigs</button><button aria-selected="false">Benches</button></div></div></section>'''
    + CATALOGUE.format(preset=' data-preset="Strength"')
    + '<section class="s glow"><div class="wrap"><div class="s-head"><h2 class="display">Built to <em>last.</em></h2><p>Filmed in our studio: the full machine on the turntable, then the parts you touch every set.</p></div>'
    + '<div class="studio-reel">' + reel('turntable', 'The full machine, 360° on the turntable', 'wide feature') + reel('detail-handle', 'Rotating grips on a sliding carriage', 'sq') + reel('detail-pad', 'Chest pad with quick-release adjustment', 'sq') + reel('detail-frame', 'Frame, footplates and plate horns', 'sq') + '</div></div></section>'

    + '<section class="s tone"><div class="wrap"><div class="s-head"><h2 class="display">Choosing strength <em>equipment.</em></h2><p>Three questions our team asks every buyer.</p></div>'
    + faq([('Plate-loaded or selectorised?', 'Plate-loaded machines feel closer to free weights and suit serious lifters. Selectorised stations with a pin and weight stack are quicker to adjust and easier for beginners. Most commercial floors use both.'),
           ('How much floor space does a strength zone need?', 'Allow the machine footprint plus at least 60 cm clear on every side. Use Will it fit on any product page, or the planner for a whole zone.'),
           ('Can I try machines before buying?', 'Yes. Every machine on the site is on the showroom floor in Jaipur. Book a visit and the team will set up the ones you want to try.')])
    + '</div></section>'
    + '<section class="s"><div class="wrap split2">' + reel('strength-floor', 'The plate-loaded floor', 'wide') + '<div class="s-head" style="margin:0"><h2 class="display">See this zone <em>in person.</em></h2><p>Walk the strength aisle in 3D, then book a time to train on the machines.</p><div class="row"><a class="btn btn-primary" href="showroom.html#walk">Walk the showroom</a><a class="btn btn-ghost" href="showroom.html#book">Book a visit</a></div></div></div></section>')

# ------------------------------------------------------------------ product (the press)
PAGES['iso-lateral-press'] = dict(title='Iso-lateral plate-loaded press', desc='The Probodyline iso-lateral plate-loaded press. See it as filmed, turn it in 3D, check it fits your room.', body=
    '<section style="padding-top:96px"><div class="wrap">' + crumbs(('equipment.html', 'Equipment'), ('strength.html', 'Strength'), (None, 'Iso-lateral press')) + '</div>'
    + '''<div class="pdp">
  <div class="pdp-media">
    <div class="real-view" aria-label="Filmed footage of the iso-lateral press. Drag to turn it."><canvas></canvas><div class="loupe"><canvas width="440" height="440"></canvas></div><p class="spin-hint"><i class="ph ph-hand-swipe-left"></i>Drag to turn the real machine</p><i class="spin-load"></i></div>
    <div class="pdp-thumbs" role="group" aria-label="Key angles"><button data-angle="0" aria-pressed="true"><img src="assets/spin/press/f001.webp" alt="Three-quarter view"></button><button data-angle="34" aria-pressed="false"><img src="assets/spin/press/f035.webp" alt="Angled view"></button><button data-angle="67" aria-pressed="false"><img src="assets/spin/press/f068.webp" alt="Front view"></button></div>
  </div>
  <aside class="pdp-buy">
    <span class="series">Plate-loaded strength</span>
    <h1 class="display">Iso-lateral plate-loaded press.</h1>
    <p class="promise">Two arms that move on their own, so a stronger side never carries a weaker one. Built in steel for floors that run all day.</p>
    <div class="keyspecs"><div>Footprint<b class="tbc">To confirm</b></div><div>Max plate load<b class="tbc">To confirm</b></div><div>Machine weight<b class="tbc">To confirm</b></div><div>Warranty<b class="tbc">To confirm</b></div></div>
    <div><span class="lab">Frame and arm colours</span><div class="sw" style="pointer-events:none"><button style="background:#1d4ad6" aria-pressed="true"></button><button style="background:#b8231c"></button><button style="background:#dc5f17"></button><button style="background:#1e6a3b"></button><button style="background:#b08d3c"></button></div><a class="note" href="#machine" style="display:inline-block;margin-top:10px;text-decoration:underline">Design your own in the 3D studio</a></div>
    <div class="price"><span class="muted">Price</span><b>On request</b></div>
    <div class="row"><a class="btn btn-primary" id="pdpQuote" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i>Get a quote</a><a class="btn btn-ghost" href="showroom.html#book">Try it in Jaipur</a></div>
    <a class="chip" href="#fit" style="justify-self:start"><i class="ph ph-ruler"></i>Will it fit my room?</a>
  </aside>
</div></section>'''
    + P('machine').replace('<span class="eyebrow">The 3D studio</span>', '<span class="eyebrow">Interactive 3D</span>').replace('Spin it, load it, take it apart. Each arm moves on its own, exactly like the one on the showroom floor.', 'Drag the arms, load plates, take it apart and put your logo on it.').replace('<h2 class="display" id="mName">Iso-lateral plate-loaded press.</h2>', '<h2 class="display" id="mName">Try it in 3D.</h2>').replace('<div class="rail" id="prodRail"', '<div class="rail" id="prodRail" hidden')
    + P('fit').replace('<section id="fit" class="sec">', '<section id="fit" class="sec" data-default="press">')
    + '<section class="s tone"><div class="wrap"><div class="s-head"><h2 class="display"><em>Specifications.</em></h2><p>Full figures from the factory sheet. The download includes dimensions for your architect.</p></div><div class="specs">'
    + ''.join(f'<section><h3>{t}</h3><dl>{"".join(f"<dt>{a}</dt><dd class=tbc>To confirm</dd>" for a in rows)}</dl></section>' for t, rows in [('Dimensions', ['Length', 'Width', 'Height', 'Training space']), ('Load', ['Max plate load per arm', 'Plate horn size', 'User weight']), ('Build', ['Frame', 'Finish', 'Upholstery', 'Pivots']), ('Ownership', ['Warranty, frame', 'Warranty, parts', 'Installation', 'Service'])])
    + '</div><div class="row" style="margin-top:24px"><a class="btn btn-ghost" aria-disabled="true"><i class="ph ph-file-pdf"></i>Spec sheet, PDF</a></div></div></section>'
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">Works well <em>with.</em></h2></div>' + tiles(['station', 'rack', 'bench', 'dumbbells']) + '</div></section>'
    + '<div class="stickybuy" id="stickybuy"><b>Iso-lateral press</b><span class="muted">On request</span><a class="btn btn-primary" id="stickyQuote" target="_blank" rel="noopener">Get a quote</a></div>',
    inline='''<script type="module">
const P = window.PBL; const q = () => P.waLink('Hi Probodyline, please share the price and availability of the iso-lateral plate-loaded press.');
const set = () => ['pdpQuote', 'stickyQuote'].forEach(id => document.getElementById(id).href = q()); set(); P.onRegion(set);
P.ScrollTrigger.create({ trigger: '.pdp', start: 'bottom 80px', onEnter: () => stickybuy.classList.add('show'), onLeaveBack: () => stickybuy.classList.remove('show') });
</script>
''')

# ------------------------------------------------------------------ solutions
SOLS = [('commercial-gyms.html', 'Commercial gyms', 'Floors that run all day. Planned in 3D, priced per zone, installed by our team.', 'commercial'),
        ('solutions.html#home', 'Home gyms', 'One room, the right three machines, and a footprint that fits.', 'home'),
        ('solutions.html#hotels', 'Hotels and offices', 'Good-looking equipment that guests use and staff never have to fix.', 'hotels'),
        ('solutions.html#studios', 'Studios and boxes', 'Spin rooms, functional rigs and strength corners for group training.', 'studios')]
PAGES['solutions'] = dict(title='Gym solutions', desc='Commercial gyms, home gyms, hotels and studios. Planned, supplied and installed by Probodyline.', body=
    hero('One supplier, from plan to <em>opening day.</em>', 'Commercial gyms, home gyms, hotels and studios. We plan the floor, supply every machine and install it.', crumbs((None, 'Solutions')), bg=img('home/project-2', 'A long aisle of plate-loaded machines', lazy=False),
         ctas='<div class="ctas"><a class="btn btn-primary" href="plan.html">Plan your gym</a><a class="btn btn-ghost" href="showroom.html#book">Book a visit</a></div>')
    + '<section class="s" style="padding-top:0"><div class="wrap"><div class="sol" style="grid-template-columns:1fr 1fr">' + ''.join(f'<a href="{h}" id="{h.split("#")[-1] if "#" in h else "commercial"}">{shot(c)}<div class="sb"><h3>{t}</h3><p>{d}</p></div></a>' for h, t, d, c in SOLS) + '</div></div></section>'
    + '<section class="s tone"><div class="wrap"><div class="s-head"><h2 class="display">How it <em>works.</em></h2></div><div class="steps"><div><h3>Consult</h3><p>Tell us the space, the members and the budget. Four questions, or a call with your desk.</p></div><div><h3>Plan in 3D</h3><p>We lay out every machine with safe aisles and send you the floor plan.</p></div><div><h3>Deliver and install</h3><p>Our team delivers, assembles and tests every machine on site.</p></div><div><h3>Service</h3><p>Warranty, servicing and spares from the same people who installed it.</p></div></div></div></section>'
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">Why gyms choose <em>Probodyline.</em></h2></div><div class="why"><div><i class="ph ph-buildings"></i><h3>A showroom you can visit</h3><p>45,000 sq ft in Jaipur. Train on the machines before you buy them.</p></div><div><i class="ph ph-map-trifold"></i><h3>Desks across India</h3><p>Three regional sales desks, so you talk to someone who knows your city.</p></div><div><i class="ph ph-wrench"></i><h3>Installed by our team</h3><p>Delivery, assembly and testing on site.</p></div><div><i class="ph ph-shield-check"></i><h3>Looked after</h3><p>Warranty, service and spares from one place.</p></div></div></div></section>')

PAGES['commercial-gyms'] = dict(title='Commercial gym setups', desc='Plan, equip and open a commercial gym with Probodyline.', body=
    f'''<section class="page-hero media"><div class="bgm">{img('sol/commercial', 'A commercial strength floor fitted out by Probodyline', lazy=False)}</div><div class="wrap">{crumbs(('solutions.html', 'Solutions'), (None, 'Commercial gyms'))}<h1 class="display">Commercial <em>gyms.</em></h1><p class="sub">From an empty floor to opening day. We plan the layout, supply every machine and install it, then keep it running.</p><div class="ctas"><a class="btn btn-primary" href="plan.html">Plan your gym</a><a class="btn btn-ghost" href="#consult">Ask the consultant</a></div></div></section>'''
    + '<section class="s"><div class="wrap split2"><div class="s-head" style="margin:0"><h2 class="display">Built for floors that <em>never close.</em></h2><p>Commercial gyms need machines that take thousands of reps a day, a layout members understand, and a supplier who answers the phone. That is the job we do.</p></div><div class="kpis" style="margin:0;border:0;padding:0"><div><b>18,000+</b><span>Gyms installed</span></div><div><b>45,000</b><span>Sq ft showroom</span></div><div><b>25</b><span>Years</span></div></div></div></section>'
    + BA()
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">The usual <em>mix.</em></h2><p>A balanced commercial floor, before we tune it to your members.</p></div>' + tiles(['treadmill', 'bike', 'press', 'rack']) + '<div class="row" style="margin-top:28px"><a class="btn btn-primary" href="plan.html">Lay out my floor in 3D</a><a class="btn btn-ghost" href="plan.html#roi">When does it pay back?</a></div></div></section>'
    + '<section class="s tone"><div class="wrap"><div class="s-head"><h2 class="display">Recent <em>openings.</em></h2></div>' + EXAMPLE + '<div class="cases">' + ''.join(f'<a class="case" href="case-study.html">{case_img(c)}<h3>{t}</h3><div class="meta"><span><b>{a}</b> sq ft</span><span><b>{m}</b> machines</span><span>{city}</span></div></a>' for t, c, a, m, city in [('Commercial gym, Jaipur', 'gym floor after opening', '6,000', '64', 'Rajasthan'), ('Fitness club, Pune', 'strength zone', '4,500', '48', 'Maharashtra'), ('Hotel gym, Delhi NCR', 'hotel fitness room', '1,200', '14', 'Delhi NCR')]) + '</div></div></section>'
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">Questions gym owners <em>ask.</em></h2></div>' + faq([('How long from order to opening?', 'It depends on the size of the floor and the machines you choose. Your sales desk gives you a delivery and installation date with the quote.'), ('Do you help with the layout?', 'Yes. Every commercial order starts with a 3D floor plan, which you can try yourself in the planner.'), ('Can members try the machines first?', 'Bring your trainers to the Jaipur showroom. Every machine on the site is on the floor.'), ('What happens after installation?', 'Warranty, servicing and spares are handled by Probodyline. Register your machines on the support page.')]) + '</div></section>')

# ------------------------------------------------------------------ plan
PAGES['plan'] = dict(title='Plan your gym', desc='Lay out your gym in 3D, see the payback and send a quote request to your sales desk.', body=
    hero('Plan your gym <em>in 3D.</em>', 'Tell us about the space. We lay it out in 3D, show you the payback and send the plan to your sales desk.', crumbs((None, 'Plan your gym')), bg=vid('planner'),
         ctas='<div class="ctas"><a class="btn btn-primary" href="#consult"><i class="ph ph-chats-circle"></i>Start with four questions</a><a class="btn btn-ghost" href="#plan">Go straight to the planner</a></div>',
         extra='<div class="steps" style="margin-top:56px"><div><h3>Tell us about it</h3><p>Type, size, focus and state.</p></div><div><h3>See it in 3D</h3><p>Every machine placed with safe aisles.</p></div><div><h3>Check the payback</h3><p>Fee, members and costs.</p></div><div><h3>Send the quote request</h3><p>To the desk for your state.</p></div></div>')
    + P('plan') + P('roi') + P('proforma'))

# ------------------------------------------------------------------ showroom
PAGES['showroom'] = dict(title='The showroom in Jaipur', desc="Visit India's biggest gym equipment showroom: 45,000 sq ft in Sitapura, Jaipur. Book a time to try the machines.", body=
    f'''<section class="page-hero media"><div class="bgm">{vid('walk', '50% 45%')}</div><div class="wrap">{crumbs((None, 'Showroom'))}<h1 class="display">The <em>showroom.</em></h1><p class="sub">45,000 sq ft in Sitapura, Jaipur. More than 3,500 machines on the floor, and every one of them is there to try.</p><div class="ctas"><a class="btn btn-primary" href="#book">Book a visit</a><a class="btn btn-ghost" href="#walk">Walk the floor first</a></div><div class="kpis"><div><b>45,000</b><span>Sq ft</span></div><div><b>3,500+</b><span>Machines on display</span></div><div><b>25</b><span>Years in Jaipur</span></div></div></div></section>'''
    + P('walk').replace('href="#machine"', 'href="iso-lateral-press.html"') + P('book')
    + '<section class="s tone"><div class="wrap split2"><div class="s-head" style="margin:0"><span class="eyebrow">Getting here</span><h2 class="display">Look for the <em>red sign.</em></h2><p>F-1293, Phase-3, RIICO Industrial Area, Sitapura, Jaipur, Rajasthan 302022.</p><div class="steps" style="grid-template-columns:1fr 1fr;margin-top:12px"><div><h3>From the airport</h3><p>Directions and drive time to confirm.</p></div><div><h3>Parking</h3><p>Parking details to confirm.</p></div></div><div class="row" style="margin-top:12px"><a class="btn btn-primary" href="https://www.google.com/maps/search/?api=1&query=F-1293+RIICO+Industrial+Area+Sitapura+Jaipur" target="_blank" rel="noopener"><i class="ph ph-navigation-arrow"></i>Open in Maps</a></div></div>' + '<div class="find-us">' + reel('facade', 'The Probodyline building from the road', 'wide') + reel('roof', 'From above: the name is on the roof', 'wide') + '</div>' + '</div></section>'
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">Inside the <em>showroom.</em></h2><p>Real footage from the floor. Every machine you see here is set up to try.</p></div><div class="tiles reels">' + reel('sign', 'Main hall, under the sign', 'port', '50% 50%') + reel('strength-floor', 'Plate-loaded floor', 'port', '35% 50%') + reel('cardio-row', 'Treadmill row', 'port', '40% 50%') + reel('zones', 'Functional and cardio zone', 'port', '50% 50%') + '</div></div></section>')

# ------------------------------------------------------------------ projects + case study
PAGES['projects'] = dict(title='Projects', desc='Gyms built with Probodyline across India.', body=
    hero('18,000+ gyms <em>across India.</em>', 'Commercial floors, home gyms, hotels and studios, planned and installed by Probodyline.', crumbs((None, 'Projects')), bg=img('home/project-1', 'A plate-loaded floor under blue lights', lazy=False))
    + P('proof').replace('<section id="proof" class="sec">', '<section id="proof" class="sec" style="padding-top:0">')
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">Case <em>studies.</em></h2></div>' + EXAMPLE + '<div class="rail" style="margin-bottom:28px"><button aria-selected="true">All</button><button aria-selected="false">Commercial</button><button aria-selected="false">Home</button><button aria-selected="false">Hotels</button><button aria-selected="false">Studios</button></div><div class="cases">'
    + ''.join(f'<a class="case" href="case-study.html">{case_img(c)}<h3>{t}</h3><div class="meta"><span><b>{a}</b> sq ft</span><span><b>{m}</b> machines</span><span>{city}</span></div></a>' for t, c, a, m, city in [('Commercial gym, Jaipur', 'gym floor after opening', '6,000', '64', 'Rajasthan'), ('Fitness club, Pune', 'strength zone', '4,500', '48', 'Maharashtra'), ('Hotel gym, Delhi NCR', 'hotel fitness room', '1,200', '14', 'Delhi NCR'), ('Home gym, Ahmedabad', 'home gym', '400', '5', 'Gujarat'), ('Spin studio, Bengaluru', 'spin room', '900', '24', 'Karnataka'), ('Corporate gym, Chennai', 'office gym', '1,500', '18', 'Tamil Nadu')])
    + '</div></div></section>'
    + '<section class="s tone"><div class="wrap"><div class="s-head"><h2 class="display">In their <em>words.</em></h2></div>' + EXAMPLE + '<div class="quotes">' + ''.join(f'<figure class="quote">{photo(pi, pa)}<blockquote>{q}</blockquote><cite><b>{n}</b>{r}</cite></figure>' for (q, n, r), (pi, pa) in zip([('“The showroom visit settled it. We trained on every machine before we signed.”', 'Gym owner', 'Commercial gym, Rajasthan'), ('“They laid out the floor in 3D before anything was ordered.”', 'Club manager', 'Fitness club, Maharashtra'), ('“Installation took the team two days, and the service desk still picks up.”', 'Facilities head', 'Hotel, Delhi NCR')], [('home/strength', 'Yellow plate-loaded machines'), ('home/cardio', 'Spin bikes and treadmills'), ('sol/hotels', 'A bright selectorised room')])) + '</div></div></section>')

PAGES['case-study'] = dict(title='Case study', desc='How a commercial gym was planned, equipped and opened with Probodyline.', body=
    f'''<section class="page-hero media"><div class="bgm">{img('home/strength', 'A finished plate-loaded strength floor', lazy=False)}</div><div class="wrap">{crumbs(('projects.html', 'Projects'), (None, 'Commercial gym, Jaipur'))}<h1 class="display">Commercial gym, Jaipur.</h1><p class="sub">Example case study layout. Each project gets this page with its own photos, plan and owner quote.</p><div class="kpis"><div><b>6,000</b><span>Sq ft</span></div><div><b>64</b><span>Machines</span></div><div><b>3</b><span>Zones</span></div><div><b>To confirm</b><span>Weeks to opening</span></div></div></div></section>'''
    + '<section class="s"><div class="wrap split2"><div class="s-head" style="margin:0"><h2 class="display">The brief.</h2><p>Who the gym is for, what the owner needed, and the constraints of the space. Two short paragraphs written with the client.</p></div><div class="s-head" style="margin:0"><h2 class="display">What we did.</h2><p>The plan, the mix of machines, how installation was scheduled around the fit-out, and what happened on opening day.</p></div></div></section>'
    + '<section class="s tone"><div class="wrap"><div class="s-head"><h2 class="display">The floor <em>plan.</em></h2></div>' + '<a class="phm reel wide plan-reel" href="plan.html#plan"><video data-src="assets/v/planner.mp4" poster="assets/v/planner.jpg" muted playsinline loop preload="none" aria-hidden="true"></video><span class="phm-cap"><i class="ph ph-cube"></i><span>Each case study shows its own floor plan from the planner</span></span><span class="plan-open">Open the planner <i class="ph ph-arrow-up-right"></i></span></a>' + '</div></section>'
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">Machines on this <em>floor.</em></h2></div>' + tiles(['treadmill', 'bike', 'press', 'station']) + '</div></section>'
    + '<section class="s tone"><div class="wrap split2">' + ph('owner portrait in the gym, from the client', 'user', 'port') + '<figure><blockquote class="display" style="font-size:clamp(36px,4vw,60px);line-height:1">“Owner quote, two lines at most, in their own words.”</blockquote><cite style="display:block;margin-top:20px;color:var(--muted);font-style:normal">Owner name, Gym name</cite><div class="row" style="margin-top:32px"><a class="btn btn-primary" href="plan.html">Plan a floor like this</a></div></figure></div></section>')

# ------------------------------------------------------------------ about
PAGES['about'] = dict(title='About Probodyline', desc='Twenty-five years of building gyms across India, from one showroom in Jaipur.', body=
    hero('Twenty-five years <em>of iron.</em>', 'A Creative Enterprises brand from Jaipur. We supply, install and service gym equipment for commercial floors, homes and hotels across India.', crumbs((None, 'About')), bg=vid('banner', '70% 50%'),
         extra='<div class="kpis"><div><b>25</b><span>Years</span></div><div><b>45,000</b><span>Sq ft showroom</span></div><div><b>3,500+</b><span>Machines on display</span></div><div><b>18,000+</b><span>Gyms installed</span></div></div>')
    + '<section class="s"><div class="wrap split2">' + reel('facade', 'The Probodyline building in Sitapura, Jaipur', 'port', '50% 50%') + '<div class="s-head" style="margin:0"><h2 class="display">If it is unique, it is <em>Probodyline.</em></h2><p>The founding story, in the founders\' words. Where it started, why Jaipur, and how one shop became the biggest gym equipment showroom in India.</p></div></div></section>'
    + '<section class="s tone"><div class="wrap"><div class="s-head"><h2 class="display">How we got <em>here.</em></h2></div><div class="timeline">' + ''.join(f'<article><span class="yr">{y}</span>{c}<p>{d}</p></article>' for y, c, d in [('Start', ph('the first shop, from the client', 'camera'), 'Where it began. Year and story to confirm.'), ('Showroom', photo('home/free-weights', 'The Sitapura showroom floor'), 'The 45,000 sq ft showroom opens in Jaipur.'), ('Desks', photo('sol/commercial', 'A commercial floor fitted by Probodyline'), 'Regional sales desks for the north, the west and the south.'), ('18,000', photo('home/project-2', 'A plate-loaded aisle in a client gym'), 'More than 18,000 gyms installed across India.'), ('Today', photo('home/selectorised', 'The showroom today'), 'More than 3,500 machines on the floor.')]) + '</div></div></section>'
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">The <em>people.</em></h2><p>Team portraits to come from Probodyline.</p></div><div class="tiles">' + ''.join(f'<div>{ph(c, "user", "port")}<p style="margin-top:12px;font-weight:600">{n}</p><p class="muted" style="font-size:14px">{r}</p></div>' for c, n, r in [('portrait', 'Name', 'Founder'), ('portrait', 'Name', 'Head of sales'), ('portrait', 'Name', 'Head of service'), ('portrait', 'Name', 'Showroom manager')]) + '</div></div></section>')

# ------------------------------------------------------------------ support
PAGES['support'] = dict(title='Owner support', desc='Register a warranty, book a service or order spares for your Probodyline machine.', body=
    hero('Owner <em>support.</em>', 'Warranty, servicing and spares for every Probodyline machine, from the people who installed it.', crumbs((None, 'Support')), bg=img('home/selectorised', 'A row of selectorised machines', lazy=False))
    + P('owners').replace('<section id="owners" class="sec" style="background:var(--surface);border-top:1px solid var(--line)">', '<section id="owners" class="sec" style="padding-top:0"><span id="warranty"></span><span id="service"></span><span id="spares"></span>').replace('<h2 class="display">Already own a Probodyline machine?</h2>', '<h2 class="display">How can we help?</h2>')
    + '<section class="s tone"><div class="wrap"><div class="s-head"><h2 class="display">Manuals and <em>how-to videos.</em></h2><p>Assembly, daily care and adjustment guides for every machine.</p></div><div class="cases">' + ''.join(f'<div class="case">{photo(i, t)}<h3>{t}</h3><div class="meta"><span>Manual PDF</span><span>Care video</span></div></div>' for t, i in [('Iso-lateral press', 'home/strength'), ('Treadmills', 'sol/home'), ('Spin bikes', 'sol/studios')]) + '</div></div></section>'
    + '<section class="s"><div class="wrap"><div class="s-head"><h2 class="display">Common <em>questions.</em></h2></div>' + faq([('Where is the serial number?', 'On the metal plate fitted to the frame of your machine, like the example above.'), ('How do I book a service?', 'Choose Service above, describe the problem and send it on WhatsApp. The desk for your state replies with a visit date.'), ('What does the warranty cover?', 'Warranty terms depend on the machine. The full terms will be published here.'), ('Can I order a part myself?', 'Yes. Choose Spares above with your serial number and the part you need.')]) + '</div></section>',
    extra='<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>\n')

# ------------------------------------------------------------------ contact
PAGES['contact'] = dict(title='Contact', desc='Talk to the Probodyline sales desk for your state, or visit the showroom in Jaipur.', body=
    hero('Talk to <em>us.</em>', 'Three regional sales desks and one showroom. Pick your state at the top of the page and every button goes to the right desk.', crumbs((None, 'Contact')), bg=vid('facade'))
    + '<section class="s" style="padding-top:0"><div class="wrap"><div class="desks">' + ''.join(f'<div class="desk"><span class="lab">{a}</span><span class="num">{n}</span><p>{c}</p><div class="row"><a class="btn btn-primary" href="tel:+{t}" style="height:42px"><i class="ph ph-phone"></i>Call</a><a class="btn btn-ghost" href="https://wa.me/{t}" target="_blank" rel="noopener" style="height:42px"><i class="ph ph-whatsapp-logo"></i>WhatsApp</a></div></div>' for a, n, c, t in [('North and south desk', '+91 94038 93899', 'Delhi NCR, Gujarat, Punjab, Haryana, Tamil Nadu', '919403893899'), ('West desk', '+91 94038 93399', 'Maharashtra, Uttar Pradesh, Bangalore', '919403893399'), ('Rest of India', '+91 78917 12345', 'Every other state, and the Jaipur showroom', '917891712345')]) + '</div></div></section>'
    + '''<section class="s tone"><div class="wrap split2"><form class="card" id="enq" novalidate><h2 class="display" style="font-size:44px">Send an <em>enquiry.</em></h2>
      <div class="form-grid"><div class="fld"><label for="eName">Name</label><input id="eName" autocomplete="name"></div><div class="fld"><label for="eCity">City</label><input id="eCity" autocomplete="address-level2"></div>
      <div class="fld full"><label for="eNeed">What do you need?</label><select id="eNeed"><option>Equipment for a commercial gym</option><option>A home gym</option><option>A hotel or office gym</option><option>Service or spares</option><option>Something else</option></select></div>
      <div class="fld full"><label for="eMsg">Message</label><textarea id="eMsg"></textarea></div></div>
      <button class="btn btn-primary" type="submit" style="justify-self:start"><i class="ph ph-whatsapp-logo"></i>Send on WhatsApp</button><small class="muted">Goes to the sales desk for the state picked at the top of the page.</small></form>'''
    + '<div style="display:grid;gap:20px">' + '<iframe class="map" title="Map of the Probodyline showroom in Sitapura, Jaipur" src="https://www.google.com/maps?q=F-1293+RIICO+Industrial+Area+Sitapura+Jaipur&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' + '<div><p class="lab">Showroom</p><p>F-1293, Phase-3, RIICO Industrial Area, Sitapura, Jaipur, Rajasthan 302022</p><p class="note">Opening hours to confirm.</p></div></div></div></section>',
    inline='''<script type="module">
document.getElementById('enq').addEventListener('submit', e => { e.preventDefault(); const v = id => document.getElementById(id).value.trim();
  window.open(window.PBL.waLink(`Hi Probodyline, I'm ${v('eName') || 'enquiring'} from ${v('eCity') || 'India'}. ${v('eNeed')}. ${v('eMsg')}`), '_blank', 'noopener'); });
</script>
''')


def stamp(html):
    # cache-busting: every local script and stylesheet gets the build version
    return re.sub(r'((?:src|href)="(?:js|css)/[^"?]+\.(?:js|css))"', lambda m: f'{m.group(1)}?v={VERSION}"', html)


def build():
    for key, pg in PAGES.items():
        html = HEAD.format(title=pg['title'], desc=pg['desc'], key={'iso-lateral-press': 'equipment', 'strength': 'equipment', 'commercial-gyms': 'solutions', 'case-study': 'projects'}.get(key, key))
        html += pg['body'] + '\n' + FOOT.format(extra=pg.get('extra', ''), inline=pg.get('inline', ''))
        (ROOT / f'{key}.html').write_text(stamp(html))
        print('built', f'{key}.html')


if __name__ == '__main__':
    build()
    idx = ROOT / 'index.html'
    idx.write_text(stamp(re.sub(r'\?v=\d+', '', idx.read_text())))
    print('stamped index.html')
