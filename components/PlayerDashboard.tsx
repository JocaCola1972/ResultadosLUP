
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
      <section className="glass-card rounded-3xl p-8 border-l-4 border-teal-500 shadow-2xl relative overflow-hidden">
        {/* Motif decorativo */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-teal-500/5 rounded-full border border-teal-500/10 rotate-12 flex items-center justify-center pointer-events-none">
            <svg className="w-16 h-16 text-teal-500/20" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
            </svg>
        </div>

        <h2 className="text-2xl font-black text-white mb-8 flex items-center uppercase italic tracking-tighter">
          <span className="w-2 h-8 bg-teal-500 mr-3 rounded-full"></span>
          Registar Turno
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-2 ml-1">Data da Sessão</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-5 py-3 bg-teal-950/40 border border-teal-800 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 text-white font-bold"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-teal-500 uppercase tracking-[0.2em] mb-2 ml-1">Turno de Jogo</label>
            <select 
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as ShiftID)}
              className="w-full px-5 py-3 bg-teal-950/40 border border-teal-800 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 text-white font-bold appearance-none cursor-pointer"
            >
              {SHIFTS.map(s => <option key={s} value={s} className="bg-teal-950 text-white">{s}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div className="flex items-center justify-between border-b border-teal-900/50 pb-4">
            <h3 className="text-[10px] font-black text-teal-500/60 uppercase tracking-widest">
              Jogos do Turno ({requiredGames})
            </h3>
            <span className="text-[10px] font-black bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full border border-teal-500/20 uppercase">
              {currentResults.filter(r => r !== null).length} / {requiredGames} OK
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentResults.map((result, idx) => (
              <div key={idx} className="bg-teal-950/30 p-5 rounded-2xl border border-teal-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-teal-950/50">
                <span className="font-black text-teal-100 uppercase text-xs tracking-widest">Jogo {idx + 1}</span>
                <div className="flex gap-2">
                  {(Object.keys(ResultType) as Array<keyof typeof ResultType>).map((key) => {
                    const res = ResultType[key];
                    const isSelected = result === res;
                    
                    let activeClass = "";
                    if (res === ResultType.WIN) activeClass = "bg-teal-500 text-teal-950 shadow-lg shadow-teal-500/20";
                    if (res === ResultType.DRAW) activeClass = "bg-amber-500 text-white shadow-lg shadow-amber-500/20";
                    if (res === ResultType.LOSS) activeClass = "bg-rose-500 text-white shadow-lg shadow-rose-500/20";

                    return (
                      <button
                        key={res}
                        onClick={() => handleResultChange(idx, res)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          isSelected ? activeClass + " border-transparent" : "bg-teal-900/20 text-teal-500/50 border-teal-800 hover:border-teal-500/30"
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
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-sm transition-all shadow-xl ${
            allFilled 
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-teal-950 hover:scale-[1.01] active:scale-[0.99] shadow-teal-500/20" 
              : "bg-teal-900/40 text-teal-800 cursor-not-allowed border border-teal-900"
          }`}
        >
          Finalizar Registo
        </button>
      </section>

      <section className="glass-card rounded-3xl p-8 border border-teal-900/50 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Histórico</h2>
            <div className="p-2 bg-teal-500/10 rounded-lg text-teal-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>

        <div className="overflow-x-auto">
          {records.length === 0 ? (
            <div className="text-center py-12 text-teal-800 italic text-sm font-medium border-2 border-dashed border-teal-900/50 rounded-2xl">
              Ainda não registaste nenhum jogo nesta quadra.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-teal-900/50 text-teal-500/60 text-[10px] font-black uppercase tracking-widest">
                  <th className="py-4 px-2">Data</th>
                  <th className="py-4 px-2">Turno</th>
                  <th className="py-4 px-2">Sets</th>
                  <th className="py-4 px-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-900/30">
                {records.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
                  <tr key={r.id} className="text-sm hover:bg-teal-500/5 transition-colors group">
                    <td className="py-4 px-2 text-teal-100/60 font-medium">{new Date(r.date).toLocaleDateString('pt-PT')}</td>
                    <td className="py-4 px-2 font-bold text-white uppercase text-xs">{r.shift}</td>
                    <td className="py-4 px-2">
                      <div className="flex gap-1.5">
                        {r.results.map((res, i) => (
                          <span key={i} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black border transition-transform group-hover:scale-110 ${
                            res === ResultType.WIN ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' :
                            res === ResultType.LOSS ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {res[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right font-black text-teal-400 text-lg">{r.points}</td>
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