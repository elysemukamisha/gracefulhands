
import React from 'react';
import { Clock, Ban, CalendarX, CreditCard, Info } from 'lucide-react';

const Policies: React.FC = () => {
  return (
    <div className="pt-32 pb-24 bg-[#FCF9F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h4 className="text-[#D4AF37] uppercase tracking-[0.4em] text-xs font-bold mb-4">Our Commitment</h4>
          <h1 className="text-4xl md:text-5xl font-bold serif text-[#2D4F3E] mb-6">Clinic Policies</h1>
          <p className="text-lg text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
            At Graceful Hands Therapeutic Massage, your time — and ours — is valuable. To ensure every guest receives the best care possible, we want you to be fully aware of our policies.
          </p>
        </div>

        {/* Intro Card */}
        <div className="bg-white p-8 mb-12 border-l-4 border-[#D4AF37] shadow-sm flex items-start gap-6">
          <Info className="text-[#D4AF37] shrink-0" size={32} />
          <div>
            <p className="text-gray-600 font-light leading-relaxed italic">
              "These policies are in effect as soon as you book an appointment with us. At this time, we do not require credit card information on file, hence these policies exist to respect everyone’s time and keep things running smoothly."
            </p>
          </div>
        </div>

        {/* Policy Grid */}
        <div className="space-y-12">
          
          <PolicySection 
            icon={<Clock className="text-[#D4AF37]" size={32} />}
            title="Late Policy"
            content="Life happens! At our clinic, we have a late policy that allows about 1-3 minutes of buffer time as a courtesy, as scheduling allows, for you to still receive the full amount of your scheduled therapy service. Anything after that will cut into your treatment time, and you will be required to pay for your originally scheduled appointment in full. After 10 minutes of being late, it is considered a no-show; please refer to the no-show policy."
          />

          <PolicySection 
            icon={<Ban className="text-[#D4AF37]" size={32} />}
            title="Late Cancellations"
            content="We have reserved your scheduled appointment time just for you! Any cancellations or changes to your appointment within 24 hours of your scheduled time makes it very difficult to rebook another client into your spot. A late cancellation fee of 50% of the scheduled appointment cost will be applied for any cancellations or changes within 24 hours of the scheduled appointment. This also includes rescheduling within 24 hours as well."
          />

          <PolicySection 
            icon={<CalendarX className="text-[#D4AF37]" size={32} />}
            title="No Shows"
            content="We have reserved your appointment time just for you, and we have complimentary reminders leading up to your appointment! Not showing up within 10 minutes of your appointment start time is considered a no-show, and the remainder of your appointment time is forfeited. The full cost of your original scheduled appointment will be required for payment immediately before any future appointments can be booked or provided."
          />

          <PolicySection 
            icon={<CreditCard className="text-[#D4AF37]" size={32} />}
            title="Late Payments"
            content="Payment is required for your service at the end of your appointment before leaving. In a few extenuating circumstances, Graceful Hands Therapeutic Massage may allow online payment options to pay your outstanding balance by the end of the day of service. Any payments not paid within 24 hours of your completed appointment will increase by $30 per day it remains unpaid as a late payment fee."
          />

        </div>

        {/* Footer Note */}
        <div className="mt-20 pt-12 border-t border-gray-200 text-center">
            <p className="text-gray-400 text-sm font-light italic">
                Thank you for choosing Graceful Hands. We appreciate your cooperation in helping us maintain a high standard of professional service for all our guests.
            </p>
        </div>

      </div>
    </div>
  );
};

const PolicySection: React.FC<{ icon: React.ReactNode, title: string, content: string }> = ({ icon, title, content }) => (
  <div className="bg-white p-10 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-start hover:shadow-md transition-shadow">
    <div className="p-4 bg-[#FCF9F5] rounded-full shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="text-2xl font-bold serif text-[#2D4F3E] mb-4">{title}</h3>
      <p className="text-gray-600 font-light leading-relaxed text-sm">
        {content}
      </p>
    </div>
  </div>
);

export default Policies;
