
import React, { useState, useEffect, useMemo } from 'react';
import { MatchRecord, ShiftID, ResultType } from '../types';
import { storage } from '../services/storage';
import { SHIFTS } from '../constants';

type RankingMode = 'shift' | 'global';

export const ShiftRankingView: React.FC = () => {
  const [allRecords, setAllRecords] = useState<MatchRecord[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState<RankingMode>('shift');

  useEffect(() => {
    setAllRecords(storage.getRecords());
  }, []);

  const rankingsByShift = useMemo(() => {
    const results: Record<ShiftID, any[]> = {
      [ShiftID.SHIFT_1]: [],
      [ShiftID.SHIFT_2]: [],
      [ShiftID.SHIFT_3]: [],
    };
    SHIFTS.forEach(shift => {
      const shiftRecords = allRecords.filter(r => r.date === filterDate && r.shift === shift);
      const userMap: Record<string, any> = {};
      shiftRecords.forEach(r => {
        if (!userMap[r.userId]) userMap[r.userId] = { userId: r.userId, name: r.userName, points: 0, wins: 0, draws: 0, losses: 0 };
        userMap[r.userId].points += r.points;
        r.results.forEach(res => {
          if (res === ResultType.WIN) userMap[r.userId].wins++;
          else if (res === ResultType.DRAW) userMap[r.userId].draws++;
          else if (res === ResultType.LOSS) userMap[r.userId].losses++;
        });
      });
      results[shift] = Object.values(userMap).sort((a, b) => b.points - a.points);
    });
    return results;
  }, [allRecords, filterDate]);

  const globalRanking = useMemo(() => {
    const userMap: Record<string, any> = {};
    allRecords.forEach(r => {
      if (!userMap[r.userId]) userMap[r.userId] = { userId: r.userId, name: r.userName, points: 0, wins: 0, draws: 0, losses: 0, totalGames: 0 };
      userMap[r.userId].points += r.points;
      r.results.forEach(res => {
        userMap[r.userId].totalGames++;
        if (res === ResultType.WIN) userMap[r.userId].wins++;
        else if (res === ResultType.DRAW) userMap[r.userId].draws++;
        else if (res === ResultType.LOSS) userMap[r.userId].losses++;
      });
    });
    return Object.values(userMap).sort((a, b) => b.points - a.points);
  }, [allRecords]);

  return (
    <div className="space-y-8">
      <div className="glass-card p-8 rounded-3xl border border-teal-900/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Classificações</h2>
            <p className="text-xs text-teal-500/60 uppercase font-bold tracking-widest mt-1">Quadro de honra e rankings globais</p>
          </div>
          
          <div className="flex bg-teal-950/80 p-1.5 rounded-2xl border border-teal-900/50">
            <button 
              onClick={() => setMode('shift')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === 'shift' ? 'bg-teal-500 text-teal-950 shadow-lg' : 'text-teal-500/50 hover:text-teal-300'
              }`}
            >
              Turno
            </button>
            <button 
              onClick={() => setMode('global')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === 'global' ? 'bg-teal-500 text-teal-950 shadow-lg' : 'text-teal-500/50 hover:text-teal-300'
              }`}
            >
              Global
            </button>
          </div>
        </div>
      </div>

      {mode === 'shift' ? (
        <>
          <div className="flex justify-center">
            <div className="glass-card px-8 py-3 rounded-full border border-teal-900/50 flex items-center space-x-4">
              <span className="text-[10px] font-black text-teal-500 uppercase">Consultar</span>
              <input 
                type="date" value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-teal-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {SHIFTS.map((shift) => (
              <div key={shift} className="glass-card rounded-3xl border border-teal-900/50 overflow-hidden">
                <div className="p-6 border-b border-teal-900/50 bg-teal-950/30 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="p-2.5 bg-teal-500/10 text-teal-500 rounded-xl border border-teal-500/20">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-sm uppercase italic tracking-wider">{shift}</h3>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {rankingsByShift[shift].length === 0 ? (
                    <div className="p-16 text-center text-teal-800 italic text-xs font-medium uppercase tracking-widest">
                      Sem batalhas registadas neste turno.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-teal-950/20 text-teal-500/50 text-[10px] uppercase font-black tracking-widest border-b border-teal-900/30">
                          <th className="py-5 px-8 w-20 text-center">#</th>
                          <th className="py-5 px-2">Jogador</th>
                          <th className="py-5 px-2 text-center">V</th>
                          <th className="py-5 px-2 text-center">E</th>
                          <th className="py-5 px-2 text-center">D</th>
                          <th className="py-5 px-8 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-900/30">
                        {rankingsByShift[shift].map((player, idx) => (
                          <tr key={player.userId} className="hover:bg-teal-500/5 transition-all group">
                            <td className="py-5 px-8 text-center">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black border transition-all group-hover:rotate-12 ${
                                idx === 0 ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' :
                                idx === 1 ? 'bg-slate-400/20 text-slate-400 border-slate-400/40' :
                                idx === 2 ? 'bg-orange-500/20 text-orange-500 border-orange-500/40' :
                                'text-teal-800 border-teal-900'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-5 px-2">
                              <div className="font-black text-teal-100 text-sm uppercase tracking-wide">{player.name}</div>
                            </td>
                            <td className="py-5 px-2 text-center text-teal-400 font-black">{player.wins}</td>
                            <td className="py-5 px-2 text-center text-amber-500 font-black">{player.draws}</td>
                            <td className="py-5 px-2 text-center text-rose-500 font-black">{player.losses}</td>
                            <td className="py-5 px-8 text-right">
                              <span className="text-xl font-black text-teal-400">{player.points}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card rounded-3xl border border-teal-900/50 overflow-hidden relative">
          <div className="p-8 border-b border-teal-900/50 bg-gradient-to-r from-teal-950/80 to-teal-900/50 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-teal-500 text-teal-950 rounded-2xl shadow-xl shadow-teal-500/20 transform -rotate-3">
                <svg className="w-6 h-6 rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-black text-white text-lg italic uppercase tracking-tighter">Ranking Global Hall of Fame</h3>
                <p className="text-[10px] text-teal-500/50 font-black uppercase tracking-[0.3em]">Todas as épocas</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {globalRanking.length === 0 ? (
              <div className="p-16 text-center text-teal-800 italic uppercase font-black tracking-widest">
                Ranking global indisponível.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-teal-950/20 text-teal-500/40 text-[10px] uppercase font-black tracking-widest border-b border-teal-900/30">
                    <th className="py-6 px-8 w-24 text-center">Posição</th>
                    <th className="py-6 px-2">Lenda</th>
                    <th className="py-6 px-2 text-center">Jogos</th>
                    <th className="py-6 px-2 text-center">V</th>
                    <th className="py-6 px-2 text-center">E</th>
                    <th className="py-6 px-2 text-center">D</th>
                    <th className="py-6 px-8 text-right">Total Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-900/20">
                  {globalRanking.map((player, idx) => (
                    <tr key={player.userId} className={`transition-all ${idx < 3 ? 'bg-teal-500/5' : 'hover:bg-teal-500/5'}`}>
                      <td className="py-6 px-8 text-center">
                        <div className="flex justify-center">
                          {idx === 0 ? (
                            <span className="text-3xl filter drop-shadow-md animate-bounce">👑</span>
                          ) : (
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-xs font-black border ${
                              idx === 1 ? 'bg-slate-300/10 text-slate-300 border-slate-300/30' :
                              idx === 2 ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' :
                              'text-teal-900 border-teal-950'
                            }`}>
                              {idx + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-6 px-2">
                        <div className="font-black text-white text-base uppercase italic tracking-wide">{player.name}</div>
                      </td>
                      <td className="py-6 px-2 text-center font-bold text-teal-100/40">{player.totalGames}</td>
                      <td className="py-6 px-2 text-center text-teal-400 font-black">{player.wins}</td>
                      <td className="py-6 px-2 text-center text-amber-500 font-black">{player.draws}</td>
                      <td className="py-6 px-2 text-center text-rose-500 font-black">{player.losses}</td>
                      <td className="py-6 px-8 text-right">
                        <span className="text-2xl font-black text-teal-400 bg-teal-500/10 px-4 py-2 rounded-2xl border border-teal-500/20">{player.points}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};