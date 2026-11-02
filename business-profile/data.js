// Everything the business profile page shows comes from this file.
// Fields set to null are not shown on the page yet; fill them in from the client's live business profile.
window.PROFILE = {
  // as on the live profile, 2 November 2026
  name: 'Probodyline Fitness- India’s Biggest Gym Equipment Showroom',
  legalName: 'Creative Enterprises',
  category: 'Fitness equipment wholesaler in Rajasthan',
  tagline: "India's biggest gym equipment showroom",
  description: null,
  // the business's own description, shown under From Probodyline Fitness
  fromBusiness: "India's only gym equipment brand with:\n- 40000+ sq ft showroom\n- 2500+ equipment on display\n- 18000+ gym installations across Asia",

  rating: 4.4,
  reviewCount: 316,
  // share of reviews per star, 5 down to 1, in percent (read from the profile's bars; they average 4.4)
  ratingBars: [80, 7, 1, 1, 11],

  address: 'Sitapura Industrial Area, Sitapura, Jaipur, Ramchandpura, Rajasthan 302022',
  plusCode: null, // e.g. 'Q4X8+2C Jaipur, Rajasthan'
  lat: 26.7846, lng: 75.8360, // map pin; adjust to the exact pin on the live profile
  phone: '098284 07044',
  website: 'https://www.probodyline.com',
  whatsapp: null,
  socials: [
    { label: 'YouTube', icon: 'youtube-logo', url: 'https://www.youtube.com/@probodyline' },
    { label: 'Facebook', icon: 'facebook-logo', url: 'https://www.facebook.com/probodylinefitness/' },
    { label: 'X (Twitter)', icon: 'x-logo', url: null }, // link to confirm
  ],

  // opening hours, Monday first. Use null for a day that is not confirmed, 'Closed' for closed days,
  // or [open, close] in 24-hour time, e.g. ['10:00', '20:00']
  hours: { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null },

  // photos: the first is the large header image
  photos: [
    { src: 'img/hall.jpg', alt: 'Main hall of the showroom', tag: 'Inside' },
    { src: 'img/facade.jpg', alt: 'The Probodyline building in Sitapura', tag: 'Exterior' },
    { src: 'img/sign.jpg', alt: 'The Pro Bodyline sign over the main hall', tag: 'Inside' },
    { src: 'img/sol-commercial.jpg', alt: 'Plate-loaded strength floor', tag: 'Products' },
    { src: 'img/home-strength.jpg', alt: 'Yellow plate-loaded machines', tag: 'Products' },
    { src: 'img/home-cardio.jpg', alt: 'Spin bikes and treadmills', tag: 'Products' },
    { src: 'img/home-selectorised.jpg', alt: 'Selectorised weight-stack machines', tag: 'Products' },
    { src: 'img/home-free-weights.jpg', alt: 'Benches and racks', tag: 'Products' },
    { src: 'img/sol-home.jpg', alt: 'Cross-trainers and a treadmill', tag: 'Products' },
    { src: 'img/sol-studios.jpg', alt: 'Rows of spin bikes', tag: 'Products' },
    { src: 'img/sol-hotels.jpg', alt: 'A bright selectorised strength room', tag: 'Inside' },
    { src: 'img/home-project-1.jpg', alt: 'A plate-loaded floor under blue lights', tag: 'Inside' },
    { src: 'img/home-project-2.jpg', alt: 'A long aisle of plate-loaded machines', tag: 'Inside' },
    { src: 'img/banner.jpg', alt: "India's biggest gym equipment showroom banner", tag: 'Inside' },
  ],

  // attribute groups as listed on the profile's About section, e.g. { group: 'Service options', items: ['Delivery'] }
  about: [],

  // review topics shown as chips (the profile shows 6 more behind +6)
  topics: [{ label: 'probodyline equipment', count: 15 }, { label: 'spares parts availability', count: 12 }, { label: 'cardio training', count: 3 }, { label: 'gym setup', count: 3 }],

  // reviews exactly as on the live profile, with the reviewer's permission where needed:
  // { name: 'Reviewer name', meta: '12 reviews', rating: 5, when: '2 months ago', text: '...', reply: { when: '2 months ago', text: '...' } }
  // cut: true marks a review whose full text was not captured yet (the profile shortens it behind More)
  reviews: [
    { name: 'Shirish Kumar', meta: '2 reviews', rating: 5, when: '7 months ago', cut: true,
      text: 'I would like to express my sincere appreciation to Pro Body Line for their excellent service and support. The quality of their gym equipment is outstanding, durable, and perfectly suited for professional fitness environments.' },
    { name: 'hardik hirani', meta: '4 reviews', rating: 5, when: '2 months ago', cut: true,
      text: 'The probodyline fitness store is an exceptional store with high-quality, durable equipment and helpful customer service.' },
    { name: 'Ron Dcosta', meta: '31 reviews · 122 photos', rating: 1, when: 'a year ago',
      text: "I was very interested in buying their new machines but these people don't sell single machines makes me laugh we have thier brand treadmill still they refuse to sell 1 single machine if they can't sell you a single machine don't expect after sales service of the parts 😂😂😂" },
  ],
};
