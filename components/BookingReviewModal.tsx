
import React from 'react';
import { X, Edit3, Calendar, User, Activity, Clock, Send } from 'lucide-react';

interface BookingSummary {
  firstName: string;
  anyPain: string;
  preferredDay: string;
  timing: 'Morning' | 'Evening';
}

interface BookingReviewModalProps {
  summary: BookingSummary | null;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}

const BookingReviewModal: React.FC<BookingReviewModalProps> = ({ summary, onConfirm, onEdit, onCancel }) => {
  if (!summary) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#2D4F3E]/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-sm shadow-2xl border border-white/20 overflow-hidden">
        <div className="bg-[#D4AF37] p-6 text-center">
          <h2 className="text-2xl font-bold serif text-white">Review Your Details</h2>
          <p className="text-white/80 text-xs uppercase tracking-[0.2em] mt-2">Collected by Voice Assistant</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-[#FCF9F5] border border-gray-100 rounded-sm">
              <User size={20} className="text-[#D4AF37] shrink-0 mt-1" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">First Name</p>
                <p className="text-lg font-bold text-[#2D4F3E] serif">{summary.firstName}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-[#FCF9F5] border border-gray-100 rounded-sm">
              <Activity size={20} className="text-[#D4AF37] shrink-0 mt-1" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Any Pain</p>
                <p className="text-sm text-gray-600 leading-relaxed italic">"{summary.anyPain}"</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-4 bg-[#FCF9F5] border border-gray-100 rounded-sm">
                <Calendar size={20} className="text-[#D4AF37] shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Preferred Day</p>
                  <p className="text-sm font-bold text-[#2D4F3E]">{summary.preferredDay}</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-[#FCF9F5] border border-gray-100 rounded-sm">
                <Clock size={20} className="text-[#D4AF37] shrink-0 mt-1" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Timing</p>
                  <p className="text-sm font-bold text-[#2D4F3E]">{summary.timing}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 border border-green-100 rounded-sm">
            <p className="text-xs text-green-700 leading-relaxed text-center font-medium italic">
              “Please review your details on the screen. If everything looks correct, click Confirm to submit your request.”
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={onConfirm}
              className="w-full bg-[#2D4F3E] text-white py-4 font-bold uppercase tracking-widest text-xs rounded-sm shadow-xl hover:bg-[#3d6952] transition-all flex items-center justify-center gap-3"
            >
              <Send size={16} /> Confirm & Book
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onEdit}
                className="w-full bg-white border border-gray-200 text-[#2D4F3E] py-3 font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Edit3 size={14} /> Edit
              </button>
              <button 
                onClick={onCancel}
                className="w-full bg-white border border-gray-200 text-red-400 py-3 font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingReviewModal;
