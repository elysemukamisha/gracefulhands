
export interface Service {
  id: string;
  name: string;
  description: string;
  durationOptions: number[];
  prices: Record<number, number>; // Maps duration (minutes) to price (dollars)
  basePrice: number; // Retained for backward compatibility and quick display
  image: string;
  category: 'Therapeutic' | 'Relaxation' | 'Specialty';
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface SiteSettings {
  primaryColor: string;
  secondaryColor: string;
  metaTitle: string;
  metaDescription: string;
  instagramUrl: string;
  facebookUrl: string;
  announcementBar: string;
  headshotUrl: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  serviceId: string;
  duration: number;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
  intakeDetails: {
    pressure: string;
    focus: string;
    medical: string;
  };
  totalPrice: number;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  reviewText: string;
  rating: number;
  date: string;
}

export interface Staff {
  id: string;
  name: string;
  bio: string;
  headshot: string;
  specialties: string[];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  serviceType: string;
  painPoints: string;
  hasInsurance: boolean;
  status: 'New' | 'Contacted' | 'Booked' | 'Lost';
  createdAt: string;
  notes: string;
}
