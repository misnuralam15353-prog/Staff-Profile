import React from 'react';
import { Button } from './ui/button';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#111112] rounded-sm shadow-2xl p-12 border border-white/5 flex flex-col items-center text-center"
      >
        <div className="text-[#C5A059] font-serif italic text-5xl tracking-tight mb-2">Nexus</div>
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/30 mb-12">Registry Access Protocol</div>
        
        <h1 className="text-xl font-serif text-white/90 mb-4 tracking-tight italic">Initialize Terminal Session</h1>
        <p className="text-xs text-white/40 mb-10 leading-relaxed uppercase tracking-widest px-4">
          Authorized personnel only. Access logs are monitored for security compliance.
        </p>
        
        <Button 
          onClick={handleLogin}
          className="w-full py-7 text-[11px] uppercase tracking-[0.2em] bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm transition-all hover:border-[#C5A059]/40 flex gap-4 rounded-none font-bold"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 grayscale invert" />
          Authorize via Google
        </Button>
        
        <div className="mt-12 flex items-center gap-4 w-full opacity-20">
          <div className="h-[1px] flex-1 bg-white"></div>
          <ShieldCheck className="w-4 h-4 text-white" />
          <div className="h-[1px] flex-1 bg-white"></div>
        </div>
        
        <p className="mt-8 text-[9px] text-white/20 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Nexus Infrastructure. Encrypted.
        </p>
      </motion.div>
    </div>
  );
};
