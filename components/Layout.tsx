
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
      <header className="bg-emerald-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight">Resultados LevelUP</h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline text-emerald-50 text-sm font-medium">Jogador: {user.name}</span>
              <button 
                onClick={onLogout}
                className="bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-inner"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-5xl px-4 py-6">
        {user && (
          <div className="mb-6 flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
            <button
              onClick={() => onNavigate('player')}
              className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all ${
                currentView === 'player' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Meu Registo
            </button>
            <button
              onClick={() => onNavigate('ranking')}
              className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all ${
                currentView === 'ranking' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Rankings
            </button>
            {user.isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold transition-all ${
                  currentView === 'admin' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                Administração
              </button>
            )}
          </div>
        )}
        {children}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-8 text-center text-slate-400 text-xs">
        <p className="font-medium tracking-wide">RESULTADOS LEVELUP &copy; 2024</p>
        <p className="mt-1 opacity-70">Sistema de Gestão de Jogos de Padel</p>
      </footer>
    </div>
  );
};
