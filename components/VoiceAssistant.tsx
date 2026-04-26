
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { Mic, X, Loader2, Sparkles, Phone, Calendar, AlertCircle } from 'lucide-react';
import { CONTACT_INFO } from '../constants';

// Audio Encoding/Decoding Helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
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

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
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

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const stopAudio = useCallback(() => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  }, []);

  const closeSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
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
    if (!isOpen) {
      closeSession();
    }
  }, [isOpen, closeSession]);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    setTranscription('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const showBookingSummaryDeclaration: FunctionDeclaration = {
        name: 'showBookingSummary',
        parameters: {
          type: Type.OBJECT,
          description: 'Call this once all booking questions are answered.',
          properties: {
            firstName: { type: Type.STRING },
            anyPain: { type: Type.STRING },
            preferredDay: { type: Type.STRING },
            timing: { type: Type.STRING, enum: ['Morning', 'Evening'] },
          },
          required: ['firstName', 'anyPain', 'preferredDay', 'timing'],
        },
      };

      const systemInstruction = `
        You are Rachel, the AI voice receptionist at Graceful Hands Therapeutic Massage in South Edmonton (Chappelle/Heritage Valley area). The therapist is Aubine Matala, RMT.

        YOUR PERSONALITY: Warm, empathetic, and professional. Ask ONE question at a time. Keep answers concise.

        BUSINESS INFO:
        - Pricing: Clinic (60m: $110, 75m: $135, 90m: $150). Mobile at-home (60m: $130, 75m: $155, 90m: $170). Mini sessions (30m: $65, 45m: $85).
        - Business hours: Monday–Friday 9AM–7PM, Saturday 10AM–4PM, Sunday closed. Timezone: America/Edmonton.
        - Location: ${CONTACT_INFO.address} (home-based clinical practice).
        - Services: Therapeutic Massage (chronic pain, deep tissue, injury recovery), Relaxation/Swedish Massage, Prenatal Massage, Sports & Performance, Mini Targeted Services, Mobile At-Home Sessions.
        - Booking: Use the chat widget on the website, or call/text ${CONTACT_INFO.phone}.
        - Direct billing available for most major insurance providers. Receipts provided for insurance reimbursement.

        RULES:
        1. NEVER give medical diagnoses — say “Aubine will do a full assessment during your session.”
        2. NEVER offer non-therapeutic services.
        3. If caller wants to speak to Aubine, offer a callback between sessions.
        4. Tone: Warm, professional, concise, conversion-focused.

        BOOKING CONVERSATION FLOW:
        When a visitor shows intent to book, ask these questions ONE AT A TIME:
        1) What is your first name?
        2) Are you experiencing any pain or discomfort?
        3) What is your preferred visit day?
        4) Do you prefer Morning or Evening?

        After collecting ALL 4 details, call “showBookingSummary” and say:
        “Please review your details on the screen. If everything looks correct, click Confirm to submit your request.”
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64 = message.serverContent.modelTurn.parts[0].inlineData.data;
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.onended = () => sourcesRef.current.delete(source);
              sourcesRef.current.add(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }

            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + message.serverContent!.outputTranscription!.text + ' ');
            }

            if (message.serverContent?.interrupted) {
              stopAudio();
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'showBookingSummary') {
                  onBookingCollected(fc.args as any);
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: "ok" } }
                  }));
                }
              }
            }
          },
          onerror: (e) => {
            setError('Connection error. Please try again.');
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
          tools: [{ functionDeclarations: [showBookingSummaryDeclaration] }],
          outputAudioTranscription: {},
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      setError('Could not access microphone or connect to AI.');
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2D4F3E]/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-[#2D4F3E] p-6 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#D4AF37]" size={20} />
            <h2 className="text-xl font-bold serif text-white">AI Voice Support</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 min-h-[400px] flex flex-col justify-between">
          <div className="space-y-6 flex-grow">
            {!isActive && !isConnecting && !error && (
              <div className="text-center py-12 space-y-6">
                <div className="w-24 h-24 bg-[#FCF9F5] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Mic size={40} className="text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold serif text-[#2D4F3E]">Help at Your Voice</h3>
                  <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
                    Ask me about pricing, hours, location, or start your session booking by voice.
                  </p>
                </div>
                <button 
                  onClick={startSession}
                  className="bg-[#D4AF37] text-white px-8 py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-[#B89830] transition-all shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Sparkles size={16} /> Start AI Conversation
                </button>
              </div>
            )}

            {isConnecting && (
              <div className="text-center py-20">
                <Loader2 className="animate-spin mx-auto text-[#D4AF37] mb-4" size={48} />
                <p className="text-[#2D4F3E] serif italic animate-pulse">Initializing clinical assistant...</p>
              </div>
            )}

            {isActive && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full animate-ping"></div>
                    <div className="relative w-24 h-24 bg-[#2D4F3E] rounded-full flex items-center justify-center shadow-2xl">
                      <Mic size={40} className="text-[#D4AF37]" />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold serif text-[#2D4F3E]">I'm Listening</h3>
                  <p className="text-gray-400 text-xs uppercase tracking-widest mt-2">Voice & Text Fallback Active</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 max-h-40 overflow-y-auto">
                  <p className="text-sm text-gray-600 italic leading-relaxed">
                    {transcription || "Listening for your response..."}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <p className="text-red-500 font-bold">{error}</p>
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

          <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-gray-400">
             <div className="flex items-center gap-3">
               <Phone size={14} className="text-[#D4AF37]" />
               <span className="text-[10px] uppercase tracking-widest font-bold">{CONTACT_INFO.phone}</span>
             </div>
             <div className="flex items-center gap-3">
               <Calendar size={14} className="text-[#D4AF37]" />
               <span className="text-[10px] uppercase tracking-widest font-bold">8AM - 6PM Daily</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
