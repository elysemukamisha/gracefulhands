
import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RachelChat from './components/RachelChat';
import { db } from './lib/db';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Booking = lazy(() => import('./pages/Booking'));
const Admin = lazy(() => import('./pages/Admin'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Policies = lazy(() => import('./pages/Policies'));

// Fix: Marking children as optional to avoid "Property 'children' is missing" errors in some TS configurations when nested in Route element
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  return db.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  useEffect(() => {
    db.init().then(() => {
      // Apply settings colors after sync; fall back to cached if API is unavailable
      const s = db.getSettings();
      document.documentElement.style.setProperty('--primary-color', s.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', s.secondaryColor);
    });
  }, []);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <RachelChat />
        <main className="flex-grow">
          <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-[#FCF9F5]">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-[var(--secondary-color,#D4AF37)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[var(--primary-color,#2D4F3E)] serif italic animate-pulse">Graceful Hands...</p>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/policies" element={<Policies />} />
              <Route path="/admin/*" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
