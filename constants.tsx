
import { Service, AddOn, Testimonial, Staff } from './types';

export const COLORS = {
  primary: '#2D4F3E', // Deep Sage Green
  secondary: '#D4AF37', // Gold
  charcoal: '#333333',
  beige: '#F5F5DC',
  offWhite: '#FCF9F5',
};

export const CONTACT_INFO = {
  phone: '780-819-2606',
  email: 'aubine.massage@gmail.com',
  address: 'Edmonton, Alberta',
  instagram: 'https://www.instagram.com/gracefulhands_massage?igsh=MnNmeXV2NnlyemM4',
  tagline: 'Restoring Balance, One Touch at a Time.',
  formspreeEndpoint: 'https://formspree.io/f/xlgeqjar',
};

const CLINIC_PRICES = { 60: 110, 75: 135, 90: 150 };
const MOBILE_PRICES = { 60: 130, 75: 155, 90: 170 };
const MINI_45_PRICES = { 45: 85 };
const MINI_30_PRICES = { 30: 65 };

export const SERVICES: Service[] = [
  {
    id: '1',
    name: 'The Signature Swedish (Clinic)',
    description: 'Drift into a state of total calm. This classic modality uses long, gliding strokes and gentle kneading to improve circulation, reduce cortisol levels, and ease general muscle tension.',
    durationOptions: [60, 75, 90],
    prices: CLINIC_PRICES,
    basePrice: 110,
    image: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?auto=format&fit=crop&q=80&w=1200',
    category: 'Relaxation',
  },
  {
    id: '2',
    name: 'Deep Tissue Therapy (Clinic)',
    description: 'Designed to reach the deeper layers of muscle and fascia. We use slow, firm pressure to break down adhesions and restore range of motion. Best for chronic pain and stiff necks.',
    durationOptions: [60, 75, 90],
    prices: CLINIC_PRICES,
    basePrice: 110,
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=1200',
    category: 'Therapeutic',
  },
  {
    id: '3',
    name: 'Sports & Performance (Clinic)',
    description: 'Optimize your performance and speed up recovery. Incorporates stretching and trigger point therapy to maintain flexibility and treat overuse injuries.',
    durationOptions: [60, 75, 90],
    prices: CLINIC_PRICES,
    basePrice: 110,
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc2069?auto=format&fit=crop&q=80&w=1200',
    category: 'Specialty',
  },
  {
    id: '4',
    name: 'At Your Place Session',
    description: 'The luxury of Graceful Hands brought directly to your home. We provide the table, linens, and professional care, allowing you to relax without the commute.',
    durationOptions: [60, 75, 90],
    prices: MOBILE_PRICES,
    basePrice: 130,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecee?auto=format&fit=crop&q=80&w=1200',
    category: 'Specialty',
  },
  {
    id: 'm1',
    name: 'Head, Neck and Shoulders',
    description: 'Targeted relief for tension held in the upper body. Ideal for desk workers and those with frequent headaches.',
    durationOptions: [45],
    prices: MINI_45_PRICES,
    basePrice: 85,
    image: 'https://images.unsplash.com/photo-1516515429572-1f9f3b839fdc?auto=format&fit=crop&q=80&w=1200',
    category: 'Therapeutic',
  },
  {
    id: 'm2',
    name: 'Face, Arms and Feet',
    description: 'A specialized circulation-boosting treatment focusing on the extremities and facial tension.',
    durationOptions: [45],
    prices: MINI_45_PRICES,
    basePrice: 85,
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=1200',
    category: 'Relaxation',
  },
  {
    id: 'm3',
    name: 'Neck and Back',
    description: 'Express relief for the two most common areas of chronic discomfort and postural strain.',
    durationOptions: [30],
    prices: MINI_30_PRICES,
    basePrice: 65,
    image: 'https://images.unsplash.com/photo-1537333076647-58a4421aeaf0?auto=format&fit=crop&q=80&w=1200',
    category: 'Therapeutic',
  },
  {
    id: 'm4',
    name: 'Legs and Feet',
    description: 'Revitalizing lower body therapy designed to reduce inflammation and ease leg fatigue.',
    durationOptions: [30],
    prices: MINI_30_PRICES,
    basePrice: 65,
    image: 'https://images.unsplash.com/photo-1537333076647-58a4421aeaf0?auto=format&fit=crop&q=80&w=1200',
    category: 'Specialty',
  },
  {
    id: 'm5',
    name: 'Scalp and Face',
    description: 'A deeply soothing treatment that targets cranial tension and relaxes the muscles of the face.',
    durationOptions: [30],
    prices: MINI_30_PRICES,
    basePrice: 65,
    image: 'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?auto=format&fit=crop&q=80&w=1200',
    category: 'Relaxation',
  },
];

export const ADD_ONS: AddOn[] = [
  { id: 'a1', name: 'Cupping Therapy', price: 30 },
  { id: 'a2', name: 'Aromatherapy', price: 15 },
  { id: 'a3', name: 'Peppermint Foot Scrub', price: 20 },
  { id: 'a4', name: 'Facial Sculpting', price: 20 },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    clientName: 'Eleanor Vance',
    reviewText: 'The most tranquil experience I\'ve had in years. The deep tissue session truly targeted my lower back issues with clinical precision and luxury care.',
    rating: 5,
    date: '2024-03-15',
  },
  {
    id: 't2',
    clientName: 'James Miller',
    reviewText: 'Graceful Hands is the gold standard. The atmosphere alone lowered my cortisol levels immediately upon entry.',
    rating: 5,
    date: '2024-03-10',
  },
  {
    id: 't3',
    clientName: 'Sarah Jenkins',
    reviewText: 'Professional, clean, and incredibly effective. I book monthly now.',
    rating: 5,
    date: '2024-03-01',
  },
];

export const TEAM: Staff[] = [
  {
    id: 's1',
    name: 'Aubine',
    bio: 'Welcome to Graceful Hands Therapeutic Massage. We specialize in therapeutic modalities that go beyond simple relaxation. By understanding anatomy and the science of muscle recovery, we target the root causes of discomfort.',
    headshot: './Screenshot_20251231_104911.jpg',
    specialties: ['Clinical Myofascial Release', 'Deep Tissue', 'Sports Massage'],
  }
];
