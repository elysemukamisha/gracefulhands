
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { db } from '../lib/db';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (db.login(password)) {
      navigate('/admin');
    } else {
      setError('Invalid access key.');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#FCF9F5] px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-sm shadow-2xl border border-gray-100 text-center">
        <div className="w-16 h-16 bg-[#F5F5DC] text-[#2D4F3E] rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-bold serif text-[#2D4F3E] mb-2">Admin Portal</h1>
        <p className="text-gray-400 text-sm mb-10">Restricted access for Graceful Hands staff only.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="password"
              placeholder="Enter Access Key"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none transition-all font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-[#2D4F3E] text-white py-4 font-bold uppercase tracking-[0.2em] text-xs hover:bg-[#3d6952] transition-all shadow-xl"
          >
            Authenticate
          </button>
        </form>
        
        <button onClick={() => navigate('/')} className="mt-8 text-gray-400 text-[10px] uppercase font-bold tracking-widest hover:text-[#D4AF37]">
          Return to Website
        </button>
      </div>
    </div>
  );
};

export default Login;
