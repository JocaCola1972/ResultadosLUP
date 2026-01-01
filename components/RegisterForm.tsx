
import React, { useState } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { ADMIN_CODE, MASTER_ADMIN } from '../constants';

interface RegisterFormProps {
  onLogin: (user: User) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [pendingApproval, setPendingApproval] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingApproval(false);

    if (!isRegistering && phone === MASTER_ADMIN.username && password === MASTER_ADMIN.password) {
      const adminUser: User = {
        id: 'master-admin',
        name: 'Administrador (JocaCola)',
        phone: 'master',
        isAdmin: true,
        isApproved: true
      };
      onLogin(adminUser);
      return;
    }

    const users = storage.getUsers();

    if (isRegistering) {
      if (!name || !phone || !password) {
        setError('Por favor preencha todos os campos.');
        return;
      }
      if (users.find(u => u.phone === phone)) {
        setError('Este número de telemóvel já está registado.');
        return;
      }

      const isAdmin = adminCode === ADMIN_CODE;
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        phone,
        password,
        isAdmin,
        isApproved: isAdmin
      };
      storage.saveUser(newUser);
      
      if (!newUser.isApproved) {
        setPendingApproval(true);
      } else {
        onLogin(newUser);
      }
    } else {
      const user = users.find(u => u.phone === phone && u.password === password);
      if (user) {
        if (!user.isApproved) {
          setError('A sua conta ainda aguarda aprovação pelo administrador.');
        } else {
          onLogin(user);
        }
      } else {
        setError('Credenciais inválidas. Verifique o telemóvel e password.');
      }
    }
  };

  if (pendingApproval) {
    return (
      <div className="max-w-md mx-auto glass-card p-10 rounded-[2.5rem] text-center border-t-8 border-[#8ea8cc] shadow-2xl">
        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-slate-100 shadow-2xl overflow-hidden p-2">
          <img src="logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Perfil Criado!</h2>
        <p className="text-slate-300 mb-8 font-medium">
          O seu registo foi submetido. Aguarde a aprovação do administrador para entrar na quadra.
        </p>
        <button
          onClick={() => {
            setPendingApproval(false);
            setIsRegistering(false);
          }}
          className="w-full bg-[#8ea8cc] text-slate-900 font-black py-4 rounded-2xl hover:bg-[#b8c8d9] transition-all uppercase tracking-widest shadow-lg shadow-[#8ea8cc]/20"
        >
          Voltar ao Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto glass-card p-10 rounded-[2.5rem] shadow-2xl border-t-8 border-[#8ea8cc]/60 relative overflow-hidden">
      {/* Elemento Decorativo */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
        <img src="logo.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="text-center mb-10">
        <div className="inline-block w-32 h-32 bg-white rounded-full p-4 mb-8 shadow-2xl border-2 border-[#8ea8cc]/30 transform hover:scale-110 transition-transform duration-700 hover:rotate-2">
          <img src="logo.png" alt="Padel Level Up Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
          {isRegistering ? 'Registar' : 'Entrar'}
        </h2>
        <p className="text-[#8ea8cc] mt-2 text-[10px] font-black uppercase tracking-[0.4em]">
          LevelUP Padel Results
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-5">
        {isRegistering && (
          <div>
            <label className="block text-[10px] font-black text-[#8ea8cc] uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
            <input
              type="text"
              className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#8ea8cc] focus:border-transparent outline-none transition-all text-white placeholder-slate-700"
              placeholder="Ex: Pedro Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        
        <div>
          <label className="block text-[10px] font-black text-[#8ea8cc] uppercase tracking-widest mb-1.5 ml-1">Telemóvel</label>
          <input
            type="text"
            className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#8ea8cc] focus:border-transparent outline-none transition-all text-white placeholder-slate-700"
            placeholder="912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-[#8ea8cc] uppercase tracking-widest mb-1.5 ml-1">Password</label>
          <input
            type="password"
            className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#8ea8cc] focus:border-transparent outline-none transition-all text-white placeholder-slate-700"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {isRegistering && (
          <div>
            <label className="block text-[10px] font-black text-[#8ea8cc] uppercase tracking-widest mb-1.5 ml-1">Código Admin (Opcional)</label>
            <input
              type="password"
              className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#8ea8cc] focus:border-transparent outline-none transition-all text-white placeholder-slate-700"
              placeholder="Código de acesso"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 text-red-400 text-xs font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#8ea8cc] to-[#b8c8d9] text-slate-950 font-black py-4 rounded-2xl shadow-xl shadow-[#8ea8cc]/10 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] mt-4"
        >
          {isRegistering ? 'Criar Conta' : 'Entrar na Quadra'}
        </button>
      </form>

      <div className="mt-10 text-center border-t border-slate-800/50 pt-8">
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
          className="text-slate-400 font-black hover:text-[#8ea8cc] text-[10px] uppercase tracking-widest flex items-center justify-center mx-auto transition-colors"
        >
          {isRegistering ? 'Já tens conta? Entrar' : 'Novo por aqui? Criar conta'}
        </button>
      </div>
    </div>
  );
};