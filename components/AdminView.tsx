
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

  const [userToDelete, setUserToDelete] = useState<User | null>(null);
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

  const saveConfigs = () => {
    setSaveStatus('saving');
    storage.saveShiftConfigs(shiftConfigs);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
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
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubView === 'stats' ? 'bg-slate-100 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
        >
          Estatísticas
        </button>
        <button 
          onClick={() => setActiveSubView('users')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubView === 'users' ? 'bg-slate-100 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
        >
          Jogadores
        </button>
        <button 
          onClick={() => setActiveSubView('configs')}
          className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubView === 'configs' ? 'bg-slate-100 text-slate-900 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
        >
          Config
        </button>
      </div>

      {activeSubView === 'stats' && (
        <div className="space-y-6">
          <div className="glass-card p-8 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Ranking Diário</h2>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Gestão e exportação</p>
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
                  className="bg-transparent text-sm font-bold text-slate-100 outline-none"
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
                      <th className="py-5 px-8 text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {stats.map((s, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="py-5 px-8 font-bold text-slate-100">{s.name}</td>
                        <td className="py-5 px-2 text-center text-emerald-500 font-black">{s.wins}</td>
                        <td className="py-5 px-2 text-center text-amber-500 font-black">{s.draws}</td>
                        <td className="py-5 px-2 text-center text-rose-500 font-black">{s.losses}</td>
                        <td className="py-5 px-8 text-right font-black text-white text-xl">{s.totalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};