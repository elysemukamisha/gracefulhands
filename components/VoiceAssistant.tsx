
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, MicOff, X, Loader2, Sparkles, Phone, Calendar, AlertCircle } from 'lucide-react';
import { CONTACT_INFO } from '../constants';

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function decode(base64: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + ch] / 32768.0;
    }
  }
  return buffer;
}

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
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const isMutedRef = useRef(false);

  const stopAudio = useCallback(() => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch (_) {} });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const closeSession = useCallback(() => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (_) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    stopAudio();
    setIsActive(false);
    setIsConnecting(false);
  }, [stopAudio]);

  useEffect(() => {
    if (!isOpen) closeSession();
  }, [isOpen, closeSession]);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setTranscription('');

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API key not configured.');

      const ai = new GoogleGenAI({ apiKey });

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;

      const now = new Date().toLocaleString('en-CA', { timeZone: 'America/Edmonton', dateStyle: 'full', timeStyle: 'short' });

      const systemInstruction = `
You are Rachel, the AI voice receptionist for Graceful Hands Therapeutic Massage — a professional, home-based clinical practice in South Edmonton (Chappelle/Heritage Valley area). The therapist is Aubine Matala, RMT.

YOUR PERSONALITY:
- Warm, empathetic, and professional — you sound like someone dedicated to health and wellness.
- Ask ONE question at a time and wait for the answer.
- Mirror the caller's energy: if they are in pain, be gentle; if they are looking for relaxation, be calm.
- Keep responses concise (under 30 words when possible).
- Use natural phrases: "I can certainly help with that", "Let me take a look at the schedule", "Absolutely."

CURRENT DATE/TIME: ${now} (America/Edmonton timezone)
BUSINESS HOURS: Monday–Friday 9AM–7PM, Saturday 10AM–4PM, Sunday closed.

YOUR GREETING: Start EVERY new conversation with:
"Graceful Hands Therapeutic Massage, Rachel speaking. How can I help you feel better today?"

SERVICES YOU BOOK:
- Therapeutic Massage: chronic pain, injury recovery, deep tissue — 60m $110 / 75m $135 / 90m $150
- Relaxation/Swedish Massage: stress relief — 60m $110 / 75m $135 / 90m $150
- Prenatal Massage: expectant mothers — 60m $110 / 75m $135 / 90m $150
- Mobile At-Home: Graceful Hands comes to you — 60m $130 / 75m $155 / 90m $170
- Mini Sessions: Head/Neck/Shoulders or Face/Arms/Feet (45m $85), Neck & Back or Legs & Feet or Scalp & Face (30m $65)
- Direct billing available for most major insurance providers.

CALL FLOW — ask ONE question at a time:
1. Greet warmly (use the greeting above).
2. Find out which service or session length they are interested in.
3. Confirm they are looking for the clinic in South Edmonton / Heritage Valley / Chappelle area.
4. Ask: "Are we working on a specific injury or area of concern today, or is this more for general relaxation?"
5. Ask: "Do you have extended health benefits? We provide receipts for easy insurance reimbursement."
6. Collect their first name.
7. Collect their phone number.
8. Collect their email address.
9. Offer available appointment times (use showBookingSummary to display a booking review).
10. Log the appointment using logLead tool.
11. Confirm: "You're all set! Aubine Matala, RMT, will be seeing you on [date/time]. We look forward to helping you feel your best."
12. Thank them and close warmly.

RULES:
- NEVER give medical diagnoses — say "Aubine will perform a full assessment during your session to determine the best approach."
- NEVER offer non-therapeutic or inappropriate services. This is a strictly professional clinical practice.
- If the schedule is full for same-day, offer the next available opening.
- If caller asks to speak to Aubine directly, say "Aubine is currently with a client. I can arrange a callback between sessions — would that work for you?"
- If unsure about insurance, say "Aubine will provide a detailed receipt you can submit directly to your provider."
- Location: ${CONTACT_INFO.address}. Phone: ${CONTACT_INFO.phone}.
      `;

      const showBookingSummaryDeclaration: FunctionDeclaration = {
        name: 'showBookingSummary',
        parameters: {
          type: Type.OBJECT,
          description: 'Display a booking review card on screen once all details are collected.',
          properties: {
            firstName:    { type: Type.STRING, description: "Client's first name" },
            anyPain:      { type: Type.STRING, description: "Area of concern or note about their session goal" },
            preferredDay: { type: Type.STRING, description: "Preferred appointment day or date" },
            timing:       { type: Type.STRING, enum: ['Morning', 'Evening'], description: "Preferred time of day" },
          },
          required: ['firstName', 'anyPain', 'preferredDay', 'timing'],
        },
      };

      const logLeadDeclaration: FunctionDeclaration = {
        name: 'logLead',
        parameters: {
          type: Type.OBJECT,
          description: 'Log a completed appointment booking with all client details.',
          properties: {
            name:        { type: Type.STRING, description: "Client full name" },
            phone:       { type: Type.STRING, description: "Client phone number" },
            email:       { type: Type.STRING, description: "Client email address" },
            serviceType: { type: Type.STRING, description: "Type of massage service booked" },
            duration:    { type: Type.STRING, description: "Session duration in minutes" },
            appointmentDate: { type: Type.STRING, description: "Confirmed appointment date and time" },
            notes:       { type: Type.STRING, description: "Pain points, injuries, or special notes" },
          },
          required: ['name', 'phone', 'serviceType'],
        },
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-live-2.5-flash-preview',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);

            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (!sessionRef.current || isMutedRef.current) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              sessionRef.current.sendRealtimeInput({
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' },
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },

          onmessage: async (message: LiveServerMessage) => {
            // Play audio response
            const parts = message.serverContent?.modelTurn?.parts ?? [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                const ctx = audioContextRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(part.inlineData.data), ctx, 24000, 1);
                const audioSource = ctx.createBufferSource();
                audioSource.buffer = buffer;
                audioSource.connect(ctx.destination);
                audioSource.onended = () => sourcesRef.current.delete(audioSource);
                sourcesRef.current.add(audioSource);
                audioSource.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
              }
            }

            // Show transcription
            if (message.serverContent?.outputTranscription?.text) {
              setTranscription(prev => prev + message.serverContent!.outputTranscription!.text + ' ');
            }

            // Handle interruptions
            if (message.serverContent?.interrupted) stopAudio();

            // Handle function calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'showBookingSummary') {
                  onBookingCollected(fc.args as any);
                }
                if (fc.name === 'logLead') {
                  // Log to console — connect to a CRM/backend here when ready
                  console.log('[Graceful Hands Lead]', fc.args);
                }
                // Always send tool response
                if (sessionRef.current) {
                  sessionRef.current.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: 'ok' } },
                  });
                }
              }
            }
          },

          onerror: (e: any) => {
            console.error('[VoiceAssistant error]', e);
            setError('Connection error. Please check your microphone and try again.');
            closeSession();
          },

          onclose: () => {
            setIsActive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          tools: [{ functionDeclarations: [showBookingSummaryDeclaration, logLeadDeclaration] }],
          outputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('[VoiceAssistant startSession]', err);
      const msg = err?.message?.includes('microphone')
        ? 'Microphone access denied. Please allow microphone permission and try again.'
        : err?.message?.includes('API key')
        ? 'AI service not configured. Please contact the site administrator.'
        : 'Could not connect to AI. Please try again.';
      setError(msg);
      setIsConnecting(false);
      closeSession();
    }
  };

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
        <div className="p-8 space-y-8 min-h-[400px] flex flex-col justify-between">
          <div className="space-y-6 flex-grow">

            {/* Idle state */}
            {!isActive && !isConnecting && !error && (
              <div className="text-center py-10 space-y-6">
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
                  onClick={startSession}
                  className="bg-[#D4AF37] text-white px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-[#B89830] transition-all shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Phone size={16} /> Call Rachel Now
                </button>
              </div>
            )}

            {/* Connecting */}
            {isConnecting && (
              <div className="text-center py-20">
                <Loader2 className="animate-spin mx-auto text-[#D4AF37] mb-4" size={48} />
                <p className="text-[#2D4F3E] serif italic animate-pulse">Connecting to Rachel...</p>
              </div>
            )}

            {/* Active session */}
            {isActive && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full animate-ping"></div>
                    <div className="relative w-24 h-24 bg-[#2D4F3E] rounded-full flex items-center justify-center shadow-2xl">
                      {isMuted ? <MicOff size={40} className="text-red-400" /> : <Mic size={40} className="text-[#D4AF37]" />}
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold serif text-[#2D4F3E]">
                    {isMuted ? 'Microphone Muted' : "Rachel is Listening"}
                  </h3>
                  <p className="text-gray-400 text-xs uppercase tracking-widest">Live AI Receptionist Active</p>
                </div>

                {transcription && (
                  <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 max-h-36 overflow-y-auto">
                    <p className="text-sm text-gray-600 italic leading-relaxed">{transcription}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setIsMuted(m => { isMutedRef.current = !m; return !m; }); }}
                    className={`px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest border transition-all ${
                      isMuted
                        ? 'bg-red-500 text-white border-red-500'
                        : 'border-gray-300 text-gray-500 hover:border-[#2D4F3E] hover:text-[#2D4F3E]'
                    }`}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <button
                    onClick={closeSession}
                    className="px-5 py-2 rounded-sm text-xs font-bold uppercase tracking-widest border border-red-300 text-red-500 hover:bg-red-50 transition-all"
                  >
                    End Call
                  </button>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-10 space-y-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <p className="text-red-500 font-bold text-sm max-w-xs mx-auto">{error}</p>
                  <button
                    onClick={startSession}
                    className="mt-4 text-[#D4AF37] underline text-sm font-bold uppercase tracking-widest"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-gray-400">
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
