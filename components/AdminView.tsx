
import React, { useState, useEffect, useMemo } from 'react';
import { MatchRecord, ShiftID, ResultType, User } from '../types';
import { storage } from '../services/storage';
import { SHIFTS } from '../constants';

type AdminSubView = 'stats' | 'users' | 'configs';

export const AdminView: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<AdminSubView>('stats');
  const [allRecords, setAllRecords] = useState<MatchRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftConfigs, setShiftConfigs] = useState<Record<string, number>>(storage.getShiftConfigs());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Deletion Modal State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Manual User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPass, setNewUserPass] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setAllRecords(storage.getRecords());
    setAllUsers(storage.getUsers());
  };

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => r.date === filterDate);
  }, [allRecords, filterDate]);

  const stats = useMemo(() => {
    const userMap: Record<string, { name: string, totalPoints: number, wins: number, draws: number, losses: number }> = {};
    
    filteredRecords.forEach(r => {
      if (!userMap[r.userId]) {
        userMap[r.userId] = { name: r.userName, totalPoints: 0, wins: 0, draws: 0, losses: 0 };
      }
      userMap[r.userId].totalPoints += r.points;
      
      r.results.forEach(res => {
        if (res === ResultType.WIN) userMap[r.userId].wins++;
        else if (res === ResultType.DRAW) userMap[r.userId].draws++;
        else if (res === ResultType.LOSS) userMap[r.userId].losses++;
      });
    });

    return Object.values(userMap).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [filteredRecords]);

  const handleShiftConfigChange = (shift: string, value: string) => {
    const num = parseInt(value) || 0;
    setShiftConfigs(prev => ({ ...prev, [shift]: num }));
    setSaveStatus('idle');
  };

  const saveConfigs = () => {
    setSaveStatus('saving');
    storage.saveShiftConfigs(shiftConfigs);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleApproveUser = (user: User) => {
    const updated = { ...user, isApproved: true };
    storage.updateUser(updated);
    refreshData();
  };

  const executeDelete = (mode: 'access_only' | 'full_wipe') => {
    if (!userToDelete) return;

    if (mode === 'access_only') {
      storage.deleteUser(userToDelete.id);
    } else {
      storage.deleteUser(userToDelete.id);
      storage.deleteRecordsByUser(userToDelete.id);
    }

    setUserToDelete(null);
    refreshData();
  };

  const handleAddManualUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserPhone || !newUserPass) return;

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUserName,
      phone: newUserPhone,
      password: newUserPass,
      isAdmin: false,
      isApproved: true
    };

    storage.saveUser(newUser);
    setNewUserName('');
    setNewUserPhone('');
    setNewUserPass('');
    setShowAddUser(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Deletion Modal Overlay */}
      {userToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Apagar Jogador</h3>
              <p className="text-slate-500 text-sm mb-8">
                Pretende remover <span className="font-bold text-slate-700">{userToDelete.name}</span>? Escolha como deseja proceder com os dados:
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => executeDelete('access_only')}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl transition-all flex flex-col items-center"
                >
                  <span className="text-sm">Manter Dados (apagar apenas acesso)</span>
                  <span className="text-[10px] opacity-60 font-medium">Os pontos e histórico de jogos permanecem no ranking.</span>
                </button>
                
                <button 
                  onClick={() => executeDelete('full_wipe')}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-100 transition-all flex flex-col items-center"
                >
                  <span className="text-sm">Eliminar Tudo (Limpeza Total)</span>
                  <span className="text-[10px] opacity-80 font-medium">Remove o acesso e APAGA todos os pontos e histórico.</span>
                </button>

                <button 
                  onClick={() => setUserToDelete(null)}
                  className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
        <button 
          onClick={() => setActiveSubView('stats')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeSubView === 'stats' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Estatísticas do Dia
        </button>
        <button 
          onClick={() => setActiveSubView('users')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeSubView === 'users' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          Gestão de Jogadores
        </button>
        <button 
          onClick={() => setActiveSubView('configs')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeSubView === 'configs' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Configurações
        </button>
      </div>

      {activeSubView === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Ranking do Dia</h2>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm font-bold text-emerald-600"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              {stats.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic">Nenhum registo encontrado.</div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <tr>
                      <th className="py-4 px-6">Jogador</th>
                      <th className="py-4 px-2 text-center">V</th>
                      <th className="py-4 px-2 text-center">E</th>
                      <th className="py-4 px-2 text-center">D</th>
                      <th className="py-4 px-6 text-right">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {stats.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-700">{s.name}</td>
                        <td className="py-4 px-2 text-center text-emerald-600 font-bold">{s.wins}</td>
                        <td className="py-4 px-2 text-center text-amber-600 font-bold">{s.draws}</td>
                        <td className="py-4 px-2 text-center text-rose-600 font-bold">{s.losses}</td>
                        <td className="py-4 px-6 text-right font-black text-emerald-600 text-lg">{s.totalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubView === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Jogadores Registados</h2>
              <p className="text-sm text-slate-500">Aprove novos registos ou faça a gestão da lista.</p>
            </div>
            <button 
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              {showAddUser ? 'Fechar' : '+ Novo Jogador'}
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddManualUser} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
              <h3 className="font-bold text-slate-800 mb-4">Adicionar Manualmente</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input 
                  type="text" placeholder="Nome do Jogador" value={newUserName} onChange={e => setNewUserName(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <input 
                  type="text" placeholder="Telemóvel" value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <input 
                  type="password" placeholder="Password Provisória" value={newUserPass} onChange={e => setNewUserPass(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700">Gravar Novo Jogador</button>
            </form>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                  <tr>
                    <th className="py-4 px-6">Jogador</th>
                    <th className="py-4 px-6">Telemóvel</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {allUsers.length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-slate-400">Sem jogadores registados além do master admin.</td></tr>
                  ) : (
                    allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-6 font-bold text-slate-800">{u.name} {u.isAdmin && <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">Admin</span>}</td>
                        <td className="py-4 px-6 text-slate-500">{u.phone}</td>
                        <td className="py-4 px-6">
                          {u.isApproved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Ativo</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">Pendente</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {!u.isApproved && (
                            <button 
                              onClick={() => handleApproveUser(u)}
                              className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600"
                            >
                              Aprovar
                            </button>
                          )}
                          <button 
                            onClick={() => setUserToDelete(u)}
                            className="text-rose-400 hover:text-rose-600 font-bold text-xs"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubView === 'configs' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Jogos por Turno</h3>
            <button 
              onClick={saveConfigs}
              disabled={saveStatus !== 'idle'}
              className={`text-xs px-6 py-2.5 rounded-xl font-bold transition-all ${
                saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-700' : 
                saveStatus === 'saving' ? 'bg-slate-100 text-slate-400' : 
                'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100'
              }`}
            >
              {saveStatus === 'idle' && 'Guardar Configurações'}
              {saveStatus === 'saving' && 'A Guardar...'}
              {saveStatus === 'saved' && '✓ Guardado'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SHIFTS.map((shift) => (
              <div key={shift} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{shift}</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="number" min="1" value={shiftConfigs[shift] || ''}
                    onChange={(e) => handleShiftConfigChange(shift, e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-base font-black text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-400 font-bold">JOGOS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
