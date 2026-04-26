
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, Sparkles, MapPin, Home } from 'lucide-react';
import { SERVICES, ADD_ONS } from '../constants';

const Services: React.FC = () => {
  const fullServices = SERVICES.filter(s => !s.id.startsWith('m'));
  const miniServices = SERVICES.filter(s => s.id.startsWith('m'));

  return (
    <div className="pt-32 pb-24 bg-[#FCF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h4 className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold mb-4">Therapeutic Menu</h4>
          <h1 className="text-5xl md:text-6xl font-bold serif text-[#2D4F3E] mb-6">Intentional Wellness</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-light leading-relaxed">
            Choose between clinical restoration in our sanctuary or the luxury of convenience in your own home.
          </p>
        </div>

        {/* Core Services Section */}
        <div className="space-y-24 mb-32">
          {fullServices.map((service, idx) => (
            <div 
              key={service.id} 
              id={`service-${service.id}`}
              className={`flex flex-col ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-20 items-center bg-white p-6 lg:p-16 shadow-sm border border-gray-50 scroll-mt-32`}
            >
              <div className="w-full lg:w-5/12">
                <div className="relative">
                    <img src={service.image} alt={service.name} className="w-full h-[500px] object-cover rounded-sm shadow-xl" />
                    <div className={`absolute -bottom-6 ${idx % 2 === 0 ? '-right-6' : '-left-6'} bg-[#F5F5DC] w-32 h-32 -z-10`}></div>
                </div>
              </div>
              <div className="w-full lg:w-7/12">
                <div className="flex items-center gap-2 mb-4">
                  {service.name.includes('At Your Place') ? <Home size={16} className="text-[#D4AF37]" /> : <MapPin size={16} className="text-[#D4AF37]" />}
                  <span className="text-[#D4AF37] uppercase tracking-widest text-xs font-bold">{service.name.includes('At Your Place') ? 'At Your Place' : 'At the Clinic'}</span>
                </div>
                <h2 className="text-4xl font-bold serif text-[#2D4F3E] mb-6">{service.name}</h2>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg font-light">{service.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-3">
                        <h4 className="font-bold text-[#2D4F3E] text-sm uppercase tracking-wider flex items-center gap-2">
                            <Clock size={16} className="text-[#D4AF37]" /> Duration & Rates
                        </h4>
                        <div className="space-y-2">
                            {service.durationOptions.map(dur => (
                            <div key={dur} className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-gray-600 text-sm">{dur} Minutes</span>
                                <span className="text-[#2D4F3E] font-bold">${service.prices?.[dur] || service.basePrice}</span>
                            </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-bold text-[#2D4F3E] text-sm uppercase tracking-wider flex items-center gap-2">
                            <Sparkles size={16} className="text-[#D4AF37]" /> Recommended For
                        </h4>
                        <ul className="text-sm text-gray-500 space-y-2 italic">
                            {service.name.includes('Swedish') && <li>• Stress relief & anxiety reduction</li>}
                            {service.name.includes('Deep Tissue') && <li>• Chronic muscle tension</li>}
                            {service.name.includes('Sports') && <li>• Flexibility & ROM optimization</li>}
                            {service.name.includes('At Your Place') && <li>• Convenience & ultimate privacy</li>}
                        </ul>
                    </div>
                </div>

                <Link 
                  to="/booking" 
                  className="bg-[#2D4F3E] text-white px-10 py-4 font-bold hover:bg-[#3d6952] transition-all inline-flex items-center gap-3 uppercase tracking-widest text-xs shadow-lg"
                >
                  Reserve Session <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Mini Services Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h4 className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold mb-4">Targeted Relief</h4>
            <h2 className="text-4xl font-bold serif text-[#2D4F3E]">Mini Services</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto font-light">Short, concentrated sessions designed to focus on your specific problem areas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {miniServices.map((service) => (
              <div key={service.id} className="bg-white p-8 border border-gray-100 shadow-sm flex flex-col group hover:shadow-lg transition-all">
                <div className="h-48 mb-6 overflow-hidden rounded-sm relative">
                  <img src={service.image} alt={service.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 bg-[#2D4F3E] text-[#D4AF37] text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                    {service.durationOptions[0]} Min
                  </div>
                </div>
                <h3 className="text-xl font-bold serif text-[#2D4F3E] mb-3">{service.name}</h3>
                <p className="text-gray-500 text-sm font-light mb-6 flex-grow">{service.description}</p>
                <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                  <span className="text-[#2D4F3E] font-bold text-lg">${service.basePrice}</span>
                  <Link to="/booking" className="text-[#D4AF37] text-[10px] uppercase font-bold tracking-widest hover:text-[#2D4F3E] flex items-center gap-2">
                    Book Now <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhancements Section */}
        <section className="bg-[#2D4F3E] text-white p-10 lg:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32"></div>
          
          <div className="relative z-10">
            <div className="max-w-3xl mb-16">
                <h4 className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold mb-4">Elevate Your Care</h4>
                <h2 className="text-4xl font-bold serif mb-6">Enhancement Menu</h2>
                <p className="text-gray-300 font-light">Customized upgrades to target specific symptoms and deepen your level of recovery.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {ADD_ONS.map((addon) => (
                <div key={addon.id} className="group border-l border-white/10 pl-8 transition-all hover:border-[#D4AF37]">
                  <h4 className="text-xl font-bold mb-3 serif group-hover:text-[#D4AF37] transition-colors">{addon.name}</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">Specific therapeutic intent for maximum effectiveness.</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[#D4AF37] font-bold text-lg">+${addon.price}</span>
                    <span className="text-white/20 text-xs">per session</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Services;
