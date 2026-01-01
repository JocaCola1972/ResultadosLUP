
import React, { useState, useEffect, useMemo } from 'react';
import { MatchRecord, ShiftID, ResultType } from '../types';
import { storage } from '../services/storage';
import { SHIFTS } from '../constants';

export const AdminView: React.FC = () => {
  const [allRecords, setAllRecords] = useState<MatchRecord[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftConfigs, setShiftConfigs] = useState<Record<string, number>>(storage.getShiftConfigs());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setAllRecords(storage.getRecords());
  }, []);

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
      
      // Iterate over all results in the record
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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Levantamento de Pontos</h2>
            <p className="text-sm text-slate-500">Veja o desempenho global dos jogadores por dia.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600">Filtrar Data:</span>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Ranking Diário</h3>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                {filteredRecords.length} Turnos Registados
              </span>
            </div>
            <div className="overflow-x-auto">
              {stats.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic">
                  Nenhum registo encontrado para esta data.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-6">Jogador</th>
                      <th className="py-3 px-2 text-center">V</th>
                      <th className="py-3 px-2 text-center">E</th>
                      <th className="py-3 px-2 text-center">D</th>
                      <th className="py-3 px-6 text-right">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {stats.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-800">{s.name}</td>
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

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Configuração de Jogos por Turno</h3>
              <button 
                onClick={saveConfigs}
                disabled={saveStatus !== 'idle'}
                className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${
                  saveStatus === 'saved' ? 'bg-emerald-100 text-emerald-700' : 
                  saveStatus === 'saving' ? 'bg-slate-100 text-slate-400' : 
                  'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {saveStatus === 'idle' && 'Guardar Configurações'}
                {saveStatus === 'saving' && 'A Guardar...'}
                {saveStatus === 'saved' && '✓ Guardado'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6">Defina quantos jogos são realizados em cada turno. Os jogadores terão de preencher todos para poder submeter.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SHIFTS.map((shift) => (
                <div key={shift} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{shift}</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      min="1"
                      value={shiftConfigs[shift] || ''}
                      onChange={(e) => handleShiftConfigChange(shift, e.target.value)}
                      placeholder="1"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-400 font-medium">Jogos</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-200">
            <h3 className="text-lg font-bold mb-2">Resumo do Dia</h3>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-emerald-50 text-sm">
                <span>Total de Pontos Atribuídos:</span>
                <span className="font-bold">{stats.reduce((acc, curr) => acc + curr.totalPoints, 0)}</span>
              </div>
              <div className="flex justify-between text-emerald-50 text-sm">
                <span>Total de Vitórias (Jogos):</span>
                <span className="font-bold">{stats.reduce((acc, curr) => acc + curr.wins, 0)}</span>
              </div>
              <div className="flex justify-between text-emerald-50 text-sm">
                <span>Total de Empates (Jogos):</span>
                <span className="font-bold">{stats.reduce((acc, curr) => acc + curr.draws, 0)}</span>
              </div>
              <div className="flex justify-between text-emerald-50 text-sm">
                <span>Total de Derrotas (Jogos):</span>
                <span className="font-bold">{stats.reduce((acc, curr) => acc + curr.losses, 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4">Informação Técnica</h3>
            <ul className="text-xs text-slate-500 space-y-2 border-b border-slate-50 pb-4 mb-4">
              <li className="flex justify-between">
                <span>Vitória:</span>
                <span className="font-medium text-slate-700">4 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Empate:</span>
                <span className="font-medium text-slate-700">2 pts</span>
              </li>
              <li className="flex justify-between">
                <span>Derrota:</span>
                <span className="font-medium text-slate-700">1 pt</span>
              </li>
            </ul>
            <p className="text-[10px] text-slate-400 italic">
              * A pontuação total de um utilizador num turno é a soma dos pontos de cada jogo individual desse turno.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
