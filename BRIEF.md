# Probodyline: Website Revamp Brief

Concept demo: [index.html](index.html). Open it in Chrome and scroll slowly.

---

## 1. What we know about Probodyline (from the web)

| | |
|---|---|
| **Brand** | Pro Bodyline Fitness / Probodyline. A brand of **Creative Enterprises** |
| **Positioning** | "India's Biggest Gym Equipment Brand" |
| **Tagline** | "If It's Unique, It's Probodyline." About-page heading: "Empowering Fitness, Inspiring Greatness" |
| **Age** | About 25 years, founded in Jaipur |
| **HQ / showroom** | F-1293, Phase-3, RIICO Industrial Area, Sitapura, Jaipur, Rajasthan 302022 (≈ 26.78° N, 75.82° E) |
| **Showroom** | Claimed 45,000 sq ft, "India's largest gym equipment showroom", 3,500+ machines on display |
| **Installs** | Claimed 18,000+ gyms across India |
| **Products** | Treadmills, recumbent / upright / spin bikes, ellipticals, strength machines, free weights, full commercial and home gym setups |
| **Customers** | Elite athletes, home users, commercial gyms |
| **Sales desks** | Delhi NCR, Gujarat, Punjab, Haryana, TN: +91 94038 93899 · Maharashtra, UP, Bangalore: +91 94038 93399 · Rest of India: +91 78917 12345 (all on WhatsApp) |
| **Social** | instagram.com/probodyline · youtube.com/@probodyline · facebook.com/probodylinefitness · x.com/probodyline · pinterest |
| **Other domain** | probodyline.co.in (biography / about page) |

**Confirm with the client:**
- The 45,000 sq ft, 3,500+ machines and 18,000+ gyms figures are self-reported.
- The founder's name and the exact founding year aren't published.
- Is the Sitapura address the showroom, the factory or both?
- Manufacturer or importer? Different pages say different things.
- "Pro Ultimate" is mentioned by one dealer as a product line. Is it still current?
- Brand colours and logo files.

### Problems on the current site (good talking points)
- The stat counters on probodyline.com show **0 / 0+ / 0+**, so the biggest selling points render as zero.
- The timeline (1990–2012) and Awards sections on probodyline.co.in are **placeholder text**.
- There is no product catalogue, only "gym equipment" in general.
- Old URLs like `/home.php` return 404, which loses SEO.
- There are two domains (.com and .co.in) with different stories.

---

## 2. Concept direction: "Heavy Metal Cinematic"

The site should feel like walking into the showroom. Dark steel, molten orange, huge condensed type, scroll-driven 3D. There are three emotional beats:

1. **Scale**: from orbit down to one address in Jaipur (the "Google Earth" moment).
2. **Proof**: 18,000 gyms, 45,000 sq ft and 3,500 machines, shown visually rather than just stated.
3. **Action**: plan your gym, then go straight to the right regional sales desk on WhatsApp.

## 3. What the prototype shows (v2, all working)

Run it with `python3 -m http.server 5173` in this folder, then open http://localhost:5173. It needs a server because it loads local video and textures.

| Section | What it does |
|---|---|
| Earth to showroom | A photoreal globe with day and night sides, city lights, clouds, ocean glint and atmosphere. Scrolling flies to India, draws install arcs to 20 cities and dives to Sitapura. A lens then opens from the pin into the **real drone footage** of the showroom (`assets/vid-b.mp4`). |
| The showroom | The drone shot fills the screen, with count-up stats |
| Walk the floor | A 3D walk through a showroom interior as you scroll: in through the entrance, then Cardio (treadmills, spin bikes, ellipticals), Strength (rows of the flagship press plus selectorised stations) and Free weights (power racks, benches, dumbbell racks), ending at a lit brand wall. It has a reflective floor, LED ceiling lines, hanging zone signs and a zone menu, and a pin on the flagship press that jumps to its 3D studio. |
| 3D machine studio | A model of the iso-lateral plate-loaded press built in Three.js. **Inspect**: orbit and set the seat height. **Train**: drag either arm to do a rep (iso-lateral, so each side moves independently, and heavier plates make the drag harder), plus auto reps and a rep counter. **Load**: slide 2.5 to 20 kg plates onto the horns with a live total. **Explode**: the parts separate, with labels. The real product video (`assets/vid-a.mp4`) sits next to it. |
| Equipment | A typographic index of the categories |
| Gym planner | Area, gym type, focus and state produce a layout, then a WhatsApp quote to the right regional desk |
| Concept menu | Ideas the client can tap to shortlist in the meeting |

**About the 3D machine:** it's hand-modelled to match the video, not taken from CAD. For production, ask the manufacturer for CAD/STEP files, or photo-scan the real machine, and export it as GLB. Confirm the product's real name and specs. "Iso-lateral plate-loaded press" is my reading of the video.


### v3: every concept is live
Page order: Earth flythrough, then the drone showroom, the floor walk, the **3D studio** (eight machines: the press trains and loads, the treadmill runs, the bike spins, and every machine explodes), **Will it fit** (room size, real-scale placement, safe clearance, AR on phones), the **muscle finder** (3D body to matching machines), the **catalogue** (rendered from the 3D models), the **India install map** with **before and after**, the **3D gym planner** with a priced **proforma**, **visit booking** (calendar, slots, WhatsApp, .ics invite), and the **concept index** with a shortlist. Regional routing is global: the state picker in the nav drives every quote, booking and phone number.
Sample data, to replace with real data: city install counts, product prices, and the before and after renders.


