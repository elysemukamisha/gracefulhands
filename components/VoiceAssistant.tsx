
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { Mic, MicOff, X, Loader2, Sparkles, Phone, Calendar, AlertCircle } from 'lucide-react';
import { CONTACT_INFO } from '../constants';

const VAPI_PUBLIC_KEY = '80e574b9-ee43-4516-a298-7b09c8c1cc32';

interface BookingSummary {
  firstName: string;
  anyPain: string;
  preferredDay: string;
  timing: 'Morning' | 'Evening';
}

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCollected: (summary: BookingSummary) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isOpen, onClose, onBookingCollected }) => {
  const [isActive, setIsActive]       = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted]         = useState(false);
  const [volume, setVolume]           = useState(0);
  const [transcript, setTranscript]   = useState('');
  const [error, setError]             = useState<string | null>(null);

  const vapiRef = useRef<Vapi | null>(null);

  const now = new Date().toLocaleString('en-CA', {
    timeZone: 'America/Edmonton',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const SYSTEM_PROMPT = `You are Rachel, the AI voice receptionist for Graceful Hands Therapeutic Massage — a professional, home-based clinical practice in South Edmonton (Chappelle/Heritage Valley area). The therapist is Aubine Matala, RMT.

YOUR PERSONALITY:
- Warm, empathetic, and professional — you sound like someone dedicated to health and wellness.
- Ask ONE question at a time and wait for the answer.
- Mirror the caller's energy: if they are in pain, be gentle; if they are looking for relaxation, be calm.
- Keep responses concise (under 30 words when possible).
- Use natural phrases: "I can certainly help with that", "Let me take a look at the schedule", "Absolutely."

CURRENT DATE/TIME: ${now} (America/Edmonton timezone)
BUSINESS HOURS: Monday–Friday 9AM–7PM, Saturday 10AM–4PM, Sunday closed.

SERVICES & PRICING:
- Therapeutic Massage (chronic pain, injury recovery, deep tissue): 60m $110 / 75m $135 / 90m $150
- Relaxation/Swedish Massage (stress relief): 60m $110 / 75m $135 / 90m $150
- Prenatal Massage (expectant mothers): 60m $110 / 75m $135 / 90m $150
- Sports & Performance: 60m $110 / 75m $135 / 90m $150
- Mobile At-Home Sessions: 60m $130 / 75m $155 / 90m $170
- Mini Targeted Sessions: 30m $65 / 45m $85
- Direct billing available for most major insurance providers.

CALL FLOW — ask ONE question at a time:
1. Greet warmly (use the greeting above).
2. Find out which service and session length they are interested in.
3. Confirm they are in South Edmonton / Heritage Valley / Chappelle area.
4. Ask: "Are we working on a specific injury or area of concern today, or is this more for general relaxation?"
5. Ask: "Do you have extended health benefits? We provide receipts for easy insurance reimbursement."
6. Collect first name, phone number, then email address.
7. Offer available appointment times and confirm their preferred day/time.
8. Confirm: "You're all set! Aubine Matala, RMT, will be seeing you. We look forward to helping you feel your best."
9. Thank them and close warmly.

RULES:
- NEVER give medical diagnoses — say "Aubine will perform a full assessment during your session."
- NEVER offer non-therapeutic services. Strictly professional clinical practice.
- If schedule is full for same-day, offer the next available opening.
- If caller wants to speak to Aubine, say "Aubine is currently with a client. I can arrange a callback between sessions."
- If unsure about insurance, say "Aubine will provide a detailed receipt you can submit to your provider."
- Location: ${CONTACT_INFO.address}. Phone: ${CONTACT_INFO.phone}.`;

  const stopCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    setIsActive(false);
    setIsConnecting(false);
    setIsMuted(false);
    setVolume(0);
  }, []);

  useEffect(() => {
    if (!isOpen) stopCall();
  }, [isOpen, stopCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { vapiRef.current?.stop(); };
  }, []);

  const startCall = async () => {
    setError(null);
    setTranscript('');
    setIsConnecting(true);

    try {
      const vapi = new Vapi(VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setIsConnecting(false);
        setIsActive(true);
      });

      vapi.on('call-end', () => {
        setIsActive(false);
        setIsConnecting(false);
        setVolume(0);
      });

      vapi.on('speech-start', () => setVolume(1));
      vapi.on('speech-end',   () => setVolume(0));

      vapi.on('volume-level', (v: number) => setVolume(v));

      vapi.on('message', (msg: any) => {
        // Capture transcripts
        if (msg.type === 'transcript' && msg.transcript) {
          setTranscript(prev => prev + (prev ? ' ' : '') + msg.transcript);
        }
        // Handle booking summary tool call if configured in Vapi dashboard
        if (msg.type === 'function-call' && msg.functionCall?.name === 'showBookingSummary') {
          onBookingCollected(msg.functionCall.parameters as BookingSummary);
        }
      });

      vapi.on('error', (err: any) => {
        console.error('[Vapi error]', err);
        const msg = err?.error?.message || '';
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('microphone')) {
          setError('Microphone access denied. Please allow microphone permission and try again.');
        } else if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('auth')) {
          setError('Service unavailable. Please try again or call us directly.');
        } else {
          setError('Could not connect. Please try again or call ' + CONTACT_INFO.phone);
        }
        setIsActive(false);
        setIsConnecting(false);
      });

      await vapi.start({
        name: 'Rachel',
        firstMessage: 'Graceful Hands Therapeutic Massage, Rachel speaking. How can I help you feel better today?',
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en-US',
        },
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }],
          temperature: 0.6,
        },
        voice: {
          provider: 'openai',
          voiceId: 'nova',
        },
      } as any);

    } catch (err: any) {
      console.error('[Vapi startCall]', err);
      setError('Could not start call. Please try again or call ' + CONTACT_INFO.phone);
      setIsConnecting(false);
    }
  };

  const toggleMute = () => {
    if (!vapiRef.current) return;
    const next = !isMuted;
    vapiRef.current.setMuted(next);
    setIsMuted(next);
  };

  // Volume bar heights (5 bars)
  const bars = [0.4, 0.7, 1.0, 0.7, 0.4];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D4F3E]/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden border border-white/20">

        {/* Header */}
        <div className="bg-[#2D4F3E] p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#D4AF37]" size={20} />
            <div>
              <h2 className="text-xl font-bold serif text-white">Rachel — AI Receptionist</h2>
              <p className="text-white/50 text-xs uppercase tracking-widest">Graceful Hands Therapeutic Massage</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 min-h-[400px] flex flex-col justify-between">
          <div className="flex-grow flex flex-col justify-center">

            {/* Idle */}
            {!isActive && !isConnecting && !error && (
              <div className="text-center space-y-6 py-8">
                <div className="w-24 h-24 bg-[#FCF9F5] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Mic size={40} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold serif text-[#2D4F3E]">Speak with Rachel</h3>
                  <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                    Ask about pricing, services, or book an appointment — all by voice.
                  </p>
                </div>
                <button
                  onClick={startCall}
                  className="bg-[#D4AF37] text-white px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-[#B89830] transition-all shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Phone size={16} /> Call Rachel Now
                </button>
              </div>
            )}

            {/* Connecting */}
            {isConnecting && (
              <div className="text-center py-16">
                <Loader2 className="animate-spin mx-auto text-[#D4AF37] mb-4" size={48} />
                <p className="text-[#2D4F3E] serif italic animate-pulse">Connecting to Rachel...</p>
              </div>
            )}

            {/* Active */}
            {isActive && (
              <div className="space-y-8 animate-fade-in">
                {/* Avatar with voice visualiser */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {volume > 0 && (
                      <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full animate-ping" />
                    )}
                    <div className="relative w-24 h-24 bg-[#2D4F3E] rounded-full flex items-center justify-center shadow-2xl">
                      {isMuted
                        ? <MicOff size={36} className="text-red-400" />
                        : <Mic size={36} className="text-[#D4AF37]" />
                      }
                    </div>
                  </div>

                  {/* Volume bars */}
                  <div className="flex items-end gap-1 h-8">
                    {bars.map((scale, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-[#D4AF37] rounded-full transition-all duration-100"
                        style={{ height: `${Math.max(4, volume * scale * 32)}px`, opacity: volume > 0 ? 1 : 0.25 }}
                      />
                    ))}
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-bold serif text-[#2D4F3E]">
                      {isMuted ? 'Microphone Muted' : 'Rachel is Listening'}
                    </h3>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Live AI Receptionist · Powered by Vapi</p>
                  </div>
                </div>

                {/* Transcript */}
                {transcript && (
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 max-h-32 overflow-y-auto">
                    <p className="text-sm text-gray-600 italic leading-relaxed">{transcript}</p>
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={toggleMute}
                    className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest border transition-all ${
                      isMuted
                        ? 'bg-red-500 text-white border-red-500'
                        : 'border-gray-300 text-gray-600 hover:border-[#2D4F3E] hover:text-[#2D4F3E]'
                    }`}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={stopCall}
                    className="px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest border border-red-300 text-red-500 hover:bg-red-50 transition-all"
                  >
                    End Call
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-10 space-y-5">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <p className="text-red-500 font-bold text-sm max-w-xs mx-auto">{error}</p>
                <button
                  onClick={startCall}
                  className="text-[#D4AF37] underline text-sm font-bold uppercase tracking-widest"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-gray-400 mt-6">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-widest font-bold">{CONTACT_INFO.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#D4AF37]" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Mon–Fri 9AM–7PM · Sat 10AM–4PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
