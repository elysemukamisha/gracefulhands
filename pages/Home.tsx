import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ShieldCheck, Heart, Sparkles, Send, Phone, MapPin, Mail, Mic } from 'lucide-react';
import { SERVICES, TESTIMONIALS, TEAM, CONTACT_INFO } from '../constants';
import VoiceAssistant from '../components/VoiceAssistant';
import BookingReviewModal from '../components/BookingReviewModal';

interface BookingSummary {
  firstName: string;
  anyPain: string;
  preferredDay: string;
  timing: 'Morning' | 'Evening';
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);

  const handleBookingCollected = (summary: BookingSummary) => {
    setBookingSummary(summary);
    setIsVoiceOpen(false);
  };

  const handleConfirmBooking = async () => {
    if (!bookingSummary) return;

    const payload = {
      _subject: `AI Voice Lead: ${bookingSummary.firstName}`,
      firstName: bookingSummary.firstName,
      anyPain: bookingSummary.anyPain,
      preferredDay: bookingSummary.preferredDay,
      timing: bookingSummary.timing,
      source: 'AI Voice Support Assistant'
    };

    try {
      // Step 1: Submit lead to Formspree for immediate follow-up if they drop off
      await fetch(CONTACT_INFO.formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Step 2: Navigate to the booking page at the final step with pre-filled data
      const summaryToPass = { ...bookingSummary };
      setBookingSummary(null);
      navigate('/booking', { state: { prefill: summaryToPass, step: 4 } });
    } catch (err) {
      console.error('Lead submission error:', err);
      // Proceed to booking page even if lead capture fails to ensure the user can still book
      navigate('/booking', { state: { prefill: bookingSummary, step: 4 } });
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=2400" 
            className="w-full h-full object-cover brightness-[0.45]"
            alt="Luxury spa environment"
          />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl text-white font-bold serif mb-6 animate-fade-in leading-tight">
            Where Therapeutic Precision <br />
            <span className="italic text-[#D4AF37]">Meets Deep Relaxation.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Step away from the noise and into a sanctuary designed for your recovery. Experience massage therapy tailored to your body’s unique needs.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => setIsVoiceOpen(true)}
              className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-10 py-4 rounded-sm text-lg font-semibold hover:bg-white/20 transition-all flex items-center gap-3 w-full sm:w-auto min-w-[280px] justify-center"
            >
              <Mic size={20} className="text-[#D4AF37]" /> AI Voice Support
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link to="/booking" className="bg-[#D4AF37] text-white px-10 py-4 rounded-sm text-lg font-semibold hover:bg-[#B89830] transition-all transform hover:scale-105 shadow-xl w-full sm:w-auto min-w-[280px] text-center">
                Book Your Session
              </Link>
              <Link to="/services" className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-10 py-4 rounded-sm text-lg font-semibold hover:bg-white/20 transition-all w-full sm:w-auto min-w-[280px] text-center">
                Explore Treatments
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Voice Assistant Modal */}
      <VoiceAssistant 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
        onBookingCollected={handleBookingCollected}
      />

      {/* Booking Review Modal */}
      <BookingReviewModal 
        summary={bookingSummary}
        onConfirm={handleConfirmBooking}
        onEdit={() => { setBookingSummary(null); setIsVoiceOpen(true); }}
        onCancel={() => setBookingSummary(null)}
      />

      {/* Philosophy Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h4 className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-6">Our Philosophy</h4>
          <h2 className="text-3xl md:text-5xl font-bold serif text-[#2D4F3E] mb-8">More Than Just a Massage.</h2>
          <p className="text-gray-600 text-lg leading-relaxed font-light mb-12">
            At Graceful Hands, we believe that massage is not a luxury—it is a vital component of whole-body health. 
            Whether you are seeking relief from chronic pain, recovering from an injury, or simply need to decompress 
            from daily stress, our approach combines clinical expertise with a serene environment to help you feel your best.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F5F5DC] text-[#2D4F3E] rounded-full flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl serif mb-4 font-bold">Clinical Precision</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Evidence-based techniques targeting structural imbalances and chronic pain points.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F5F5DC] text-[#2D4F3E] rounded-full flex items-center justify-center mb-6">
                <Heart size={32} />
              </div>
              <h3 className="text-2xl serif mb-4 font-bold">Holistic Care</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Treating the whole person, not just the symptom, for sustainable long-term health.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F5F5DC] text-[#2D4F3E] rounded-full flex items-center justify-center mb-6">
                <Sparkles size={32} />
              </div>
              <h3 className="text-2xl serif mb-4 font-bold">Luxury Sanctuary</h3>
              <p className="text-gray-500 leading-relaxed text-sm">A peaceful environment designed to lower stress levels from the moment you arrive.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 bg-[#FCF9F5]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h4 className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold mb-4">The Treatment Menu</h4>
              <h2 className="text-3xl md:text-5xl font-bold serif text-[#2D4F3E]">Curated Modalities.</h2>
            </div>
            <Link to="/services" className="hidden md:flex items-center gap-2 text-[#2D4F3E] font-bold text-sm hover:text-[#D4AF37] transition-colors">
              View All Treatments <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.slice(0, 4).map((service) => (
              <Link key={service.id} to={`/services#service-${service.id}`} className="group bg-white p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100">
                <div className="h-48 mb-6 overflow-hidden rounded-sm">
                  <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <h3 className="text-xl font-bold serif text-[#2D4F3E] mb-2">{service.name}</h3>
                <p className="text-gray-500 text-sm font-light mb-4 line-clamp-2">{service.description}</p>
                <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-xs uppercase tracking-widest">
                  Details <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h4 className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold mb-4">Client Voices</h4>
            <h2 className="text-3xl md:text-5xl font-bold serif text-[#2D4F3E]">Stories of Restoration.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="relative p-10 bg-[#FCF9F5] border border-gray-100">
                <div className="flex gap-1 mb-6">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" />)}
                </div>
                <p className="text-gray-600 italic mb-8 font-light leading-relaxed">"{t.reviewText}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-px bg-[#D4AF37]"></div>
                  <p className="font-bold text-[#2D4F3E] text-sm uppercase tracking-widest">{t.clientName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Map Section */}
      <section className="py-24 bg-[#2D4F3E] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold serif mb-8 leading-tight">Begin Your Path <br /> to Recovery.</h2>
              <div className="space-y-8 mb-12">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-[#D4AF37]">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Text or Call</p>
                    <p className="text-xl font-bold">{CONTACT_INFO.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-[#D4AF37]">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Sanctuary Location</p>
                    <p className="text-xl font-bold">{CONTACT_INFO.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-[#D4AF37]">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Email</p>
                    <p className="text-xl font-bold">{CONTACT_INFO.email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-10 shadow-2xl rounded-sm">
              <h3 className="text-2xl font-bold serif text-[#2D4F3E] mb-6 text-center">Inquiry Form</h3>
              <form action={CONTACT_INFO.formspreeEndpoint} method="POST" className="space-y-6">
                <input name="name" type="text" placeholder="Full Name" required className="w-full p-4 bg-gray-50 border border-gray-100 text-[#2D4F3E] text-sm focus:border-[#D4AF37] outline-none" />
                <input name="email" type="email" placeholder="Email Address" required className="w-full p-4 bg-gray-50 border border-gray-100 text-[#2D4F3E] text-sm focus:border-[#D4AF37] outline-none" />
                <textarea name="message" placeholder="How can we help you?" required className="w-full p-4 bg-gray-50 border border-gray-100 text-[#2D4F3E] text-sm h-32 focus:border-[#D4AF37] outline-none"></textarea>
                <button type="submit" className="w-full bg-[#D4AF37] text-white py-4 font-bold uppercase tracking-widest text-xs hover:bg-[#B89830] transition-all flex items-center justify-center gap-2">
                  <Send size={16} /> Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;