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

    // Check Master Admin Login (JocaCola)
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
        isApproved: isAdmin // Admins via code are auto-approved for simplicity
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
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Perfil Criado!</h2>
        <p className="text-slate-600 mb-8">
          O seu registo foi submetido com sucesso. Por favor, aguarde que um administrador aprove o seu acesso para poder entrar e registar resultados.
        </p>
        <button
          onClick={() => {
            setPendingApproval(false);
            setIsRegistering(false);
          }}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-all"
        >
          Voltar ao Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          {isRegistering ? 'Criar Perfil LevelUP' : 'Resultados LevelUP'}
        </h2>
        <p className="text-slate-500 mt-2 text-sm">
          {isRegistering ? 'Introduza o seu nome e telemóvel para começar.' : 'Faça login com o seu telemóvel para gerir os seus jogos.'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {isRegistering && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Utilizador / Jogador</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Ex: Joca Padel"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Número de Telemóvel</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            placeholder="Ex: 912345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {isRegistering && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Código Admin (Opcional)</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="Apenas para administradores"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl border border-red-100">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-[0.98] mt-2"
        >
          {isRegistering ? 'Criar Perfil' : 'Entrar'}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-slate-100 pt-6">
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError('');
          }}
          className="text-emerald-600 font-bold hover:text-emerald-700 text-sm flex items-center justify-center mx-auto"
        >
          {isRegistering ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Já tem perfil? Entre aqui
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Não tem perfil? Registe-se agora
            </>
          )}
        </button>
      </div>
    </div>
  );
};