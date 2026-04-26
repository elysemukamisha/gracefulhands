import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { MessageCircle, X, Send, Loader2, CheckCircle, Phone } from 'lucide-react';
import { db } from '../lib/db';
import { CONTACT_INFO } from '../constants';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface GeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown>; id?: string };
  functionResponse?: { name: string; response: unknown; id?: string };
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

const NOW_STR = new Date().toLocaleString('en-CA', {
  timeZone: 'America/Edmonton',
  dateStyle: 'full',
  timeStyle: 'short',
});

const RACHEL_SYSTEM_PROMPT = `You are Rachel, the AI receptionist at Graceful Hands Therapeutic Massage — a professional, home-based clinical practice serving South Edmonton (Chappelle and surrounding areas). The therapist is Aubine Matala, RMT.

Current date/time: ${NOW_STR}
Timezone: America/Edmonton

YOUR PERSONALITY:
- Warm, empathetic, and professional
- Mirror the caller's energy — gentle if they're in pain, calm if seeking relaxation
- Ask ONE question at a time and WAIT for the answer
- Keep responses concise (under 40 words when possible)
- Use natural filler phrases like "I can certainly help with that" or "Let me take a look at the schedule"

SERVICES & PRICING:
- Therapeutic Massage (chronic pain, injury recovery, deep tissue): 60min $110, 75min $135, 90min $150
- Relaxation Massage (stress relief, Swedish): 60min $110, 75min $135, 90min $150
- Prenatal Massage (expectant mothers): 60min $110, 75min $135, 90min $150
- Sports & Performance: 60min $110, 75min $135, 90min $150
- At-Home/Mobile Sessions: 60min $130, 75min $155, 90min $170
- Mini Targeted Sessions (30–45min): $65–$85

BUSINESS HOURS (America/Edmonton timezone):
- Monday–Friday: 9:00 AM – 7:00 PM
- Saturday: 10:00 AM – 4:00 PM
- Sunday: CLOSED

BOOKING FLOW — ask ONE question at a time in this exact order:
1. What type of service? (Therapeutic / Relaxation / Prenatal / Sports)
2. Session length: 60, 75, or 90 minutes?
3. Confirm they're in South Edmonton / Heritage Valley / Chappelle area
4. Main area of concern ("Is this for a specific injury, or general relaxation?")
5. Extended health benefits? ("Do you have extended health benefits? We provide receipts for insurance reimbursement.")
6. Full name
7. Phone number
8. Email address
9. Preferred date and time
10. ALWAYS call checkAvailability before booking to verify the slot
11. If available → call bookAppointment with all collected details
12. If not available → share the available slots from the tool result and ask which they prefer, then book

RULES:
- NEVER give medical diagnoses — say "Aubine will do a full assessment during your session"
- NEVER offer non-therapeutic services — strictly professional clinical practice
- Direct billing is available for most major insurance providers; if unsure say "Aubine will provide a receipt you can submit to your provider"
- If caller wants to speak to the therapist, offer to have Aubine call them back between sessions
- Always confirm: "You'll be seeing Aubine Matala, RMT"
- After successful booking, confirm the appointment details and mention a confirmation email has been sent`;

const RACHEL_TOOLS = [
  {
    name: 'checkAvailability',
    description: 'Check if a specific date/time slot is available. Returns the list of available slots for that day.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
        time: { type: Type.STRING, description: 'Requested time in HH:MM 24-hour format (e.g. 16:00 for 4 PM)' },
        duration: { type: Type.NUMBER, description: 'Session duration in minutes (60, 75, or 90)' },
      },
      required: ['date', 'time', 'duration'],
    },
  },
  {
    name: 'bookAppointment',
    description: 'Book a confirmed appointment. Call this ONLY after checkAvailability confirms the slot is free and you have collected: name, phone, email, service, duration, date, time.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: { type: Type.STRING, description: 'Full name of the client' },
        phone: { type: Type.STRING },
        email: { type: Type.STRING },
        serviceType: { type: Type.STRING, description: 'e.g. Therapeutic Massage, Relaxation Massage, Prenatal Massage, Sports & Performance' },
        duration: { type: Type.NUMBER, description: 'Session duration in minutes' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
        time: { type: Type.STRING, description: 'Time in HH:MM 24-hour format' },
        painPoints: { type: Type.STRING, description: 'Main area of concern or reason for visit' },
        hasInsurance: { type: Type.BOOLEAN, description: 'Whether the client has extended health benefits' },
      },
      required: ['clientName', 'phone', 'email', 'serviceType', 'duration', 'date', 'time'],
    },
  },
  {
    name: 'logLead',
    description: 'Log a lead once name, phone and email are collected — even if appointment booking is not yet complete.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: { type: Type.STRING },
        phone: { type: Type.STRING },
        email: { type: Type.STRING },
        serviceInterest: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ['clientName', 'phone', 'email'],
    },
  },
];

