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
  hours: { Monday: ['10:00', '20:00'], Tuesday: ['10:00', '20:00'], Wednesday: ['10:00', '20:00'], Thursday: ['10:00', '20:00'], Friday: ['10:00', '20:00'], Saturday: ['10:00', '20:00'], Sunday: ['10:00', '20:00'] },
  // short notes shown under a day, e.g. for festivals; remove once they have passed
  hoursNotes: { Friday: 'Diwali: hours might differ', Saturday: 'Diwali: hours might differ', Sunday: 'Diwali: hours might differ' },

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
  // the reviews in the profile's Most relevant order, as captured on 2 November 2026.
  // rating: stars given (left out where not captured yet, and then not shown); cut: the full text sits behind More on the profile;
  // likes: reactions shown under the review
  reviews: [
    {
      "name": "Shirish Kumar",
      "meta": "2 reviews",
      "rating": 5,
      "when": "7 months ago",
      "likes": 4,
      "cut": true,
      "text": "I would like to express my sincere appreciation to Pro Body Line for their excellent service and support. The quality of their gym equipment is outstanding, durable, and perfectly suited for professional fitness environments."
    },
    {
      "name": "hardik hirani",
      "meta": "4 reviews",
      "rating": 5,
      "when": "2 months ago",
      "likes": 1,
      "cut": true,
      "text": "The probodyline fitness store is an exceptional store with high-quality, durable equipment and helpful customer service."
    },
    {
      "name": "Kuldeep Gehlawat",
      "meta": "1 review · 2 photos",
      "when": "a year ago",
      "likes": 3,
      "text": "Royal Gym Gurgaon\nAll machines and services and Probodylin staffs world class."
    },
    {
      "name": "pulkit sharma",
      "meta": "10 reviews · 1 photo",
      "when": "5 months ago",
      "likes": 2,
      "text": "This is the best store . they have a huge choices in the wellness section machine ( gym ) , the staff was very knowledgeable and the staff was very professional."
    },
    {
      "name": "Om Tak",
      "meta": "3 reviews · 1 photo",
      "when": "6 months ago",
      "likes": 3,
      "text": "They do not reduce the rates of the machines, but they give full response and respect to the customers...👍"
    },
    {
      "name": "Sunil kumar",
      "meta": "1 review · 3 photos",
      "when": "7 years ago",
      "likes": 1,
      "text": "India's largest Showroom, here avl. All exercise machine. They provide high quality Machine"
    },
    {
      "name": "Rajkumar Sahu",
      "meta": "1 review",
      "when": "3 months ago",
      "likes": 2,
      "text": "Excellent service and high-quality gym machines."
    },
    {
      "name": "deepak bhati",
      "meta": "1 review",
      "when": "a year ago",
      "likes": 1,
      "cut": true,
      "text": "Very good service specially by tarun sir and his team their machines and service are excellent thank you to probody line"
    },
    {
      "name": "salim shaikh",
      "meta": "3 reviews",
      "when": "2 years ago",
      "likes": 1,
      "cut": true,
      "text": "Pro Bodyline is One of the best gym equipment and service provider in the field of gym. Even the service staffs are really very friendly and good at work. We are very happy with their service.",
      "reply": {
        "when": "2 years ago",
        "text": "🙏🏻"
      }
    },
    {
      "name": "atul kumar",
      "meta": "2 reviews · 5 photos",
      "when": "7 years ago",
      "likes": 3,
      "cut": true,
      "text": "PROBODYLINE ( Creative Enterprises) is an importer of Quality Fitness Equipment in India. This company has attitude & that too it is because of its High quality equipment. I have purchased complete Gym setup from here , 03 Times for my 03"
    },
    {
      "name": "Harsh Verma",
      "meta": "12 reviews · 5 photos",
      "when": "4 years ago",
      "likes": 2,
      "text": "Perfect place to buy GYM Equipments if you want to settle your GYM. They have all the verities in different prices."
    },
    {
      "name": "Abhishek Sharma",
      "meta": "5 reviews · 3 photos",
      "when": "2 years ago",
      "likes": 2,
      "text": "M owner of As fitness centre ajmer road Jaipur all the machinery is in excellent working . Good equipment, excellent supporting staf very good service, technician Azhar is experienced person. Pro body line machine all are good"
    },
    {
      "name": "Saurabh Choyal",
      "meta": "86 reviews · 18 photos",
      "when": "4 years ago",
      "text": "Probodyline is very good brand . Mere gym mein sbhu equpiments issi brand ke hai superb quality after sales service bhi bahut achi hai . Specially thanks to imran khan sir . He is a fantastic mechanic . #themusclebargym"
    },
    {
      "name": "Arshad Qayoom",
      "meta": "1 review",
      "when": "a year ago",
      "likes": 2,
      "text": "I have used probodyline brand from 2018.but this tym all my equipment r looking shiny or strong... Thnx probodyline team.. lot's of love....",
      "reply": {
        "when": "a year ago",
        "text": "❤️"
      }
    },
    {
      "name": "Vinay Khandelwal",
      "meta": "2 reviews · 1 photo",
      "when": "6 months ago",
      "likes": 2,
      "text": "High Quality machines. and practical designs"
    },
    {
      "name": "MS Panwar Fitness",
      "meta": "5 reviews · 2 photos",
      "when": "6 years ago",
      "likes": 2,
      "cut": true,
      "text": "For my gym I searched gym equipments of every company. Some of them are very higher price wise and some of them didn't have the good quality equipments and no one had the display of equipments. Then I heard the Pro Bodyline company who"
    },
    {
      "name": "Om Brahma Satyam",
      "meta": "2 reviews",
      "when": "7 years ago",
      "likes": 2,
      "text": "Just love the work and the service given by Pro Bodyline Fitness. They Have so many gym equipment variety the gym equipments which i install in my gym all are best and durable. so i can say that Pro Bodyline is one of the best gym setup service provider in India."
    },
    {
      "name": "NFC Gym",
      "meta": "1 review · 5 photos",
      "when": "2 years ago",
      "text": "Nfc gym chomu Jaipur road all the machinery is in excellent working . Good equipment, excellent supporting staf very good service. Pro body line machine all are good"
    }
  ],
};
