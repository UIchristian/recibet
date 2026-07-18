import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MonitorPlay, Flag, CircleDot } from 'lucide-react';

export default function MatchDetail() {
    const { id } = useParams();
    const [match, setMatch] = useState<any>(null);

    useEffect(() => {
        fetch(`http://localhost:3001/api/matches/${id}`)
            .then(res => res.json())
            .then(json => setMatch(json.data))
            .catch(err => console.error(err));
    }, [id]);

    if (!match) return <div className="p-8 text-center text-slate-500">Carregando dados oficiais...</div>;

    const renderStat = (label: string, p1: number, p2: number, triggersSettlement = false) => (
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-200">{p1}</span>
                <span className={`text-slate-400 font-medium ${triggersSettlement ? 'text-solana-green font-bold drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]' : ''}`}>
                    {label} {triggersSettlement && '*'}
                </span>
                <span className="font-semibold text-slate-200">{p2}</span>
            </div>
            <div className="flex h-2 bg-slate-800 rounded overflow-hidden">
                <div className="bg-solana-purple" style={{ width: `${(p1/(p1+p2 || 1))*100}%` }}></div>
                <div className="bg-solana-green" style={{ width: `${(p2/(p1+p2 || 1))*100}%` }}></div>
            </div>
        </div>
    );

    return (
        <div className="p-4 min-h-full pb-32 relative max-w-3xl mx-auto">
            <Link to="/" className="inline-flex items-center text-sm font-semibold text-slate-400 mb-6 hover:text-slate-200 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Link>

            <div className="text-center mb-8 relative">
                <div className="text-xs font-bold tracking-widest text-solana-purple uppercase mb-3 drop-shadow-[0_0_8px_rgba(153,69,255,0.4)]">Finalizado • {match.date}</div>
                <div className="flex items-center justify-center gap-4">
                    <div className="text-right flex-1 flex flex-col items-end gap-3">
                        {match.homeFlag ? (
                            <img src={`https://flagcdn.com/w80/${match.homeFlag}.png`} alt={match.homeTeam} className="w-16 h-16 rounded-full object-cover border-4 border-slate-800 shadow-lg drop-shadow-[0_0_10px_rgba(20,241,149,0.2)]" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-700"></div>
                        )}
                        <h2 className="text-xl md:text-2xl font-bold text-slate-100">{match.homeTeam}</h2>
                    </div>
                    <div className="text-4xl font-black px-6 bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 text-solana-green shadow-[0_0_20px_rgba(20,241,149,0.2)] z-10 mx-2">
                        {match.score.home} - {match.score.away}
                    </div>
                    <div className="text-left flex-1 flex flex-col items-start gap-3">
                        {match.awayFlag ? (
                            <img src={`https://flagcdn.com/w80/${match.awayFlag}.png`} alt={match.awayTeam} className="w-16 h-16 rounded-full object-cover border-4 border-slate-800 shadow-lg drop-shadow-[0_0_10px_rgba(153,69,255,0.2)]" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-700"></div>
                        )}
                        <h2 className="text-xl md:text-2xl font-bold text-slate-100">{match.awayTeam}</h2>
                    </div>
                </div>
            </div>

            <div className="mb-8 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-sm">
                <h3 className="font-bold text-lg mb-6 text-center text-slate-200 uppercase tracking-widest text-sm border-b border-slate-800 pb-3">Estatísticas Oficiais</h3>
                {renderStat('Gols', match.stats.goals.p1, match.stats.goals.p2, true)}
                {renderStat('Chutes ao Gol', match.stats.shotsOnTarget.p1, match.stats.shotsOnTarget.p2, true)}
                {renderStat('Escanteios', match.stats.corners.p1, match.stats.corners.p2, true)}
                {renderStat('Faltas', match.stats.fouls.p1, match.stats.fouls.p2)}
                {renderStat('Cartões', match.stats.cards.p1, match.stats.cards.p2, true)}
                <p className="text-xs text-center text-solana-green/80 font-medium mt-6">* Mercados comumente liquidados em apostas</p>
            </div>

            <div className="mb-24">
                <h3 className="font-bold text-lg mb-4 text-center text-slate-200 uppercase tracking-widest text-sm border-b border-slate-800 pb-3">Timeline</h3>
                <div className="space-y-4">
                    {match.events.map((ev: any) => (
                        <div key={ev.id} className={`flex items-start gap-4 p-4 rounded-xl border backdrop-blur-sm ${ev.type === 'var' ? 'border-red-500/30 bg-red-500/10' : 'border-slate-800 bg-slate-900/40'}`}>
                            <div className="font-mono text-sm font-bold text-solana-green mt-1">{ev.time}</div>
                            <div>
                                <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
                                    {ev.type === 'var' && <MonitorPlay className="w-4 h-4 text-red-400" />}
                                    {ev.type === 'goal' && <CircleDot className="w-4 h-4 text-solana-green" />}
                                    {ev.type === 'yellow-card' && <Flag className="w-4 h-4 text-yellow-400" />}
                                    {ev.player}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{ev.team === 'home' ? match.homeTeam : match.awayTeam}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-[72px] md:bottom-8 left-0 right-0 max-w-md md:max-w-3xl mx-auto p-4 bg-slate-950/80 backdrop-blur-md md:rounded-t-2xl border-t md:border border-slate-800 z-40">
                <Link to={`/seal/${id}`} className="block w-full py-4 px-4 bg-solana-purple text-white text-center rounded-xl font-bold uppercase tracking-wider hover:bg-[#8036e6] transition-all shadow-[0_0_20px_rgba(153,69,255,0.4)]">
                    Selar Recibo Oficial
                </Link>
            </div>
        </div>
    );
}
