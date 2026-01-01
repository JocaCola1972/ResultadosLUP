
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigate: (view: 'player' | 'admin' | 'ranking') => void;
  currentView: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentView }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900/95 backdrop-blur-md text-white shadow-2xl sticky top-0 z-50 border-b border-[#8ea8cc]/20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl shadow-lg border border-[#8ea8cc]/30 p-1.5 transform -rotate-1">
              <img src="logo.png" alt="LevelUP Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8ea8cc] leading-none">
                Padel
              </h1>
              <span className="text-[10px] font-black text-[#8ea8cc] uppercase tracking-[0.2em] leading-none mt-1">Level UP</span>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[#8ea8cc] text-[10px] font-bold uppercase tracking-widest leading-none">Jogador</span>
                <span className="text-white text-sm font-bold">{user.name}</span>
              </div>
              <button 
                onClick={onLogout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 uppercase tracking-widest"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-5xl px-4 py-8">
        {user && (
          <div className="mb-8 flex flex-wrap gap-2 p-1.5 rounded-2xl glass-card border border-[#8ea8cc]/10 shadow-xl">
            <button
              onClick={() => onNavigate('player')}
              className={`flex-1 min-w-[110px] py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                currentView === 'player' ? 'bg-[#8ea8cc] text-slate-900 shadow-lg shadow-[#8ea8cc]/20' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Meu Registo
            </button>
            <button
              onClick={() => onNavigate('ranking')}
              className={`flex-1 min-w-[110px] py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                currentView === 'ranking' ? 'bg-[#8ea8cc] text-slate-900 shadow-lg shadow-[#8ea8cc]/20' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              Rankings
            </button>
            {user.isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex-1 min-w-[110px] py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  currentView === 'admin' ? 'bg-[#8ea8cc] text-slate-900 shadow-lg shadow-[#8ea8cc]/20' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        )}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      <footer className="py-12 text-center">
        <div className="w-16 h-1 bg-[#8ea8cc]/30 mx-auto mb-6 rounded-full"></div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
          RESULTADOS LEVELUP &copy; 2025
        </p>
      </footer>
    </div>
  );
};