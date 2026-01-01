
import React, { useState, useEffect, useMemo } from 'react';
import { User, ShiftID, ResultType, MatchRecord } from '../types';
import { SHIFTS, POINTS_MAP } from '../constants';
import { storage } from '../services/storage';

interface PlayerDashboardProps {
  user: User;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ user }) => {
  const [selectedShift, setSelectedShift] = useState<ShiftID>(SHIFTS[0]);
  const [records, setRecords] = useState<MatchRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftConfigs, setShiftConfigs] = useState<Record<string, number>>(storage.getShiftConfigs());
  const [currentResults, setCurrentResults] = useState<(ResultType | null)[]>([]);

  useEffect(() => {
    const all = storage.getRecords();
    setRecords(all.filter(r => r.userId === user.id));
    setShiftConfigs(storage.getShiftConfigs());
  }, [user.id]);

  const requiredGames = useMemo(() => {
    return shiftConfigs[selectedShift] || 1;
  }, [shiftConfigs, selectedShift]);

  useEffect(() => {
    setCurrentResults(new Array(requiredGames).fill(null));
  }, [selectedShift, requiredGames]);

  const handleResultChange = (index: number, result: ResultType) => {
    const newResults = [...currentResults];
    newResults[index] = result;
    setCurrentResults(newResults);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = records.find(r => r.date === date && r.shift === selectedShift);
    if (existing) {
      alert("Já registou os resultados para este turno e data!");
      return;
    }
    if (currentResults.some(r => r === null)) {
      alert("Por favor preencha os resultados de todos os jogos.");
      return;
    }
    const finalResults = currentResults as ResultType[];
    const totalPoints = finalResults.reduce((sum, res) => sum + POINTS_MAP[res], 0);
    const newRecord: MatchRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      date,
      shift: selectedShift,
      results: finalResults,
      points: totalPoints
    };
    storage.saveRecord(newRecord);
    setRecords([...records, newRecord]);
    setCurrentResults(new Array(requiredGames).fill(null));
  };

  const allFilled = currentResults.every(r => r !== null);

  return (
    <div className="space-y-8">
      <section className="glass-card rounded-[2.5rem] p-8 border-l-8 border-[#8ea8cc] shadow-2xl relative overflow-hidden">
        {/* Motif decorativo */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full border border-[#8ea8cc]/10 rotate-12 flex items-center justify-center pointer-events-none">
            <img src="logo.png" className="w-24 h-24 opacity-20 object-contain" alt="" />
        </div>

        <h2 className="text-3xl font-black text-white mb-8 flex items-center uppercase italic tracking-tighter">
          <span className="w-2 h-10 bg-[#8ea8cc] mr-4 rounded-full"></span>
          Registar Turno
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#8ea8cc] uppercase tracking-[0.3em] ml-1">Data da Sessão</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#8ea8cc] text-white font-bold transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-[#8ea8cc] uppercase tracking-[0.3em] ml-1">Turno de Jogo</label>
            <div className="relative">
              <select 
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value as ShiftID)}
                className="w-full px-6 py-4 bg-slate-900/50 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-[#8ea8cc] text-white font-bold appearance-none cursor-pointer"
              >
                {SHIFTS.map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>)}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8ea8cc]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Contagem de Jogos ({requiredGames})
            </h3>
            <span className="text-[10px] font-black bg-[#8ea8cc]/10 text-[#8ea8cc] px-4 py-1.5 rounded-full border border-[#8ea8cc]/20 uppercase">
              {currentResults.filter(r => r !== null).length} / {requiredGames} Selecionados
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentResults.map((result, idx) => (
              <div key={idx} className="bg-slate-900/40 p-6 rounded-[1.5rem] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all hover:bg-slate-800/40">
                <span className="font-black text-slate-300 uppercase text-xs tracking-[0.2em]">Jogo {idx + 1}</span>
                <div className="flex gap-2">
                  {(Object.keys(ResultType) as Array<keyof typeof ResultType>).map((key) => {
                    const res = ResultType[key];
                    const isSelected = result === res;
                    
                    let activeClass = "";
                    if (res === ResultType.WIN) activeClass = "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
                    if (res === ResultType.DRAW) activeClass = "bg-[#8ea8cc] text-slate-900 shadow-lg shadow-[#8ea8cc]/20";
                    if (res === ResultType.LOSS) activeClass = "bg-rose-500 text-white shadow-lg shadow-rose-500/20";

                    return (
                      <button
                        key={res}
                        onClick={() => handleResultChange(idx, res)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          isSelected ? activeClass + " border-transparent" : "bg-white/5 text-slate-500 border-slate-800 hover:border-[#8ea8cc]/50"
                        }`}
                      >
                        {res}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-sm transition-all shadow-2xl ${
            allFilled 
              ? "bg-gradient-to-r from-[#8ea8cc] to-[#b8c8d9] text-slate-900 hover:scale-[1.01] active:scale-[0.99] shadow-[#8ea8cc]/10" 
              : "bg-slate-900/60 text-slate-700 cursor-not-allowed border border-slate-800"
          }`}
        >
          Gravar Resultados
        </button>
      </section>

      <section className="glass-card rounded-[2.5rem] p-8 border border-[#8ea8cc]/10 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Histórico Pessoal</h2>
            <div className="p-3 bg-white/5 rounded-2xl text-[#8ea8cc] border border-[#8ea8cc]/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>

        <div className="overflow-x-auto">
          {records.length === 0 ? (
            <div className="text-center py-16 text-slate-600 italic text-sm font-medium border-4 border-dashed border-slate-800 rounded-[2rem]">
              Ainda não tens vitórias registadas na quadra. Começa agora!
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                  <th className="py-5 px-3">Data</th>
                  <th className="py-5 px-3">Turno</th>
                  <th className="py-5 px-3">Jogos</th>
                  <th className="py-5 px-3 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {records.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
                  <tr key={r.id} className="text-sm hover:bg-white/5 transition-all group">
                    <td className="py-5 px-3 text-slate-300 font-bold">{new Date(r.date).toLocaleDateString('pt-PT')}</td>
                    <td className="py-5 px-3 font-black text-white uppercase text-xs tracking-wider">{r.shift}</td>
                    <td className="py-5 px-3">
                      <div className="flex gap-2">
                        {r.results.map((res, i) => (
                          <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-xl text-[11px] font-black border transition-transform group-hover:scale-110 shadow-sm ${
                            res === ResultType.WIN ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            res === ResultType.LOSS ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-[#8ea8cc]/10 text-[#8ea8cc] border-[#8ea8cc]/20'
                          }`}>
                            {res[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-5 px-3 text-right">
                      <span className="text-2xl font-black text-[#8ea8cc]">{r.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};