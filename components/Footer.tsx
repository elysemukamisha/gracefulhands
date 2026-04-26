
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { CONTACT_INFO } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2D4F3E] text-white pt-16 pb-8 font-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold serif mb-4">Graceful Hands</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              {CONTACT_INFO.tagline} Our clinical approach meets luxury care for lasting physical and mental restoration.
            </p>
            <div className="flex space-x-4">
              <a href={CONTACT_INFO.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-[#D4AF37] transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-300 hover:text-[#D4AF37] transition-colors"><Facebook size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-xs text-[#D4AF37]">Services</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link to="/services" className="hover:text-[#D4AF37] transition-colors block">Swedish Massage</Link></li>
              <li><Link to="/services" className="hover:text-[#D4AF37] transition-colors block">Deep Tissue Therapy</Link></li>
              <li><Link to="/services" className="hover:text-[#D4AF37] transition-colors block">Sports & Performance</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-xs text-[#D4AF37]">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li><Link to="/" className="hover:text-[#D4AF37] transition-colors block">Home</Link></li>
              <li><Link to="/booking" className="hover:text-[#D4AF37] transition-colors block">Book Online</Link></li>
              <li><Link to="/about" className="hover:text-[#D4AF37] transition-colors block">About Us</Link></li>
              <li><Link to="/policies" className="hover:text-[#D4AF37] transition-colors block">Policies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wider text-xs text-[#D4AF37]">Contact Us</h4>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="shrink-0 text-[#D4AF37]" />
                <span>{CONTACT_INFO.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-[#D4AF37]" />
                <span>{CONTACT_INFO.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-[#D4AF37]" />
                <span>{CONTACT_INFO.email}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© 2024 Graceful Hands Therapeutic Massage. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/policies" className="hover:text-white">Privacy Policy</Link>
            <Link to="/policies" className="hover:text-white">Terms & Policies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
