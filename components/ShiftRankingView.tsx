
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
      <div className="glass-card p-8 rounded-[2rem] border border-[#8ea8cc]/10 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 bg-white p-2 rounded-2xl shadow-lg border border-[#8ea8cc]/30">
               <img src="logo.png" className="w-full h-full object-contain" alt="" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Classificações</h2>
              <p className="text-[10px] text-[#8ea8cc] uppercase font-black tracking-[0.3em] mt-1">Quadro de honra e rankings globais</p>
            </div>
          </div>
          
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <button 
              onClick={() => setMode('shift')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === 'shift' ? 'bg-[#8ea8cc] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Diário
            </button>
            <button 
              onClick={() => setMode('global')}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mode === 'global' ? 'bg-[#8ea8cc] text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Hall of Fame
            </button>
          </div>
        </div>
      </div>

      {mode === 'shift' ? (
        <>
          <div className="flex justify-center">
            <div className="glass-card px-10 py-4 rounded-full border border-[#8ea8cc]/20 flex items-center space-x-6 shadow-xl">
              <span className="text-[10px] font-black text-[#8ea8cc] uppercase tracking-widest">Filtrar Data</span>
              <input 
                type="date" value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-base font-black text-white outline-none cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
            {SHIFTS.map((shift) => (
              <div key={shift} className="glass-card rounded-[2.5rem] border border-[#8ea8cc]/10 overflow-hidden shadow-2xl">
                <div className="p-7 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800/50 flex justify-between items-center">
                  <div className="flex items-center space-x-5">
                    <div className="p-3 bg-white/5 text-[#8ea8cc] rounded-2xl border border-[#8ea8cc]/20">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-lg uppercase italic tracking-tighter">{shift}</h3>
                      <p className="text-[9px] text-[#8ea8cc] font-bold uppercase tracking-widest">Batalha do Dia</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {rankingsByShift[shift].length === 0 ? (
                    <div className="p-20 text-center text-slate-600 italic text-xs font-black uppercase tracking-[0.3em]">
                      Nenhum jogador entrou em campo neste turno.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-950/30 text-[#8ea8cc]/50 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-800">
                          <th className="py-6 px-10 w-24 text-center">Pos</th>
                          <th className="py-6 px-4">Lutador</th>
                          <th className="py-6 px-4 text-center">V</th>
                          <th className="py-6 px-4 text-center">E</th>
                          <th className="py-6 px-4 text-center">D</th>
                          <th className="py-6 px-10 text-right">Pontos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {rankingsByShift[shift].map((player, idx) => (
                          <tr key={player.userId} className={`hover:bg-white/5 transition-all group ${idx === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="py-6 px-10 text-center">
                              <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl text-sm font-black border transition-all group-hover:rotate-6 ${
                                idx === 0 ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-lg shadow-amber-400/20' :
                                idx === 1 ? 'bg-slate-300 text-slate-900 border-slate-200' :
                                idx === 2 ? 'bg-orange-400 text-slate-900 border-orange-300' :
                                'text-slate-400 border-slate-800'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-6 px-4">
                              <div className="font-black text-white text-base uppercase tracking-tight">{player.name}</div>
                            </td>
                            <td className="py-6 px-4 text-center text-emerald-400 font-black">{player.wins}</td>
                            <td className="py-6 px-4 text-center text-[#8ea8cc] font-black">{player.draws}</td>
                            <td className="py-6 px-4 text-center text-rose-500 font-black">{player.losses}</td>
                            <td className="py-6 px-10 text-right">
                              <span className={`text-2xl font-black ${idx === 0 ? 'text-amber-400' : 'text-[#8ea8cc]'}`}>{player.points}</span>
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
        <div className="glass-card rounded-[2.5rem] border border-[#8ea8cc]/10 overflow-hidden relative shadow-2xl">
          <div className="p-10 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white text-slate-950 rounded-3xl shadow-2xl transform -rotate-3 border-2 border-[#8ea8cc]/40">
                <img src="logo.png" className="w-10 h-10 object-contain" alt="" />
              </div>
              <div>
                <h3 className="font-black text-white text-2xl italic uppercase tracking-tighter">Hall of Fame Global</h3>
                <p className="text-[10px] text-[#8ea8cc] font-black uppercase tracking-[0.4em] opacity-70">A elite do LevelUP Padel</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {globalRanking.length === 0 ? (
              <div className="p-24 text-center text-slate-700 italic uppercase font-black tracking-widest">
                Sem lendas registadas no momento.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/30 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                    <th className="py-7 px-10 w-28 text-center">Elite</th>
                    <th className="py-7 px-4">Lenda</th>
                    <th className="py-7 px-4 text-center">Jogos</th>
                    <th className="py-7 px-4 text-center">V</th>
                    <th className="py-7 px-4 text-center">E</th>
                    <th className="py-7 px-4 text-center">D</th>
                    <th className="py-7 px-10 text-right">Total Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {globalRanking.map((player, idx) => (
                    <tr key={player.userId} className={`transition-all ${idx < 3 ? 'bg-white/[0.02]' : 'hover:bg-white/5'}`}>
                      <td className="py-8 px-10 text-center">
                        <div className="flex justify-center">
                          {idx === 0 ? (
                            <div className="relative">
                                <span className="text-4xl filter drop-shadow-lg animate-pulse">👑</span>
                                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded-full">#1</div>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl text-xs font-black border-2 ${
                              idx === 1 ? 'bg-slate-300/10 text-slate-200 border-slate-300/30 shadow-lg shadow-slate-300/5' :
                              idx === 2 ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/5' :
                              'text-slate-700 border-slate-900'
                            }`}>
                              {idx + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-8 px-4">
                        <div className="font-black text-white text-lg uppercase italic tracking-tighter">{player.name}</div>
                      </td>
                      <td className="py-8 px-4 text-center font-bold text-slate-400">{player.totalGames}</td>
                      <td className="py-8 px-4 text-center text-emerald-400 font-black">{player.wins}</td>
                      <td className="py-8 px-4 text-center text-[#8ea8cc] font-black">{player.draws}</td>
                      <td className="py-8 px-4 text-center text-rose-500 font-black">{player.losses}</td>
                      <td className="py-8 px-10 text-right">
                        <span className="text-3xl font-black text-white bg-white/5 px-6 py-3 rounded-[1.5rem] border border-[#8ea8cc]/30 shadow-xl shadow-black/20">{player.points}</span>
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