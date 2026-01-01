
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
    const results: Record<ShiftID, { userId: string, name: string, points: number, wins: number, draws: number, losses: number }[]> = {
      [ShiftID.SHIFT_1]: [],
      [ShiftID.SHIFT_2]: [],
      [ShiftID.SHIFT_3]: [],
    };

    SHIFTS.forEach(shift => {
      const shiftRecords = allRecords.filter(r => r.date === filterDate && r.shift === shift);
      const userMap: Record<string, { userId: string, name: string, points: number, wins: number, draws: number, losses: number }> = {};

      shiftRecords.forEach(r => {
        if (!userMap[r.userId]) {
          userMap[r.userId] = { userId: r.userId, name: r.userName, points: 0, wins: 0, draws: 0, losses: 0 };
        }
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
    const userMap: Record<string, { userId: string, name: string, points: number, wins: number, draws: number, losses: number, totalGames: number }> = {};

    allRecords.forEach(r => {
      if (!userMap[r.userId]) {
        userMap[r.userId] = { userId: r.userId, name: r.userName, points: 0, wins: 0, draws: 0, losses: 0, totalGames: 0 };
      }
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Classificações</h2>
            <p className="text-sm text-slate-500">Acompanha o desempenho diário e a pontuação acumulada.</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button 
              onClick={() => setMode('shift')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'shift' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Por Turno
            </button>
            <button 
              onClick={() => setMode('global')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'global' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Global
            </button>
          </div>
        </div>
      </div>

      {mode === 'shift' ? (
        <>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center space-x-4">
            <span className="text-sm text-slate-600 font-medium">Data:</span>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-sm font-bold text-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-8">
            {SHIFTS.map((shift) => (
              <div key={shift} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{shift}</h3>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Turno Específico</p>
                    </div>
                  </div>
                  <span className="bg-white px-3 py-1 rounded-full border border-slate-200 text-[10px] font-black text-slate-500 uppercase">
                    {rankingsByShift[shift].length} Ativos
                  </span>
                </div>

                <div className="overflow-x-auto">
                  {rankingsByShift[shift].length === 0 ? (
                    <div className="p-12 text-center text-slate-400 italic text-sm">
                      Sem resultados neste turno para a data selecionada.
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-50">
                          <th className="py-4 px-6 w-16 text-center">#</th>
                          <th className="py-4 px-2">Jogador</th>
                          <th className="py-4 px-2 text-center">V</th>
                          <th className="py-4 px-2 text-center">E</th>
                          <th className="py-4 px-2 text-center">D</th>
                          <th className="py-4 px-6 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {rankingsByShift[shift].map((player, idx) => (
                          <tr key={player.userId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                idx === 0 ? 'bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200' :
                                idx === 1 ? 'bg-slate-200 text-slate-700 shadow-sm' :
                                idx === 2 ? 'bg-orange-100 text-orange-700 shadow-sm' :
                                'text-slate-400'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="py-4 px-2">
                              <div className="font-bold text-slate-700">{player.name}</div>
                            </td>
                            <td className="py-4 px-2 text-center text-emerald-600 font-bold">{player.wins}</td>
                            <td className="py-4 px-2 text-center text-amber-600 font-bold">{player.draws}</td>
                            <td className="py-4 px-2 text-center text-rose-600 font-bold">{player.losses}</td>
                            <td className="py-4 px-6 text-right">
                              <span className="text-lg font-black text-emerald-600">{player.points}</span>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-emerald-50/30 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Ranking Global Acumulado</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider italic">Todas as edições incluídas</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {globalRanking.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic text-sm">
                Ainda não existem dados para gerar o ranking global.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/30 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-50">
                    <th className="py-4 px-6 w-16 text-center">Pos</th>
                    <th className="py-4 px-2">Jogador</th>
                    <th className="py-4 px-2 text-center">Jogos</th>
                    <th className="py-4 px-2 text-center">V</th>
                    <th className="py-4 px-2 text-center">E</th>
                    <th className="py-4 px-2 text-center">D</th>
                    <th className="py-4 px-6 text-right">Pontos Totais</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {globalRanking.map((player, idx) => (
                    <tr key={player.userId} className={`transition-colors ${idx < 3 ? 'bg-emerald-50/10' : 'hover:bg-slate-50/50'}`}>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center">
                          {idx === 0 ? (
                            <span className="text-2xl" title="Líder Global">👑</span>
                          ) : (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              idx === 1 ? 'bg-slate-200 text-slate-700' :
                              idx === 2 ? 'bg-orange-100 text-orange-700' :
                              'text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="font-bold text-slate-800 text-base">{player.name}</div>
                      </td>
                      <td className="py-4 px-2 text-center font-medium text-slate-500">{player.totalGames}</td>
                      <td className="py-4 px-2 text-center text-emerald-600 font-bold">{player.wins}</td>
                      <td className="py-4 px-2 text-center text-amber-600 font-bold">{player.draws}</td>
                      <td className="py-4 px-2 text-center text-rose-600 font-bold">{player.losses}</td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-xl font-black text-emerald-600 drop-shadow-sm">{player.points}</span>
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