const SERVICE_MAP: Record<string, string> = {
  therapeutic: '2',
  relaxation: '1',
  prenatal: '1',
  sports: '3',
  deep: '2',
  swedish: '1',
  mobile: '4',
};

const resolveServiceId = (serviceType: string): string => {
  const lower = serviceType.toLowerCase();
  for (const [key, id] of Object.entries(SERVICE_MAP)) {
    if (lower.includes(key)) return id;
  }
  return '1';
};

const GREETING = "Graceful Hands Therapeutic Massage, Rachel speaking. How can I help you feel better today?";

const RachelChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<GeminiContent[]>([]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addMessage = (role: 'assistant' | 'user', content: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), role, content }]);
  };

  const executeFunction = useCallback(async (name: string, args: Record<string, unknown>): Promise<unknown> => {
    if (name === 'checkAvailability') {
      const { date, time, duration } = args as { date: string; time: string; duration: number };
      const slots = db.getAvailableSlots(date, duration);
      const isAvailable = slots.includes(time);
      return { available: isAvailable, requestedTime: time, availableSlots: slots.slice(0, 12), date };
    }

    if (name === 'bookAppointment') {
      const {
        clientName, phone, email, serviceType, duration, date, time, painPoints, hasInsurance
      } = args as {
        clientName: string; phone: string; email: string; serviceType: string;
        duration: number; date: string; time: string; painPoints?: string; hasInsurance?: boolean;
      };

      const [year, month, day] = date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const dateString = dateObj.toDateString();

      const serviceId = resolveServiceId(serviceType);
      const service = db.getServices().find(s => s.id === serviceId) || db.getServices()[0];
      const price = service.prices?.[duration] || service.basePrice;

      const appointmentId = Date.now().toString();
      db.addAppointment({
        id: appointmentId,
        clientName,
        email,
        phone,
        serviceId: service.id,
        duration,
        date: dateString,
        time,
        status: 'Confirmed',
        totalPrice: price,
        createdAt: new Date().toISOString(),
        intakeDetails: {
          pressure: 'Medium - Therapeutic',
          focus: painPoints || '',
          medical: hasInsurance ? 'Client has extended health benefits.' : '',
        },
      });

      db.addLead({
        id: appointmentId + '_lead',
        name: clientName,
        phone,
        email,
        serviceType,
        painPoints: painPoints || '',
        hasInsurance: !!hasInsurance,
        status: 'Booked',
        createdAt: new Date().toISOString(),
        notes: `Booked via Rachel AI Chat. ${service.name} ${duration}min on ${dateString} at ${time}.`,
      });

      // Send email notification via Formspree
      try {
        await fetch(CONTACT_INFO.formspreeEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: `New Booking (Rachel AI): ${clientName} — ${dateString} at ${time}`,
            _replyto: email,
            client_name: clientName,
            client_email: email,
            client_phone: phone,
            service: service.name,
            duration: `${duration} minutes`,
            date: dateString,
            time,
            price: `$${price}`,
            focus_areas: painPoints || 'Not specified',
            insurance: hasInsurance ? 'Yes' : 'No',
            booking_source: 'Rachel AI Chat Receptionist',
          }),
        });
      } catch (_) { /* silently fail — booking is already saved locally */ }

      setIsBooked(true);
      return {
        success: true,
        appointmentId,
        confirmationDetails: {
          clientName,
          service: service.name,
          duration: `${duration} minutes`,
          date: dateString,
          time,
          price: `$${price}`,
          therapist: 'Aubine Matala, RMT',
        },
      };
    }

    if (name === 'logLead') {
      const { clientName, phone, email, serviceInterest, notes } = args as {
        clientName: string; phone: string; email: string; serviceInterest?: string; notes?: string;
      };
      db.addLead({
        id: Date.now().toString() + '_lead',
        name: clientName,
        phone,
        email,
        serviceType: serviceInterest || '',
        painPoints: '',
        hasInsurance: false,
        status: 'New',
        createdAt: new Date().toISOString(),
        notes: notes || 'Logged via Rachel AI Chat.',
      });
      return { success: true };
    }

    return { error: 'Unknown function' };
  }, []);

  const getFunctionCall = (response: any) => {
    // Try response.functionCalls (newer SDK)
    if (Array.isArray(response.functionCalls) && response.functionCalls.length > 0) {
      return response.functionCalls[0];
    }
    // Fallback: parse candidates parts
    const parts: any[] = response.candidates?.[0]?.content?.parts || [];
    const fc = parts.find((p: any) => p.functionCall);
    return fc?.functionCall || null;
  };

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    addMessage('user', userText);
    setInputValue('');
    setIsLoading(true);

    historyRef.current.push({ role: 'user', parts: [{ text: userText }] });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      let iterations = 0;
      let finalText = '';

      while (iterations < 6 && !finalText) {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: historyRef.current,
          config: {
            systemInstruction: RACHEL_SYSTEM_PROMPT,
            tools: [{ functionDeclarations: RACHEL_TOOLS }],
          },
        });

        const fc = getFunctionCall(response);

        if (fc) {
          // Add model's function call turn to history
          historyRef.current.push({
            role: 'model',
            parts: [{ functionCall: { name: fc.name, args: fc.args, id: fc.id } }],
          });

          const result = await executeFunction(fc.name, fc.args as Record<string, unknown>);

          // Add function response turn
          historyRef.current.push({
            role: 'user',
            parts: [{ functionResponse: { name: fc.name, response: result, id: fc.id } }],
          });
        } else {
          finalText = typeof response.text === 'string'
            ? response.text
            : (response.candidates?.[0]?.content?.parts?.filter((p: any) => p.text).map((p: any) => p.text).join('') || '');

          historyRef.current.push({ role: 'model', parts: [{ text: finalText }] });
        }

        iterations++;
      }

      if (finalText) addMessage('assistant', finalText);
    } catch (err) {
      console.error('Rachel chat error:', err);
      addMessage('assistant', `I apologize, I'm experiencing a technical issue. Please call us directly at ${CONTACT_INFO.phone} and we'll be happy to assist you.`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, executeFunction]);

  const openChat = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      addMessage('assistant', GREETING);
      historyRef.current = [{ role: 'model', parts: [{ text: GREETING }] }];
    }
  };

  const closeChat = () => setIsOpen(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={openChat}
          aria-label="Chat with Rachel, AI Receptionist"
          className="fixed bottom-6 right-6 z-50 bg-[#2D4F3E] text-white rounded-full shadow-2xl hover:bg-[#3d6952] transition-all hover:scale-105 flex items-center gap-3 px-5 py-4 group"
        >
          <MessageCircle size={22} className="text-[#D4AF37] shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest pr-1">Book with Rachel</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[370px] bg-white shadow-2xl rounded-sm border border-gray-100 flex flex-col overflow-hidden" style={{ maxHeight: '620px' }}>
          {/* Header */}
          <div className="bg-[#2D4F3E] px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                <Phone size={16} className="text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Rachel</p>
                <p className="text-gray-400 text-[9px] uppercase tracking-widest">AI Receptionist · Graceful Hands</p>
              </div>
            </div>
            <button onClick={closeChat} className="text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FCF9F5]" style={{ minHeight: '280px', maxHeight: '440px' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed shadow-sm rounded-sm
                    ${msg.role === 'user'
                      ? 'bg-[#2D4F3E] text-white'
                      : 'bg-white text-gray-700 border border-gray-100'
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 px-4 py-3 rounded-sm shadow-sm flex items-center gap-2 text-gray-400">
                  <Loader2 size={13} className="animate-spin text-[#D4AF37]" />
                  <span className="text-xs italic">Rachel is typing…</span>
                </div>
              </div>
            )}

            {isBooked && (
              <div className="bg-[#2D4F3E]/5 border border-[#2D4F3E]/20 p-4 rounded-sm flex items-start gap-3 mt-2">
                <CheckCircle size={17} className="text-[#2D4F3E] mt-0.5 shrink-0" />
                <p className="text-xs text-[#2D4F3E] font-medium leading-relaxed">
                  Appointment confirmed! A notification has been sent and you'll receive a reminder before your session.
                </p>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message…"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-sm text-sm focus:border-[#D4AF37] outline-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim()}
                className="p-3 bg-[#D4AF37] text-white rounded-sm hover:bg-[#B89830] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="text-[9px] text-gray-300 text-center mt-2 uppercase tracking-widest">
              Graceful Hands AI · {CONTACT_INFO.phone}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default RachelChat;
