
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Policies', path: '/policies' },
    { name: 'Admin', path: '/admin' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex flex-col items-start">
            <span className={`text-2xl font-bold tracking-tight serif ${scrolled ? 'text-[#2D4F3E]' : 'text-white'}`}>Graceful Hands</span>
            <span className={`text-[10px] tracking-[0.2em] uppercase font-light ${scrolled ? 'text-gray-500' : 'text-gray-300'}`}>Therapeutic Massage</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium hover:text-[#D4AF37] transition-colors ${location.pathname === link.path ? 'text-[#D4AF37]' : scrolled ? 'text-[#2D4F3E]' : 'text-white'}`}
              >
                {link.name}
              </Link>
            ))}
            <Link to="/booking" className="bg-[#D4AF37] text-white px-6 py-2 rounded-sm text-sm font-semibold hover:bg-[#B89830] transition-all flex items-center gap-2">
              <Calendar size={16} />
              Book Now
            </Link>
          </div>

          {/* Mobile Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className={scrolled ? 'text-[#2D4F3E]' : 'text-white'}>
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl animate-fade-in-down">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block text-lg font-medium text-[#2D4F3E] hover:text-[#D4AF37]"
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/booking"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center bg-[#D4AF37] text-white px-6 py-3 rounded-sm font-bold"
            >
              Book Session
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
