import { Product, Review, GloveSize } from '../types';

export const HERO_IMAGE = '/ocigloves1.jpeg';

export const SINGLE_PRODUCT: Product = {
  id: 'oci-elite-2-gloves',
  name: 'ELITE 2.0 GLOVES',
  subtitle: 'All-Weather Gaelic Football Match Gloves',
  badge: 'Limited Stock',
  price: 14.99,
  originalPrice: 20.00,
  rating: 4.7,
  reviewCount: 3,
  images: {
    front: '/ocigloves1.jpeg',
    back: '/ocigloves2.jpeg',
    palm: '/ocigloves1.jpeg',
  },
  description: 'OCI SPORTS GAA Gloves are designed to last. — whether it’s rain, muck, snow or sunshine.\nAny Condition. We Have You Covered. OCI Sports.',
  cut: 'Negative Cut',
  palmLatex: 'High-Tack All-Weather Contact Palm',
  bodyMaterial: 'Thermal Flex Neoprene with White 3D Silicone Print',
  wristClosure: 'Ergonomic Neoprene Lock Strap with OCI Tab',
  gripScore: 9.9,
  durabilityScore: 9.8,
  wetWeatherScore: 9.9,
  keyFeatures: [
    'Engineered for rain, muck, snow, or sunshine',
    'High-grip contact palm calibrated for size 5 O\'Neills leather',
    '3D silicone high-density OCI Sports branding',
    'Reinforced negative stitching built to last through relentless match play'
  ],
  sizes: [
    { size: 'S', inStock: true, stockCount: 5 },
    { size: 'M', inStock: true, stockCount: 3 },
    { size: 'L', inStock: true, stockCount: 4 }
  ],
  colorway: 'Blackout Stealth',
  bestFor: 'Any Condition, All GAA Matches & Training'
};

export const PRODUCTS: Product[] = [SINGLE_PRODUCT];

export const REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Patrick O’Ryan',
    club: 'Louth GAA',
    county: 'Louth',
    position: 'Forward',
    gloveModel: 'ELITE 2.0 GLOVES',
    rating: 5,
    date: 'Verified Buyer',
    title: 'Jesus they’re class',
    comment: 'Jesus they’re class, no matter how many games i play in them they don’t get damaged. Well worth it.',
    verifiedBuyer: true,
    gripRating: 5,
    durabilityRating: 5,
    helpfulCount: 24
  },
  {
    id: 'rev-2',
    author: 'Jamie McDaid',
    club: 'Galway GAA',
    county: 'Galway',
    position: 'Midfield',
    gloveModel: 'ELITE 2.0 GLOVES',
    rating: 4,
    date: 'Verified Buyer',
    title: 'Comfortable and fit good',
    comment: 'The gloves are comfortable and they fit good. Had them a while now and they’re good to be fair.',
    verifiedBuyer: true,
    gripRating: 4,
    durabilityRating: 5,
    helpfulCount: 16
  },
  {
    id: 'rev-3',
    author: 'John Walsh',
    club: 'Kerry GAA',
    county: 'Kerry',
    position: 'Forward',
    gloveModel: 'ELITE 2.0 GLOVES',
    rating: 5,
    date: 'Verified Buyer',
    title: 'Look class and feel class',
    comment: 'They look class and feel class, the lads in the dressing room all asked me where i got them from. Great pair of gloves to play with. Worth the money.',
    verifiedBuyer: true,
    gripRating: 5,
    durabilityRating: 5,
    helpfulCount: 31
  }
];

export const SIZING_DATA = [
  { size: 'S' as GloveSize, handLengthCm: '16.5 - 18.0', palmWidthCm: '7.5 - 8.2', ageGuide: 'Teens / Small Adult' },
  { size: 'M' as GloveSize, handLengthCm: '18.1 - 19.5', palmWidthCm: '8.3 - 9.0', ageGuide: 'Standard Adult (Most Popular)' },
  { size: 'L' as GloveSize, handLengthCm: '19.6 - 21.0', palmWidthCm: '9.1 - 10.0', ageGuide: 'Large Adult / Long Fingers' }
];

export const FAQS = [
  {
    q: 'How do the gloves perform in heavy rain & mud?',
    a: 'The all-weather contact palm is textured and naturally activates under moisture. When playing on wet Irish pitches, the surface prevents slipping against the leather of the Gaelic ball.'
  },
  {
    q: 'What is the best way to clean and care for ELITE 2.0 gloves?',
    a: 'Rinse in lukewarm water after matches to remove muck. Squeeze gently without twisting and allow to air dry naturally away from direct radiators or heat sources.'
  },
  {
    q: 'How fast is dispatch across Ireland?',
    a: 'All orders are dispatched from Ireland via DPD Express & An Post Tracked with typical 24–48 hour delivery to all 32 counties.'
  }
];

export const CHAT_KNOWLEDGE_BASE: Record<string, string> = {
  wet: 'The ELITE 2.0 GLOVES feature an all-weather contact grip designed specifically for wet Irish conditions, muck, and rain. The wetter the ball gets, the more friction the contact surface generates.',
  size: 'We offer sizes S, M, and L. If you prefer a snug second-skin match fit, choose your exact hand measurement size. Size M is our standard adult fit.',
  club: 'Use code GAACLUB20 at checkout for 20% off team/club bulk orders of 10+ pairs!',
  delivery: 'Orders are shipped from Ireland via An Post Tracked & DPD 24h Express. Orders placed before 2 PM dispatch same-day.',
  care: 'Wash gently in lukewarm water after muck or wet pitch games. Never dry on hot radiators as this will dry out the grip.',
  contact: 'You can email our team directly at contactocisports@gmail.com anytime. We respond within a few hours!',
  default: 'Dia duit! I am your OCI Sports Gaelic Gear Specialist. Ask me anything about sizing S/M/L, match delivery, or the ELITE 2.0 GLOVES!'
};
