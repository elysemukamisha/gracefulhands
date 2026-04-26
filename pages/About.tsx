
import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_INFO, TEAM } from '../constants';
import { Sparkles, Heart, ShieldCheck, Award, Quote } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="pt-32 pb-24 bg-[#FCF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-20 animate-fade-in">
          <h4 className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold mb-4">The Visionary</h4>
          <h1 className="text-5xl md:text-6xl font-bold serif text-[#2D4F3E] mb-6">A Foundation of Care <br /> and Expertise.</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed italic">
            "Restoring Balance, One Touch at a Time."
          </p>
        </div>

        {/* Bio Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32 bg-white p-8 lg:p-16 border border-gray-50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5F5DC] opacity-30 -mr-16 -mt-16 rounded-full"></div>
          
          <div className="relative group">
            <div className="overflow-hidden rounded-sm shadow-2xl relative z-10">
                <img 
                src={TEAM[0].headshot} 
                alt={TEAM[0].name} 
                className="w-full h-[650px] object-cover transition-transform duration-700 group-hover:scale-105" 
                />
            </div>
            <div className="absolute -top-4 -left-4 w-full h-full border-2 border-[#D4AF37] -z-10 transition-all group-hover:-top-6 group-hover:-left-6"></div>
            <div className="absolute bottom-6 right-6 z-20 bg-[#2D4F3E] text-white p-4 shadow-xl">
               <p className="text-[10px] uppercase tracking-widest font-bold">Founder & Lead Therapist</p>
               <p className="serif text-xl">Aubine</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-px w-12 bg-[#D4AF37]"></div>
               <span className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold">Meet Your Therapist</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold serif text-[#2D4F3E] leading-tight">Welcome to Graceful Hands Therapeutic Massage</h2>
            
            <div className="space-y-6 text-gray-600 font-light leading-relaxed text-lg">
              <p>
                Graceful Hands was founded on a simple principle: that the human body has an incredible capacity to heal when given the right support. My journey into therapeutic massage was driven by a fascination with the body's resilience and a desire to provide clinical relief in a luxury setting.
              </p>
              <p>
                We specialize in therapeutic modalities that go beyond simple relaxation. By understanding anatomy and the science of muscle recovery, we target the root causes of discomfort—whether it's chronic tension, athletic strain, or the weight of daily stress.
              </p>
              <p>
                Here, you are not just an appointment slot; you are a guest whose well-being is my personal priority. I invite you to experience the intersection of skilled, intentional touch and profound restoration.
              </p>
            </div>

            <div className="pt-8 flex flex-wrap gap-4 items-center">
              <Link to="/booking" className="bg-[#2D4F3E] text-white px-10 py-4 font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-[#3d6952] transition-all">
                Reserve Your Session
              </Link>
              <a href="#values" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#D4AF37] transition-all">
                Our Core Values ↓
              </a>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div id="values" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center scroll-mt-32">
            <ValueCard 
              icon={<ShieldCheck size={28} className="text-[#D4AF37]" />} 
              title="Clinical Expertise" 
              desc="Deep understanding of anatomy and muscle recovery science applied to every stroke."
            />
            <ValueCard 
              icon={<Heart size={28} className="text-[#D4AF37]" />} 
              title="Individual Care" 
              desc="Every treatment plan is bespoke, designed around your specific recovery goals."
            />
            <ValueCard 
              icon={<Sparkles size={28} className="text-[#D4AF37]" />} 
              title="Luxury Setting" 
              desc="A sanctuary environment curated to lower cortisol levels from the moment you enter."
            />
             <ValueCard 
              icon={<Award size={28} className="text-[#D4AF37]" />} 
              title="Wellness First" 
              desc="We focus on long-term physical sustainability and proactive pain management."
            />
        </div>

        {/* Closing Section */}
        <div className="mt-32 relative py-20 px-4 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[#2D4F3E] -z-10 skew-y-1 transform scale-110"></div>
            <div className="max-w-3xl mx-auto">
                <Quote className="text-[#D4AF37] mx-auto mb-8 opacity-40" size={48} />
                <p className="text-2xl md:text-3xl serif italic text-white leading-relaxed mb-12">
                  "I believe that massage therapy is an essential practice for those who demand the best from their bodies. My goal is to ensure you leave feeling restored, rebalanced, and ready for whatever is next."
                </p>
                <div className="h-px w-24 bg-[#D4AF37] mx-auto"></div>
                <p className="mt-6 text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold">Aubine • Lead Therapist</p>
            </div>
        </div>
      </div>
    </div>
  );
};

const ValueCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center p-10 bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
    <div className="mb-6 p-4 bg-[#FCF9F5] rounded-full group-hover:bg-[#F5F5DC] transition-colors">{icon}</div>
    <h3 className="text-xl font-bold serif text-[#2D4F3E] mb-4">{title}</h3>
    <p className="text-gray-500 text-sm font-light leading-relaxed">{desc}</p>
  </div>
);

export default About;
