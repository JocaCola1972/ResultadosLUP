
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

  // Number of games for current shift
  const requiredGames = useMemo(() => {
    return shiftConfigs[selectedShift] || 1; // Default to 1 if not configured
  }, [shiftConfigs, selectedShift]);

  // Reset/Adjust current results when shift or config changes
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
    
    // Check if record exists for this date and shift
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
    // Reset for next
    setCurrentResults(new Array(requiredGames).fill(null));
  };

  const allFilled = currentResults.every(r => r !== null);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Registar Turno
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Data do Jogo</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Turno</label>
            <select 
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as ShiftID)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Resultados do Turno ({requiredGames} jogos definidos)
            </h3>
            <span className="text-xs font-medium text-emerald-600">
              {currentResults.filter(r => r !== null).length} / {requiredGames} preenchidos
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentResults.map((result, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="font-bold text-slate-700">Jogo {idx + 1}</span>
                <div className="flex gap-2">
                  {(Object.keys(ResultType) as Array<keyof typeof ResultType>).map((key) => {
                    const res = ResultType[key];
                    const isSelected = result === res;
                    
                    let activeClass = "";
                    if (res === ResultType.WIN) activeClass = "bg-emerald-600 text-white shadow-lg shadow-emerald-100";
                    if (res === ResultType.DRAW) activeClass = "bg-amber-500 text-white shadow-lg shadow-amber-100";
                    if (res === ResultType.LOSS) activeClass = "bg-rose-500 text-white shadow-lg shadow-rose-100";

                    return (
                      <button
                        key={res}
                        onClick={() => handleResultChange(idx, res)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                          isSelected ? activeClass : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
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
          className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
            allFilled 
              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 active:scale-[0.98]" 
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          Gravar Resultados do Turno
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Os Meus Registos</h2>
        <div className="overflow-x-auto">
          {records.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic">
              Ainda não tem nenhum jogo registado. Comece por registar acima!
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-2">Data</th>
                  <th className="py-3 px-2">Turno</th>
                  <th className="py-3 px-2">Resumo</th>
                  <th className="py-3 px-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
                  <tr key={r.id} className="text-sm">
                    <td className="py-3 px-2 text-slate-600">{new Date(r.date).toLocaleDateString('pt-PT')}</td>
                    <td className="py-3 px-2 font-medium text-slate-800">{r.shift}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        {r.results.map((res, i) => (
                          <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${
                            res === ResultType.WIN ? 'bg-emerald-100 text-emerald-600' :
                            res === ResultType.LOSS ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {res[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-emerald-600">{r.points}</td>
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