### v4: round two, after client feedback
Added to the website: **Brand it** (frame, arm and upholstery colours plus the gym's own logo on the 3D machine, then "Order this build"), **the lifter** (a ghost athlete doing reps on the press), a **gym consultant** chat (four questions, then a plan, a price and a desk), **compare** (up to three machines side by side), a **payback calculator** fed by the planner, **whole gym in AR** from the planner, an **owners corner** (warranty, service and spares, with a QR plate on every machine) and an optional **sound layer**. Code: `js/more.js`.
Kept off the page for now: client order portal, WhatsApp Business automation, Hindi version, Google Business profile.


### v5: polish and sound
- **Removed** the concept index section from the page. The idea list now lives only in this brief.
- **Visual:** smooth scrolling (Lenis), film grain, a scroll progress line, active nav, masked word reveals on every heading, a choreographed hero intro, magnetic CTAs, a velocity-reactive numbers band, cursor spotlights on cards, dust and light beams on the showroom floor, and a footer wordmark that fills as you arrive. Code: `js/polish.js`.
- **Sound** (`js/sound.js`): every cue is tied to the real animation:
  - **Plates:** slide on and clank when they land.
  - **Press:** a lever lockout at the top, and a touchdown thud scaled by load and speed.
  - **Treadmill:** motor and footfalls at the set speed.
  - **Bike:** flywheel whir at the set cadence.
  - **Showroom walk:** a footstep every 0.78 m of camera travel, with hall reverb.
  - **Flight:** wind that follows scroll speed, and a whoosh plus bloom as the lens opens.
  - **Stats:** counter ticks that follow the count-up.
  - **Map:** rising tones synced to the pillars.
  - **Elsewhere:** scrub texture on before and after, chat pops, and a chime on booking.

## 4. Full idea list (for the client to pick from)

| Idea | Wow | Effort | Notes |
|---|---|---|---|
| Earth → showroom flythrough | ★★★★★ | M | Production version uses **Google Photorealistic 3D Tiles via CesiumJS** so the last frames show the real building, then cut to drone footage. Google Earth itself can't be embedded. The 3D Tiles API is billed per use. |
| Walk the showroom | ★★★★★ | M–L | Scroll-scrubbed drone footage (cheapest), Matterport tour, or a Gaussian-splat scan (most "crazy") |
| Gym Builder → proforma | ★★★★ | M | Can pull products and pricing from the **existing PRo-Bodyline admin panel** and generate a proforma automatically. This is a strong upsell. |
| India install map | ★★★★ | M | 3D India map with a dot per gym and case-study popups |
| 3D / AR product viewer | ★★★★★ | L | `<model-viewer>`: 360° spin plus "view in your room" on phones. Needs 3D models (photogrammetry or the manufacturer's CAD). |
| Muscle-map finder | ★★★★ | M | Tap a muscle to see the matching machines |
| Book a showroom visit | ★★★ | S | Pick a slot, confirm on WhatsApp, with a video-call walkthrough option |
| Smart regional routing | ★★★ | S | Already working in the demo |
| Before/after gym reveals | ★★★★ | S | Drag slider. The best sales asset for B2B buyers. |
| Gym-owner video wall | ★★★ | S | Reuse their Instagram and YouTube content |
| Compare + PDF spec sheets | ★★★ | M | |
| Kinetic brand layer | ★★★ | S | Preloader, cursor, type, optional sound |

## 5. Suggested phasing

- **Phase 1 (launch, ~4–6 weeks):** Earth intro (Three.js version, as in the demo), arrival stats, catalogue + product pages, Gym Builder, regional WhatsApp routing, visit booking, SEO and redirects from the old URLs.
- **Phase 2 (wow):** Real 3D Tiles flythrough, drone showroom walk, India install map, before/after reveals, video wall.
- **Phase 3 (stretch):** AR product viewer, muscle-map finder, Gaussian-splat showroom, auto proforma from the admin panel.

## 6. Tech stack

- **Next.js** (App Router) on Vercel or Render: SEO, image optimisation, ISR for the catalogue
- **React Three Fiber + drei** for 3D, **GSAP ScrollTrigger + Lenis** for scroll choreography
- **CesiumJS + Google Photorealistic 3D Tiles** for the real-Earth intro (Phase 2)
- **Catalogue data:** reuse the existing PRo-Bodyline admin panel's product DB through an API, or a headless CMS (Sanity) if marketing wants to edit content directly
- **Performance guardrails:** much of the traffic is Indian mobile, so heavy 3D is lazy-loaded and low-end devices get a fallback video. The target is a fast first paint on 4G, and `prefers-reduced-motion` is respected.

## 7. Questions for the client meeting
1. Which 3–5 ideas from the concept menu are must-haves?
2. Do you have drone or showroom footage, or should we shoot it?
3. Should the site show prices or stay quote-only?
4. Who handles leads: WhatsApp only, or a CRM?
5. Do you have brand guidelines (logo, colours)?
6. What is the budget and the launch date (an expo or event)?

---
Sources: probodyline.com · probodyline.co.in/biography · facebook.com/probodylinefitness · zoominfo (Pro Bodyline Fitness)
