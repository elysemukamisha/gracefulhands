
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Settings, Layout, MessageSquare, 
  Plus, LogOut, ChevronRight, BarChart, Trash2, Edit3, Save, 
  X, CheckCircle, Clock, DollarSign, Activity, Search, Filter,
  Upload, ImageIcon
} from 'lucide-react';
import { db } from '../lib/db';
import { Service, Appointment, SiteSettings, ContactMessage, Lead } from '../types';
import { BarChart as ReBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    db.logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin', icon: <BarChart size={20} /> },
    { label: 'Bookings', path: '/admin/bookings', icon: <Calendar size={20} /> },
    { label: 'Leads', path: '/admin/leads', icon: <Users size={20} /> },
    { label: 'Services', path: '/admin/services', icon: <Layout size={20} /> },
    { label: 'Messages', path: '/admin/messages', icon: <MessageSquare size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 pt-20">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 fixed h-[calc(100vh-80px)] overflow-y-auto hidden lg:block">
        <div className="p-8">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-8">Management</h2>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center gap-4 px-4 py-3 rounded-sm transition-all text-sm font-medium
                  ${location.pathname === item.path ? 'bg-[#2D4F3E] text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-8 left-0 w-full px-8">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3 w-full rounded-sm text-sm font-medium text-red-400 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow lg:ml-64 p-6 lg:p-12 overflow-x-hidden">
        <Routes>
          <Route index element={<DashboardOverview />} />
          <Route path="bookings" element={<BookingsManager />} />
          <Route path="leads" element={<LeadsManager />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="messages" element={<MessagesManager />} />
          <Route path="settings" element={<SettingsManager />} />
        </Routes>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const DashboardOverview = () => {
  const [appointments, setAppointments] = React.useState(() => db.getAppointments());
  const [services, setServices] = React.useState(() => db.getServices());
  const [messages, setMessages] = React.useState(() => db.getMessages());

  React.useEffect(() => {
    const sync = () => {
      setAppointments(db.getAppointments());
      setServices(db.getServices());
      setMessages(db.getMessages());
    };
    window.addEventListener('db:synced', sync);
    return () => window.removeEventListener('db:synced', sync);
  }, []);

  const stats = [
    { label: 'Total Revenue', value: `$${appointments.reduce((sum, a) => sum + (a.status === 'Confirmed' ? a.totalPrice : 0), 0)}`, icon: <DollarSign />, trend: '+12%' },
    { label: 'Bookings', value: appointments.length, icon: <Calendar />, trend: '+5 today' },
    { label: 'Messages', value: messages.length, icon: <MessageSquare />, trend: 'Recent' },
    { label: 'Service Types', value: services.length, icon: <Layout />, trend: 'Optimal' },
  ];

  const chartData = [
    { name: 'Mon', rev: 400 }, { name: 'Tue', rev: 700 }, { name: 'Wed', rev: 600 },
    { name: 'Thu', rev: 1100 }, { name: 'Fri', rev: 1300 }, { name: 'Sat', rev: 1500 }, { name: 'Sun', rev: 200 }
  ];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold serif text-[#2D4F3E]">Pulse Overview</h1>
        <p className="text-gray-400 text-sm">Real-time performance metrics for Graceful Hands.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-sm text-[#D4AF37]">{s.icon}</div>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{s.trend}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-[#2D4F3E] serif">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-8 rounded-sm shadow-sm border border-gray-100">
          <h3 className="font-bold serif text-[#2D4F3E] mb-8">Weekly Revenue Forecast</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReBar data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip contentStyle={{fontSize: '10px', borderRadius: '4px', border: 'none'}} />
                <Bar dataKey="rev" fill="#2D4F3E" radius={[2, 2, 0, 0]} />
              </ReBar>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#2D4F3E] text-white p-8 rounded-sm shadow-xl">
           <h3 className="font-bold serif mb-6">Staff Performance</h3>
           <div className="space-y-6">
              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold">A</div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest">Aubine</p>
                      <p className="text-[10px] text-gray-400">Master Therapist</p>
                    </div>
                 </div>
                 <span className="text-[#D4AF37] font-bold">98% Score</span>
              </div>
              <div className="pt-6 border-t border-white/10">
                 <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">Active Capacity</p>
                 <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37] w-[84%]"></div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const BookingsManager = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(db.getAppointments());

  useEffect(() => {
    const sync = () => setAppointments(db.getAppointments());
    window.addEventListener('db:synced', sync);
    return () => window.removeEventListener('db:synced', sync);
  }, []);

  const updateStatus = (id: string, status: Appointment['status']) => {
    db.updateAppointment(id, { status });
    setAppointments(db.getAppointments());
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold serif text-[#2D4F3E]">Appointment Ledger</h1>
        <div className="flex gap-4">
           <button className="bg-white px-4 py-2 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all rounded-sm">Export CSV</button>
           <button className="bg-[#2D4F3E] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm shadow-lg">Batch Confirm</button>
        </div>
      </div>

      <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Guest</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Service</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Timing</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {appointments.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-[#2D4F3E]">{a.clientName}</p>
                  <p className="text-[10px] text-gray-400">{a.email}</p>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 uppercase font-medium">{a.duration}m Treatment</td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-[#2D4F3E]">{a.date}</p>
                  <p className="text-[10px] text-gray-400">{a.time}</p>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={a.status}
                    onChange={(e) => updateStatus(a.id, e.target.value as any)}
                    className={`text-[9px] font-bold uppercase px-2 py-1 rounded-sm border outline-none
                      ${a.status === 'Confirmed' ? 'bg-[#2D4F3E] text-white' : 'bg-[#F5F5DC] text-[#2D4F3E] border-[#D4AF37]/30'}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <button className="text-gray-300 hover:text-[#D4AF37]"><Edit3 size={16}/></button>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
               <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic text-sm">No bookings recorded in the ledger.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>(db.getServices());
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  useEffect(() => {
    const sync = () => setServices(db.getServices());
    window.addEventListener('db:synced', sync);
    return () => window.removeEventListener('db:synced', sync);
  }, []);

  const handleDelete = (id: string) => {
    const updated = services.filter(s => s.id !== id);
    db.saveServices(updated);
    setServices(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    
    let updated;
    if (editing.id) {
      updated = services.map(s => s.id === editing.id ? editing as Service : s);
    } else {
      const newService = { ...editing, id: Date.now().toString() } as Service;
      updated = [...services, newService];
    }
    
    db.saveServices(updated);
    setServices(updated);
    setEditing(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editing) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditing({ ...editing, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold serif text-[#2D4F3E]">Treatment Catalog</h1>
        <button 
          onClick={() => setEditing({ name: '', description: '', basePrice: 0, durationOptions: [60, 90], category: 'Therapeutic' })}
          className="bg-[#D4AF37] text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-lg flex items-center gap-2"
        >
          <Plus size={16} /> New Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map(s => (
          <div key={s.id} className="bg-white p-8 rounded-sm shadow-sm border border-gray-100 flex gap-6 group">
            <img src={s.image} className="w-24 h-24 object-cover rounded-sm grayscale group-hover:grayscale-0 transition-all" />
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold serif text-[#2D4F3E] text-lg">{s.name}</h3>
                 <div className="flex gap-2">
                    <button onClick={() => setEditing(s)} className="p-2 text-gray-300 hover:text-[#2D4F3E] transition-all"><Edit3 size={16}/></button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-300 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                 </div>
              </div>
              <p className="text-xs text-gray-400 mb-4 line-clamp-2">{s.description}</p>
              <div className="flex justify-between items-center">
                 <span className="text-[9px] uppercase tracking-widest font-bold bg-gray-50 px-2 py-1 text-gray-400">{s.category}</span>
                 <span className="font-bold text-[#D4AF37]">${s.basePrice}+</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 bg-[#2D4F3E]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <form onSubmit={handleSave} className="bg-white w-full max-w-2xl p-10 rounded-sm shadow-2xl space-y-8 animate-fade-in overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                 <h2 className="text-2xl font-bold serif text-[#2D4F3E]">{editing.id ? 'Refine Service' : 'Catalogue New Modality'}</h2>
                 <button type="button" onClick={() => setEditing(null)}><X className="text-gray-300 hover:text-gray-500" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Service Name</label>
                    <input 
                      type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm"
                      value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Category</label>
                    <select 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm"
                      value={editing.category} onChange={e => setEditing({...editing, category: e.target.value as any})}
                    >
                      <option value="Therapeutic">Therapeutic</option>
                      <option value="Relaxation">Relaxation</option>
                      <option value="Specialty">Specialty</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Starting Price ($)</label>
                    <input 
                      type="number" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm"
                      value={editing.basePrice} onChange={e => setEditing({...editing, basePrice: parseInt(e.target.value)})} required
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Description</label>
                    <textarea 
                      className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm focus:border-[#D4AF37] outline-none text-sm h-[130px]"
                      value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} required
                    />
                  </div>
                  
                  {/* Functional Image Upload Mechanism */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Service Image</label>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-sm transition-all hover:bg-gray-100">
                      <div className="w-16 h-16 bg-white border border-gray-200 rounded-sm overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                        {editing.image ? (
                          <img src={editing.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-gray-300" size={24} />
                        )}
                      </div>
                      <div className="flex-grow">
                        <input 
                          type="file" 
                          id="service-image-upload" 
                          accept="image/*"
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                        <label 
                          htmlFor="service-image-upload" 
                          className="cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest text-[#2D4F3E] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all flex items-center gap-2 w-max"
                        >
                          <Upload size={14} />
                          {editing.image ? 'Change Photo' : 'Upload Photo'}
                        </label>
                        <p className="text-[9px] text-gray-400 mt-2 italic">PNG, JPG recommended (max 2MB)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-gray-50">
                <button type="button" onClick={() => setEditing(null)} className="px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600">Cancel</button>
                <button type="submit" className="bg-[#2D4F3E] text-white px-12 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-xl hover:bg-[#3d6952]">Commit Changes</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

const MessagesManager = () => {
  const [messages, setMessages] = useState<ContactMessage[]>(db.getMessages());

  useEffect(() => {
    const sync = () => setMessages(db.getMessages());
    window.addEventListener('db:synced', sync);
    return () => window.removeEventListener('db:synced', sync);
  }, []);

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold serif text-[#2D4F3E]">Inbound Inquiry</h1>
       <div className="space-y-6">
          {messages.map(m => (
             <div key={m.id} className="bg-white p-8 rounded-sm shadow-sm border border-gray-100 flex gap-8">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-[#F5F5DC] rounded-full flex items-center justify-center font-bold text-[#2D4F3E]">{m.name.charAt(0)}</div>
                </div>
                <div>
                   <div className="flex items-center gap-4 mb-2">
                      <h4 className="font-bold text-[#2D4F3E] text-lg">{m.name}</h4>
                      <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{m.date}</span>
                   </div>
                   <p className="text-xs text-[#D4AF37] font-bold mb-4">{m.email}</p>
                   <p className="text-gray-500 text-sm leading-relaxed font-light italic">"{m.message}"</p>
                </div>
             </div>
          ))}
          {messages.length === 0 && (
            <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-sm">
               <MessageSquare className="mx-auto text-gray-200 mb-4" size={48} />
               <p className="text-gray-400 text-sm italic">No messages found in the inquiry log.</p>
            </div>
          )}
       </div>
    </div>
  );
};

const SettingsManager = () => {
  const [settings, setSettings] = useState<SiteSettings>(db.getSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSettings(db.getSettings());
    window.addEventListener('db:synced', sync);
    return () => window.removeEventListener('db:synced', sync);
  }, []);

  const handleSave = () => {
    db.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-12">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold serif text-[#2D4F3E]">Global Environment</h1>
          <p className="text-gray-400 text-sm">Control the visual identity and SEO parameters of the site.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-[#2D4F3E] text-white px-10 py-4 text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-xl flex items-center gap-2"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Settings Saved' : 'Commit Configuration'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-8 bg-white p-8 rounded-sm shadow-sm border border-gray-100">
           <h3 className="font-bold serif text-[#2D4F3E] border-b border-gray-50 pb-4">Theme Configuration</h3>
           <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Primary Color (Brand)</label>
                <div className="flex gap-4 items-center">
                   <input 
                     type="color" className="w-12 h-12 rounded-sm cursor-pointer border-none p-0"
                     value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                   />
                   <input 
                     type="text" className="flex-grow p-3 bg-gray-50 border border-gray-100 text-sm font-mono"
                     value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})}
                   />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Accent Color (Gold)</label>
                <div className="flex gap-4 items-center">
                   <input 
                     type="color" className="w-12 h-12 rounded-sm cursor-pointer border-none p-0"
                     value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})}
                   />
                   <input 
                     type="text" className="flex-grow p-3 bg-gray-50 border border-gray-100 text-sm font-mono"
                     value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})}
                   />
                </div>
              </div>
              <div>
                 <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Announcement Bar Text</label>
                 <input 
                    type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm outline-none text-sm"
                    value={settings.announcementBar} onChange={e => setSettings({...settings, announcementBar: e.target.value})}
                 />
              </div>
           </div>
        </section>

        <section className="space-y-8 bg-white p-8 rounded-sm shadow-sm border border-gray-100">
           <h3 className="font-bold serif text-[#2D4F3E] border-b border-gray-50 pb-4">SEO & Metadata</h3>
           <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Site Meta Title</label>
                <input 
                  type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm outline-none text-sm"
                  value={settings.metaTitle} onChange={e => setSettings({...settings, metaTitle: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Meta Description</label>
                <textarea 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm outline-none text-sm h-[100px]"
                  value={settings.metaDescription} onChange={e => setSettings({...settings, metaDescription: e.target.value})}
                />
              </div>
           </div>
        </section>
      </div>

      <section className="bg-white p-8 rounded-sm shadow-sm border border-gray-100">
         <h3 className="font-bold serif text-[#2D4F3E] border-b border-gray-50 pb-4 mb-6">Images</h3>
         <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Therapist Headshot URL</label>
              <input
                type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm outline-none text-sm"
                value={settings.headshotUrl || ''} onChange={e => setSettings({...settings, headshotUrl: e.target.value})}
                placeholder="https://gracefulhands.ca/images/aubine.jpg"
              />
              <p className="text-[10px] text-gray-400 mt-1">Paste a direct image URL. To use your own photo, upload it via FTP to gracefulhands.ca/images/aubine.jpg then enter that URL here.</p>
            </div>
            {settings.headshotUrl && (
              <img src={settings.headshotUrl} alt="Headshot preview" className="h-24 w-24 object-cover rounded-sm border border-gray-100" onError={e => (e.currentTarget.style.display = 'none')} />
            )}
         </div>
      </section>

      <section className="bg-white p-8 rounded-sm shadow-sm border border-gray-100">
         <h3 className="font-bold serif text-[#2D4F3E] border-b border-gray-50 pb-4 mb-6">Social Integration</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Instagram Link</label>
              <input
                type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm outline-none text-sm"
                value={settings.instagramUrl} onChange={e => setSettings({...settings, instagramUrl: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-2">Facebook Link</label>
              <input
                type="text" className="w-full p-4 bg-gray-50 border border-gray-100 rounded-sm outline-none text-sm"
                value={settings.facebookUrl} onChange={e => setSettings({...settings, facebookUrl: e.target.value})}
              />
            </div>
         </div>
      </section>
    </div>
  );
};

const LeadsManager = () => {
  const [leads, setLeads] = useState<Lead[]>(db.getLeads());

  useEffect(() => {
    const sync = () => setLeads(db.getLeads());
    window.addEventListener('db:synced', sync);
    return () => window.removeEventListener('db:synced', sync);
  }, []);

  const updateStatus = (id: string, status: Lead['status']) => {
    db.updateLead(id, { status });
    setLeads(db.getLeads());
  };

  const statusColors: Record<Lead['status'], string> = {
    New: 'bg-blue-50 text-blue-700 border-blue-200',
    Contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Booked: 'bg-[#2D4F3E] text-white border-transparent',
    Lost: 'bg-red-50 text-red-500 border-red-200',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold serif text-[#2D4F3E]">Lead Tracker</h1>
          <p className="text-gray-400 text-sm mt-1">Clients captured by Rachel, the AI receptionist.</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2 rounded-sm">
          {leads.filter(l => l.status === 'New').length} New
        </span>
      </div>

      <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Client</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Service Interest</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Insurance</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Notes</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-[#2D4F3E]">{l.name}</p>
                  <p className="text-[10px] text-gray-400">{l.email}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{l.phone}</p>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">{l.serviceType || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-sm border ${l.hasInsurance ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    {l.hasInsurance ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400 max-w-xs truncate italic">{l.notes || '—'}</td>
                <td className="px-6 py-4">
                  <select
                    value={l.status}
                    onChange={e => updateStatus(l.id, e.target.value as Lead['status'])}
                    className={`text-[9px] font-bold uppercase px-2 py-1 rounded-sm border outline-none cursor-pointer ${statusColors[l.status]}`}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Booked">Booked</option>
                    <option value="Lost">Lost</option>
                  </select>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic text-sm">
                  No leads captured yet. Leads appear here when Rachel collects client info via the chat widget.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
