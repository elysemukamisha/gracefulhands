import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../lib/db';
import { CONTACT_INFO } from '../constants';
import { 
  Check, Calendar as CalendarIcon, Clock, 
  ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon,
  Sunrise, Loader2, CalendarRange, MousePointer2, Home, MapPin, Sparkles
} from 'lucide-react';

interface BookingSummary {
  firstName: string;
  anyPain: string;
  preferredDay: string;
  timing: 'Morning' | 'Evening';
}

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract pre-fill data from location state
  const prefill = location.state?.prefill as BookingSummary | null;
  const initialStep = location.state?.step || 1;

  const SERVICES = db.getServices();

  const [step, setStep] = useState(initialStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    serviceId: prefill ? '1' : '', // Default to signature for voice leads
    duration: prefill ? 60 : 0,
    date: null as Date | null,
    time: prefill ? (prefill.timing === 'Morning' ? '09:00' : '14:00') : '',
    name: prefill ? prefill.firstName : '',
    email: '',
    phone: '',
    pressure: 'Medium - Therapeutic',
    focus: prefill ? prefill.anyPain : '',
    medical: prefill ? `Preferred day: ${prefill.preferredDay}. Timing: ${prefill.timing}. Collected via AI Voice Support.` : '',
    consent: false
  });

  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  const handleServiceSelect = (id: string, dur: number) => {
    setFormData({ ...formData, serviceId: id, duration: dur, time: '' });
    setStep(2);
  };

  const currentService = SERVICES.find(s => s.id === formData.serviceId);
  
  const totalPrice = useMemo(() => {
    if (!currentService) return 0;
    return currentService.prices?.[formData.duration] || currentService.basePrice;
  }, [currentService, formData.duration]);

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const bookingPayload = {
      _subject: `Confirmed Clinical Booking: ${formData.name}`,
      client_name: formData.name,
      client_email: formData.email,
      client_phone: formData.phone,
      service: currentService?.name || 'TBD',
      duration: `${formData.duration} minutes`,
      date: formData.date?.toDateString() || (prefill ? `Target: ${prefill.preferredDay}` : 'To be confirmed'),
      time: formData.time,
      total_price: `$${totalPrice}`,
      preferred_pressure: formData.pressure,
      focus_areas: formData.focus || 'None specified',
      medical_notes: formData.medical || 'None provided',
      booking_source: prefill ? 'AI Voice Assistant (Confirmed)' : 'Website Form'
    };

    try {
      // Send clinical data to Formspree
      await fetch(CONTACT_INFO.formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
      });

      // Track locally
      db.addAppointment({
        id: Date.now().toString(),
        clientName: formData.name,
        email: formData.email,
        phone: formData.phone,
        serviceId: formData.serviceId,
        duration: formData.duration,
        date: formData.date?.toDateString() || 'Voice Lead - Pending Final Date',
        time: formData.time,
        status: 'Confirmed',
        totalPrice,
        createdAt: new Date().toISOString(),
        intakeDetails: {
          pressure: formData.pressure,
          focus: formData.focus,
          medical: formData.medical
        }
      });

      alert(`Restoration journey confirmed, ${formData.name}! We'll see you soon.`);
      navigate('/');
    } catch (err) {
      console.error('Submission failed', err);
      alert('Something went wrong. Please call us directly to book.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonthOrEarlier = useMemo(() => {
    const today = new Date();
    return currentCalendarMonth.getMonth() <= today.getMonth() && currentCalendarMonth.getFullYear() <= today.getFullYear();
  }, [currentCalendarMonth]);

  const getSlotsForDate = (date: Date, duration: number) => {
    if (isPastDate(date)) return [];
    
    const selectedDateStr = date.toDateString();
    const existingAppointments = db.getAppointments().filter(a => a.date === selectedDateStr && (a.status === 'Confirmed' || a.status === 'Pending'));
    
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const startHour = 8;
    const endHour = 18;
    const interval = 30;
    const slots: { time: string; available: boolean }[] = [];

    const now = new Date();
    const isTodayDate = date.toDateString() === now.toDateString();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    for (let m = startHour * 60; m <= endHour * 60 - duration; m += interval) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const slotStartTime = m;
      const slotEndTime = m + duration;

      if (isTodayDate && slotStartTime <= currentTimeInMinutes + 60) continue;

      const isConflict = existingAppointments.some(appt => {
        const apptStartTime = parseTime(appt.time);
        const apptEndTime = apptStartTime + appt.duration;
        return slotStartTime < apptEndTime && apptStartTime < slotEndTime;
      });

      slots.push({ time: timeStr, available: !isConflict });
    }
    return slots;
  };

  const monthAvailability = useMemo(() => {
    if (!formData.duration) return {};
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const availabilityMap: Record<string, 'Available' | 'Limited' | 'Full'> = {};

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      if (isPastDate(date)) continue;
      
      const slots = getSlotsForDate(date, formData.duration);
      const availableCount = slots.filter(s => s.available).length;

      if (availableCount === 0) availabilityMap[date.toDateString()] = 'Full';
      else if (availableCount <= 3) availabilityMap[date.toDateString()] = 'Limited';
      else availabilityMap[date.toDateString()] = 'Available';
    }
    return availabilityMap;
  }, [currentCalendarMonth, formData.duration]);

  const nextMonthDate = useMemo(() => {
    const next = new Date(currentCalendarMonth);
    next.setMonth(next.getMonth() + 1);
    return next;
  }, [currentCalendarMonth]);

  const calendarDays = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const currentMonthDays = useMemo(() => calendarDays(currentCalendarMonth), [currentCalendarMonth]);
  const nextMonthDays = useMemo(() => calendarDays(nextMonthDate), [nextMonthDate]);

  const timeSlots = useMemo(() => {
    if (!formData.date || !formData.duration) return { morning: [], afternoon: [] };
    const allSlots = getSlotsForDate(formData.date, formData.duration);
    return {
      morning: allSlots.filter(s => parseInt(s.time.split(':')[0]) < 12),
      afternoon: allSlots.filter(s => parseInt(s.time.split(':')[0]) >= 12)
    };
  }, [formData.date, formData.duration]);

  return (
    <div className="pt-32 pb-24 bg-[#FCF9F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-center mb-16 relative max-w-2xl mx-auto px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all relative
                ${step >= s ? 'bg-[#2D4F3E] text-white shadow-lg border-2 border-[#D4AF37]' : 'bg-white text-gray-400 border border-gray-200'}`}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
          ))}
        </div>

        <div className="bg-white shadow-2xl rounded-sm overflow-hidden flex flex-col lg:flex-row border border-gray-100 min-h-[750px]">
          <div className="lg:w-1/4 bg-[#2D4F3E] text-white p-10 border-r border-white/5">
             <h4 className="text-[#D4AF37] uppercase tracking-[0.3em] text-[10px] font-bold mb-8">Reservation</h4>
             {currentService ? (
               <div className="space-y-8 animate-fade-in">
                  <div>
                    <h3 className="text-xl font-bold serif mb-2">{currentService.name}</h3>
                    <p className="text-gray-400 text-[10px] uppercase tracking-widest">{formData.duration} Minutes • ${totalPrice}</p>
                  </div>
                  {(formData.date || prefill) && (
                    <div className="flex items-center gap-4 py-4 border-y border-white/10">
                       <CalendarIcon className="text-[#D4AF37]" size={16} />
                       <div>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</p>
                         <p className="text-sm font-bold">
                           {formData.date ? formData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : (prefill?.preferredDay || 'TBD')}
                         </p>
                       </div>
                    </div>
                  )}
                  {formData.time && (
                    <div className="flex items-center gap-4 py-4 border-b border-white/10 mt-[-1px]">
                       <Clock className="text-[#D4AF37]" size={16} />
                       <div>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Time</p>
                         <p className="text-sm font-bold">{formData.time}</p>
                       </div>
                    </div>
                  )}
                  {prefill && (
                    <div className="pt-6">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold mb-3">AI Assistant Prefill</p>
                      <div className="bg-white/5 p-4 rounded-sm border border-white/10 italic text-xs text-gray-300">
                        "Pre-filled with your details from our voice chat. Please complete the final form below."
                      </div>
                    </div>
                  )}
                  <div className="pt-8 space-y-4">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold">Key Indicators</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
                      High Demand (1-3 slots left)
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                      Standard Availability
                    </div>
                  </div>
               </div>
             ) : (
               <div className="space-y-4 opacity-30 italic text-sm">
                 <p>Select a treatment to begin.</p>
               </div>
             )}
          </div>

          <div className="flex-grow p-6 md:p-12 overflow-y-auto">
            {step === 1 && (
              <div className="animate-fade-in space-y-12">
                <header>
                  <h2 className="text-3xl font-bold serif text-[#2D4F3E]">1. Choose Treatment</h2>
                  <p className="text-gray-400 text-sm">Select from clinic sessions, mobile home visits, or targeted mini treatments.</p>
                </header>

                <div className="space-y-12">
                  {/* Category Sections */}
                  {['Clinic & Mobile Sessions', 'Mini Targeted Services'].map((cat, catIdx) => (
                    <div key={cat} className="space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] border-b border-gray-100 pb-2">{cat}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {SERVICES.filter(s => (catIdx === 0 ? !s.id.startsWith('m') : s.id.startsWith('m'))).map(service => (
                          <div key={service.id} className="border border-gray-100 p-6 hover:border-[#D4AF37] transition-all rounded-sm bg-gray-50/30 flex flex-col gap-6 group relative">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-[#2D4F3E] serif">{service.name}</h3>
                              <div className="text-[#D4AF37]">
                                {service.name.includes('Place') ? <Home size={16} /> : <MapPin size={16} />}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {service.durationOptions.map(dur => (
                                <button 
                                  key={dur} onClick={() => handleServiceSelect(service.id, dur)}
                                  className="bg-white border border-gray-100 hover:border-[#2D4F3E] hover:text-[#2D4F3E] px-4 py-2 font-bold text-[9px] uppercase tracking-widest transition-all shadow-sm"
                                >
                                  {dur}m • ${service.prices?.[dur] || service.basePrice}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in space-y-10">
                <header className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-bold serif text-[#2D4F3E]">2. Secure Timing</h2>
                    <p className="text-gray-400 text-sm">Select a date. <span className="text-[#D4AF37]">Gold dots</span> indicate limited sessions remaining.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setCurrentCalendarMonth(new Date())} 
                      className="text-[9px] uppercase font-bold tracking-widest text-[#D4AF37] hover:underline"
                    >
                      Reset to Today
                    </button>
                  </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
                   <div className="xl:col-span-3 space-y-8">
                     <div className="bg-white p-8 rounded-sm border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                           <h4 className="font-bold serif text-[#2D4F3E] text-xl flex items-center gap-3">
                             {currentCalendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                           </h4>
                           <div className="flex gap-2">
                              <button 
                                disabled={isCurrentMonthOrEarlier}
                                className={`p-2 rounded-full transition-all border border-gray-100 ${isCurrentMonthOrEarlier ? 'opacity-20 cursor-not-allowed' : 'hover:bg-gray-50'}`} 
                                onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1))}
                              >
                                <ChevronLeftIcon size={16}/>
                              </button>
                              <button 
                                className="p-2 hover:bg-gray-50 rounded-full transition-all border border-gray-100" 
                                onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1))}
                              >
                                <ChevronRightIcon size={16}/>
                              </button>
                           </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-4">
                          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                           {currentMonthDays.map((d, i) => {
                             if (!d) return <div key={i}></div>;
                             const status = monthAvailability[d.toDateString()];
                             const isSelected = formData.date?.toDateString() === d.toDateString();
                             const past = isPastDate(d);
                             const today = isToday(d);
                             
                             return (
                               <button 
                                 key={i} 
                                 disabled={past || status === 'Full'}
                                 onClick={() => setFormData({...formData, date: d, time: ''})}
                                 className={`group relative flex flex-col items-center justify-center aspect-square text-[11px] font-bold rounded-sm transition-all
                                   ${isSelected ? 'bg-[#2D4F3E] text-white shadow-xl scale-110 z-10' : 
                                     past ? 'text-gray-200 cursor-not-allowed opacity-25' : 
                                     status === 'Full' ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 
                                     'hover:bg-[#F5F5DC] text-[#2D4F3E] border border-gray-50'}
                                   ${today && !isSelected ? 'border-2 border-[#D4AF37]/50' : ''}`}
                               >
                                 {d.getDate()}
                                 {status === 'Limited' && !isSelected && !past && (
                                   <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_4px_#D4AF37]"></div>
                                 )}
                               </button>
                             );
                           })}
                        </div>
                     </div>

                     <div className="bg-gray-50/50 p-6 rounded-sm border border-dashed border-gray-200 group transition-all hover:bg-white hover:shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <CalendarRange size={14}/> Preview {nextMonthDate.toLocaleString('default', { month: 'long' })}
                          </p>
                        </div>
                        <div className="grid grid-cols-7 gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                           {nextMonthDays.slice(0, 14).map((d, i) => d ? (
                             <div key={i} className={`aspect-square flex items-center justify-center text-[9px] border border-gray-100 rounded-sm ${isPastDate(d) ? 'opacity-25' : ''}`}>
                               {d.getDate()}
                             </div>
                           ) : <div key={i}></div>)}
                        </div>
                     </div>
                   </div>

                   <div className="xl:col-span-2 space-y-8 h-full flex flex-col">
                      {formData.date ? (
                        <div className="flex-grow space-y-8 animate-fade-in">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-4 flex items-center gap-2"><Sunrise size={14}/> Morning</p>
                            <div className="grid grid-cols-2 gap-2">
                              {timeSlots.morning.map(t => (
                                <button 
                                  key={t.time} 
                                  disabled={!t.available}
                                  onClick={() => setFormData({...formData, time: t.time})}
                                  className={`p-3 border text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm
                                    ${!t.available ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed opacity-50' : 
                                      formData.time === t.time ? 'bg-[#2D4F3E] text-white border-[#2D4F3E] shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-[#D4AF37]'}`}
                                >
                                  {t.time}
                                </button>
                              ))}
                              {timeSlots.morning.length === 0 && <p className="text-[10px] text-gray-300 italic">Fully booked.</p>}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] mb-4 flex items-center gap-2"><Sunrise size={14} className="rotate-180"/> Afternoon</p>
                            <div className="grid grid-cols-2 gap-2">
                              {timeSlots.afternoon.map(t => (
                                <button 
                                  key={t.time} 
                                  disabled={!t.available}
                                  onClick={() => setFormData({...formData, time: t.time})}
                                  className={`p-3 border text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm
                                    ${!t.available ? 'bg-gray-50 text-gray-200 border-gray-100 cursor-not-allowed opacity-50' : 
                                      formData.time === t.time ? 'bg-[#2D4F3E] text-white border-[#2D4F3E] shadow-md' : 'bg-white text-gray-500 border-gray-100 hover:border-[#D4AF37]'}`}
                                >
                                  {t.time}
                                </button>
                              ))}
                              {timeSlots.afternoon.length === 0 && <p className="text-[10px] text-gray-300 italic">Fully booked.</p>}
                            </div>
                          </div>
                          {formData.time && (
                            <button 
                                onClick={() => setStep(3)}
                                className="w-full bg-[#D4AF37] text-white py-4 font-bold uppercase tracking-widest text-xs rounded-sm shadow-xl hover:bg-[#B89830] transition-all flex items-center justify-center gap-2"
                            >
                                Continue Intake <ChevronRightIcon size={16}/>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-100 rounded-sm opacity-40">
                           <MousePointer2 className="mb-4 text-gray-300 animate-bounce" size={32} />
                           <p className="text-sm font-light text-gray-500 italic">Select a date from the calendar to view available slots.</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-12">
                <header>
                  <h2 className="text-3xl font-bold serif text-[#2D4F3E]">3. Intake Details</h2>
                  <p className="text-gray-400 text-sm">We use this information to customize your clinical treatment plan.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Preferred Pressure</label>
                      <div className="grid grid-cols-1 gap-3">
                         {['Light - Relaxation', 'Medium - Therapeutic', 'Firm - Deep Tissue', 'Variable - Myofascial'].map(p => (
                           <button 
                             key={p} onClick={() => setFormData({...formData, pressure: p})}
                             className={`p-4 text-left text-xs font-medium border transition-all rounded-sm
                               ${formData.pressure === p ? 'border-[#D4AF37] bg-[#F5F5DC] text-[#2D4F3E] font-bold' : 'border-gray-100 hover:border-[#F5F5DC] text-gray-500'}`}
                           >
                             {p}
                           </button>
                         ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Focus Areas</label>
                      <textarea 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm h-[140px] leading-relaxed"
                        placeholder="e.g., Lower back tightness, right shoulder tension, tension headaches..."
                        value={formData.focus} onChange={e => setFormData({...formData, focus: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Medical Considerations</label>
                      <textarea 
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm h-[100px] leading-relaxed"
                        placeholder="Recent injuries, surgeries, or specific conditions we should know about."
                        value={formData.medical} onChange={e => setFormData({...formData, medical: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-8 border-t border-gray-50">
                  <button 
                    onClick={() => setStep(4)}
                    className="bg-[#2D4F3E] text-white px-12 py-4 font-bold uppercase tracking-widest text-xs rounded-sm shadow-xl hover:bg-[#3d6952] transition-all flex items-center gap-3"
                  >
                    Guest Information <ChevronRightIcon size={16}/>
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in space-y-12">
                 <header>
                  <h2 className="text-3xl font-bold serif text-[#2D4F3E]">4. Guest Information</h2>
                  <p className="text-gray-400 text-sm">Please provide your contact details to finalize your reservation request.</p>
                </header>

                <form onSubmit={handleFinalSubmit} className="space-y-10 max-w-2xl">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                        <input 
                          type="text" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm"
                          value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
                        <input 
                          type="tel" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm font-mono"
                          value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                      <input 
                        type="email" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm"
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                   </div>

                   <div className="bg-[#FCF9F5] p-6 border border-gray-100 rounded-sm">
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input 
                          type="checkbox" required className="mt-1 w-4 h-4 rounded-sm border-gray-300 text-[#D4AF37] focus:ring-[#D4AF37]"
                          checked={formData.consent} onChange={e => setFormData({...formData, consent: e.target.checked})}
                        />
                        <span className="text-xs text-gray-500 leading-relaxed italic">
                          I understand that this is a reservation request. The appointment is not finalized until confirmed by Graceful Hands. I agree to the 24-hour cancellation policy.
                        </span>
                      </label>
                   </div>

                   <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#D4AF37] text-white py-5 font-bold uppercase tracking-[0.2em] text-xs rounded-sm shadow-2xl hover:bg-[#B89830] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {isSubmitting ? 'Finalizing Request...' : 'Finalize Reservation'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => step > 1 && setStep(step - 1)}
          className={`mt-12 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all
            ${step === 1 ? 'text-gray-200 cursor-not-allowed' : 'text-[#D4AF37] hover:text-[#2D4F3E]'}`}
        >
          <ChevronLeftIcon size={16}/> Previous Step
        </button>
      </div>
    </div>
  );
};

export default Booking;