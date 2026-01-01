
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
      <div className="max-w-md mx-auto glass-card p-8 rounded-3xl text-center border-t-4 border-teal-500 shadow-2xl">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-teal-500 shadow-xl overflow-hidden">
          <img src="logo.png" alt="Logo" className="w-full h-full object-contain p-2" />
        </div>
        <h2 className="text-2xl font-black text-white mb-4 uppercase italic">Perfil Criado!</h2>
        <p className="text-teal-100/60 mb-8 font-medium">
          O seu registo foi submetido. Aguarde a aprovação do administrador para entrar na quadra.
        </p>
        <button
          onClick={() => {
            setPendingApproval(false);
            setIsRegistering(false);
          }}
          className="w-full bg-teal-500 text-teal-950 font-black py-4 rounded-2xl hover:bg-teal-400 transition-all uppercase tracking-widest shadow-lg shadow-teal-500/20"
        >
          Voltar ao Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto glass-card p-8 rounded-3xl shadow-2xl border-t-4 border-teal-500/50 relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none transform translate-x-10 -translate-y-10">
        <img src="logo.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="text-center mb-8">
        <div className="inline-block w-28 h-28 bg-white rounded-full p-3 mb-6 shadow-2xl border-2 border-teal-500/30 transform hover:scale-110 transition-transform duration-500">
          <img src="logo.png" alt="Padel Level Up Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
          {isRegistering ? 'Registar' : 'Entrar'}
        </h2>
        <p className="text-teal-500/60 mt-2 text-xs font-black uppercase tracking-widest">
          LevelUP Padel Results
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {isRegistering && (
          <div>
            <label className="block text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
            <input
              type="text"
              className="w-full px-5 py-3.5 bg-teal-950/50 border border-teal-800 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-white placeholder-teal-800"
              placeholder="Ex: Pedro Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        
        <div>
          <label className="block text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1.5 ml-1">Número Telemóvel</label>
          <input
            type="text"
            className="w-full px-5 py-3.5 bg-teal-950/50 border border-teal-800 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-white placeholder-teal-800"
            placeholder="912 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
          <input
            type="password"
            className="w-full px-5 py-3.5 bg-teal-950/50 border border-teal-800 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-white placeholder-teal-800"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {isRegistering && (
          <div>
            <label className="block text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1.5 ml-1">Código Convite (Admin)</label>
            <input
              type="password"
              className="w-full px-5 py-3.5 bg-teal-950/50 border border-teal-800 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all text-white placeholder-teal-800"
              placeholder="Código de acesso"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 text-red-400 text-[11px] font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-teal-600 to-teal-400 text-teal-950 font-black py-4 rounded-2xl shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] mt-2"
        >
          {isRegistering ? 'Criar Conta' : 'Entrar na Quadra'}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-teal-900/50 pt-6">
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
          className="text-teal-400/60 font-black hover:text-teal-300 text-[10px] uppercase tracking-widest flex items-center justify-center mx-auto transition-colors"
        >
          {isRegistering ? 'Já tens conta? Entrar' : 'Novo por aqui? Criar conta'}
        </button>
      </div>
    </div>
  );
};