
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
  const [isExporting, setIsExporting] = useState(false);

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
    const userMap: Record<string, { name: string, totalPoints: number, wins: number, draws: number, losses: number, recordIds: string[] }> = {};
    filteredRecords.forEach(r => {
      if (!userMap[r.userId]) {
        userMap[r.userId] = { name: r.userName, totalPoints: 0, wins: 0, draws: 0, losses: 0, recordIds: [] };
      }
      userMap[r.userId].totalPoints += r.points;
      userMap[r.userId].recordIds.push(r.id);
      r.results.forEach(res => {
        if (res === ResultType.WIN) userMap[r.userId].wins++;
        else if (res === ResultType.DRAW) userMap[r.userId].draws++;
        else if (res === ResultType.LOSS) userMap[r.userId].losses++;
      });
    });
    return Object.values(userMap).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [filteredRecords]);

  const saveConfigs = () => {
    setSaveStatus('saving');
    storage.saveShiftConfigs(shiftConfigs);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleClearAllHistory = () => {
    const confirm1 = window.confirm("CUIDADO: Esta ação irá apagar TODOS os resultados e pontos acumulados de TODOS os jogadores para sempre.");
    if (confirm1) {
      const confirm2 = window.prompt("Para confirmar, escreva 'APAGAR' em maiúsculas:");
      if (confirm2 === 'APAGAR') {
        storage.clearAllRecords();
        refreshData();
        alert("Histórico totalmente limpo. O ranking recomeça do zero.");
      } else {
        alert("Ação cancelada. O texto de confirmação estava incorreto.");
      }
    }
  };

  const handleDeleteIndividualRecord = (recordId: string) => {
    if (window.confirm("Deseja apagar este registo específico? Os pontos serão removidos do jogador.")) {
      storage.deleteRecord(recordId);
      refreshData();
    }
  };

  const handleApproveUser = (userId: string) => {
    const users = storage.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      storage.updateUser({ ...user, isApproved: true });
      refreshData();
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Deseja apagar este utilizador e todo o seu histórico individual?")) {
      storage.deleteUser(userId);
      storage.deleteRecordsByUser(userId);
      refreshData();
    }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const XLSX = await import('https://esm.sh/xlsx');
      const { utils, writeFile } = XLSX;
      const userStatsMap: Record<string, any> = {};
      allUsers.forEach(u => {
        const entry: any = { 'Jogador': u.name, 'Telemóvel': u.phone };
        SHIFTS.forEach(s => { entry[`Pontos ${s}`] = 0; });
        entry['Total Acumulado'] = 0;
        userStatsMap[u.id] = entry;
      });
      allRecords.forEach(r => {
        if (!userStatsMap[r.userId]) {
          userStatsMap[r.userId] = { 'Jogador': r.userName + ' (Removido)', 'Telemóvel': 'N/A' };
          SHIFTS.forEach(s => { userStatsMap[r.userId][`Pontos ${s}`] = 0; });
          userStatsMap[r.userId]['Total Acumulado'] = 0;
        }
        userStatsMap[r.userId][`Pontos ${r.shift}`] += r.points;
        userStatsMap[r.userId]['Total Acumulado'] += r.points;
      });
      const exportData = Object.values(userStatsMap).sort((a, b) => b['Total Acumulado'] - a['Total Acumulado']);
      const ws = utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Rankings");
      writeFile(wb, `Ranking_LevelUP_Global_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      alert("Erro na exportação.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 glass-card p-2 rounded-2xl border border-white/5">
        <button 
          onClick={() => setActiveSubView('stats')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubView === 'stats' ? 'bg-[#8ea8cc] text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
        >
          Estatísticas
        </button>
        <button 
          onClick={() => setActiveSubView('users')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubView === 'users' ? 'bg-[#8ea8cc] text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
        >
          Jogadores
        </button>
        <button 
          onClick={() => setActiveSubView('configs')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubView === 'configs' ? 'bg-[#8ea8cc] text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
        >
          Configurações
        </button>
      </div>

      {activeSubView === 'stats' && (
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Ranking Diário</h2>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Gestão de resultados por dia</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={handleExportExcel}
                disabled={isExporting}
                className={`bg-white/5 text-slate-300 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all ${isExporting ? 'opacity-50' : ''}`}
              >
                {isExporting ? 'A exportar...' : 'Exportar Global (.XLSX)'}
              </button>
              <div className="bg-slate-950/50 px-5 py-2.5 rounded-2xl border border-slate-800 flex items-center space-x-3">
                <span className="text-[10px] font-black text-slate-600 uppercase">Data</span>
                <input 
                  type="date" value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-100 outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              {stats.length === 0 ? (
                <div className="p-16 text-center text-slate-700 italic">Sem resultados registados para este dia.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/40 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                      <th className="py-5 px-8">Jogador</th>
                      <th className="py-5 px-2 text-center">V</th>
                      <th className="py-5 px-2 text-center">E</th>
                      <th className="py-5 px-2 text-center">D</th>
                      <th className="py-5 px-2 text-center">Pts</th>
                      <th className="py-5 px-8 text-right">Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {stats.map((s, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="py-5 px-8 font-bold text-slate-100">{s.name}</td>
                        <td className="py-5 px-2 text-center text-emerald-500 font-black">{s.wins}</td>
                        <td className="py-5 px-2 text-center text-[#8ea8cc] font-black">{s.draws}</td>
                        <td className="py-5 px-2 text-center text-rose-500 font-black">{s.losses}</td>
                        <td className="py-5 px-2 text-center font-black text-white text-xl">{s.totalPoints}</td>
                        <td className="py-5 px-8 text-right">
                          <button 
                            onClick={() => {
                              // Se houver múltiplos recordIds, poderíamos listar, mas aqui apagamos o mais recente deste dia
                              if(s.recordIds.length > 0) handleDeleteIndividualRecord(s.recordIds[s.recordIds.length - 1]);
                            }}
                            className="bg-red-500/10 text-red-500 p-2 rounded-lg hover:bg-red-500/20 border border-red-500/20"
                            title="Apagar último registo deste dia"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
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
        <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/30">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Gestão de Utilizadores</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/20 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                  <th className="py-4 px-6">Nome</th>
                  <th className="py-4 px-6">Telemóvel</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-all group">
                    <td className="py-4 px-6 font-bold text-white">{u.name} {u.isAdmin && <span className="text-[10px] bg-[#8ea8cc]/20 text-[#8ea8cc] px-2 py-0.5 rounded-full ml-2">ADMIN</span>}</td>
                    <td className="py-4 px-6 text-slate-400">{u.phone}</td>
                    <td className="py-4 px-6">
                      {u.isApproved ? (
                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">Ativo</span>
                      ) : (
                        <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Pendente</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right flex justify-end gap-2">
                      {!u.isApproved && (
                        <button 
                          onClick={() => handleApproveUser(u.id)}
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-500/20"
                        >
                          Aprovar
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-500/20"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubView === 'configs' && (
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-[2rem] border border-slate-800">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">Configuração de Jogos</h2>
            <div className="space-y-6">
              {SHIFTS.map(s => (
                <div key={s} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#8ea8cc]/10 text-[#8ea8cc] rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span className="font-bold text-white text-sm uppercase">{s}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sets por turno:</span>
                    <input 
                      type="number"
                      min="1"
                      max="10"
                      value={shiftConfigs[s] || 4}
                      onChange={(e) => setShiftConfigs({ ...shiftConfigs, [s]: parseInt(e.target.value) || 1 })}
                      className="w-20 px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center font-black text-[#8ea8cc]"
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={saveConfigs}
                  className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-[#8ea8cc] text-slate-900'}`}
                >
                  {saveStatus === 'saving' ? 'A Gravar...' : saveStatus === 'saved' ? 'Configuração Gravada!' : 'Gravar Configurações'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-2 border-red-500/20 bg-red-500/5 shadow-2xl shadow-red-500/5">
            <div className="flex items-center gap-5 mb-8">
              <div className="p-4 bg-red-500/20 text-red-500 rounded-3xl border border-red-500/30 shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-red-500 italic uppercase tracking-tighter">Zona de Perigo</h2>
                <p className="text-[10px] text-red-500/60 font-black uppercase tracking-[0.3em]">Ações irreversíveis do sistema</p>
              </div>
            </div>
            
            <div className="p-8 bg-slate-900/60 rounded-[2rem] border border-red-500/10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 transition-all hover:bg-slate-900/80">
              <div className="max-w-xl">
                <h3 className="font-black text-white text-base uppercase mb-2 tracking-wide">Apagar Todo o Histórico do Ranking</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Esta opção irá eliminar permanentemente todos os registos de jogos, sets e pontos de todos os jogadores. O Hall of Fame será reiniciado. Recomendamos exportar o ranking atual para Excel antes de prosseguir.</p>
              </div>
              <button 
                onClick={handleClearAllHistory}
                className="bg-red-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all hover:scale-105 active:scale-95 border-b-4 border-red-800"
              >
                Limpar Ranking Total
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};