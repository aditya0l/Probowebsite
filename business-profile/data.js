// Everything the business profile page shows comes from this file.
// Fields set to null are not shown on the page yet; fill them in from the client's live business profile.
window.PROFILE = {
  name: 'Pro Bodyline Fitness',
  legalName: 'Creative Enterprises',
  category: 'Gym equipment supplier',
  tagline: "India's biggest gym equipment showroom",
  description: "A 45,000 sq ft gym equipment showroom in Sitapura, Jaipur, with more than 3,500 machines on display. Cardio, plate-loaded, selectorised and free weights for commercial gyms, home gyms, hotels and studios, with planning, delivery, installation and service across India.",

  // rating and review count exactly as shown on the live profile, e.g. rating: 4.5, reviewCount: 306
  rating: null,
  reviewCount: null,
  // share of reviews per star, 5 down to 1, in percent, e.g. [78, 12, 4, 2, 4]
  ratingBars: null,

  address: 'F-1293, Phase-3, RIICO Industrial Area, Sitapura, Jaipur, Rajasthan 302022',
  plusCode: null, // e.g. 'Q4X8+2C Jaipur, Rajasthan'
  lat: 26.7846, lng: 75.8360, // map pin; adjust to the exact pin on the live profile
  phone: '+91 78917 12345',
  website: 'https://www.probodyline.com',
  whatsapp: '917891712345',
  socials: [
    { label: 'Instagram', icon: 'instagram-logo', url: 'https://www.instagram.com/probodyline' },
    { label: 'YouTube', icon: 'youtube-logo', url: 'https://www.youtube.com/@probodyline' },
    { label: 'Facebook', icon: 'facebook-logo', url: 'https://www.facebook.com/probodylinefitness/' },
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

  // the client's own business details, as listed on the profile
  about: [
    { group: 'Highlights', items: ['45,000 sq ft showroom', '3,500+ machines on display', 'Try before you buy'] },
    { group: 'Service options', items: ['In-store shopping', 'Delivery', 'On-site installation'] },
  ],

  // review topics shown as chips, e.g. [{ label: 'quality', count: 42 }]
  topics: [],

  // reviews exactly as on the live profile, with the reviewer's permission where needed:
  // { name: 'Reviewer name', meta: '12 reviews', rating: 5, when: '2 months ago', text: '...', reply: { when: '2 months ago', text: '...' } }
  reviews: [],
};
