
import { Service, Appointment, SiteSettings, ContactMessage, Lead } from '../types';
import { SERVICES, CONTACT_INFO } from '../constants';

const DB_KEYS = {
  SERVICES: 'gh_services',
  APPOINTMENTS: 'gh_appointments',
  SETTINGS: 'gh_settings',
  MESSAGES: 'gh_messages',
  LEADS: 'gh_leads',
  AUTH: 'gh_session'
};

export const db = {
  // Services
  getServices: (): Service[] => {
    const data = localStorage.getItem(DB_KEYS.SERVICES);
    return data ? JSON.parse(data) : SERVICES;
  },
  saveServices: (services: Service[]) => {
    localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(services));
  },

  // Appointments
  getAppointments: (): Appointment[] => {
    const data = localStorage.getItem(DB_KEYS.APPOINTMENTS);
    return data ? JSON.parse(data) : [];
  },
  addAppointment: (apt: Appointment) => {
    const current = db.getAppointments();
    localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify([apt, ...current]));
  },
  updateAppointment: (id: string, updates: Partial<Appointment>) => {
    const current = db.getAppointments();
    const updated = current.map(a => a.id === id ? { ...a, ...updates } : a);
    localStorage.setItem(DB_KEYS.APPOINTMENTS, JSON.stringify(updated));
  },

  // Site Settings
  getSettings: (): SiteSettings => {
    const data = localStorage.getItem(DB_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      primaryColor: '#2D4F3E',
      secondaryColor: '#D4AF37',
      metaTitle: 'Graceful Hands | Modern Luxury Therapeutic Massage',
      metaDescription: 'Clinical care in a restorative setting. Edmonton\'s premier therapeutic massage destination.',
      instagramUrl: CONTACT_INFO.instagram,
      facebookUrl: '#',
      announcementBar: 'New Clients: Save 15% on your first 90-minute session.'
    };
  },
  saveSettings: (settings: SiteSettings) => {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    // Apply dynamic colors to document
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', settings.secondaryColor);
  },

  // Messages
  getMessages: (): ContactMessage[] => {
    const data = localStorage.getItem(DB_KEYS.MESSAGES);
    return data ? JSON.parse(data) : [];
  },
  addMessage: (msg: ContactMessage) => {
    const current = db.getMessages();
    localStorage.setItem(DB_KEYS.MESSAGES, JSON.stringify([msg, ...current]));
  },

  // Leads
  getLeads: (): Lead[] => {
    const data = localStorage.getItem(DB_KEYS.LEADS);
    return data ? JSON.parse(data) : [];
  },
  addLead: (lead: Lead) => {
    const current = db.getLeads();
    localStorage.setItem(DB_KEYS.LEADS, JSON.stringify([lead, ...current]));
  },
  updateLead: (id: string, updates: Partial<Lead>) => {
    const current = db.getLeads();
    const updated = current.map(l => l.id === id ? { ...l, ...updates } : l);
    localStorage.setItem(DB_KEYS.LEADS, JSON.stringify(updated));
  },

  // Availability: returns available time strings (HH:MM) for a given date + duration
  getAvailableSlots: (dateStr: string, duration: number): string[] => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

    if (dayOfWeek === 0) return []; // Sunday closed

    let startHour = 9, endHour = 19; // Mon–Fri 9AM–7PM
    if (dayOfWeek === 6) { startHour = 10; endHour = 16; } // Sat 10AM–4PM

    const dateString = date.toDateString();
    const existing = db.getAppointments().filter(
      a => a.date === dateString && (a.status === 'Confirmed' || a.status === 'Pending')
    );

    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const slots: string[] = [];
    for (let m = startHour * 60; m + duration <= endHour * 60; m += 30) {
      if (isToday && m <= currentMin + 60) continue;
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const slotEnd = m + duration;
      const conflict = existing.some(a => {
        const aStart = parseTime(a.time);
        const aEnd = aStart + a.duration;
        return m < aEnd && aStart < slotEnd;
      });
      if (!conflict) slots.push(timeStr);
    }
    return slots;
  },

  // Auth
  login: (pass: string) => {
    // Updated authentication code to 2636
    if (pass === '2636') {
      localStorage.setItem(DB_KEYS.AUTH, 'true');
      return true;
    }
    return false;
  },
  logout: () => localStorage.removeItem(DB_KEYS.AUTH),
  isAuthenticated: () => localStorage.getItem(DB_KEYS.AUTH) === 'true'
};