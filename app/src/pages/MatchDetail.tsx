import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Flag, CircleDot } from 'lucide-react';
import { getGameSummary, formatMatchDate, formatClock, flagCode, type MatchSummary, type MatchEvent, type CardEvent } from '../api/txline';
import LoadingState from '../components/LoadingState';

type TimelineItem =
    | ({ kind: 'goal' } & MatchEvent)
    | ({ kind: 'card' } & CardEvent);

export default function MatchDetail() {
    const { id } = useParams();
    const [match, setMatch] = useState<MatchSummary | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        getGameSummary(id)
            .then(setMatch)
            .catch(err => setError(err.message || 'Falha ao carregar a partida.'));
    }, [id]);

    if (error) return <div role="alert" className="p-8 text-center text-red-400">{error}</div>;
    if (!match) return <LoadingState message="Carregando dados oficiais..." />;

    const { date } = formatMatchDate(match.startTime);
    const isFinished = match.finalScore !== null;
    const flag1 = flagCode(match.teams.participant1.name);
    const flag2 = flagCode(match.teams.participant2.name);
    const totals = match.statsByPeriod.Total;
    const cardsP1 = totals ? totals.participant1.yellowCards + totals.participant1.redCards : 0;
    const cardsP2 = totals ? totals.participant2.yellowCards + totals.participant2.redCards : 0;

    const timeline: TimelineItem[] = [
        ...match.goals.map(g => ({ kind: 'goal' as const, ...g })),
        ...match.cards.map(c => ({ kind: 'card' as const, ...c })),
    ].sort((a, b) => (a.clockSeconds ?? 0) - (b.clockSeconds ?? 0));

    const renderStat = (label: string, p1: number, p2: number) => (
        <div className="mb-5">
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
            <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-slate-200 tabular-nums">{p1}</span>
                <span className="font-semibold text-slate-200 tabular-nums">{p2}</span>
            </div>
            <div className="flex h-2 bg-slate-800 rounded overflow-hidden">
                <div className="bg-solana-purple" style={{ width: `${(p1 / (p1 + p2 || 1)) * 100}%` }}></div>
                <div className="bg-solana-green" style={{ width: `${(p2 / (p1 + p2 || 1)) * 100}%` }}></div>
            </div>
        </div>
    );

    return (
        <div className="p-4 min-h-full pb-32 relative max-w-3xl mx-auto">
            <h1 className="sr-only">Detalhes da partida: {match.teams.participant1.name} x {match.teams.participant2.name}</h1>

            <Link to="/" className="inline-flex items-center text-sm font-semibold text-slate-400 mb-6 hover:text-slate-200 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" /> Voltar
            </Link>

            <div className="text-center mb-8 relative">
                <div className="text-xs font-bold tracking-widest text-solana-purple uppercase mb-3">
                    {isFinished ? 'Finalizado' : 'Em andamento / agendado'} • {date}
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <div className="text-right flex-1 min-w-0 flex flex-col items-end gap-3">
                        {flag1 ? (
                            <img src={`https://flagcdn.com/w80/${flag1}.png`} alt="" className="w-16 h-16 rounded-full object-cover border-4 border-slate-800 shadow-lg" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-700"></div>
                        )}
                        <p className="text-xl md:text-2xl font-bold text-slate-100 truncate max-w-full">{match.teams.participant1.name}</p>
                    </div>
                    <div className="font-serif text-3xl sm:text-4xl font-black px-4 sm:px-6 bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 text-slate-100 shadow-[0_0_20px_rgba(153,69,255,0.15)] z-10 flex-shrink-0">
                        {isFinished ? `${match.finalScore!.participant1} - ${match.finalScore!.participant2}` : 'vs'}
                    </div>
                    <div className="text-left flex-1 min-w-0 flex flex-col items-start gap-3">
                        {flag2 ? (
                            <img src={`https://flagcdn.com/w80/${flag2}.png`} alt="" className="w-16 h-16 rounded-full object-cover border-4 border-slate-800 shadow-lg" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-700"></div>
                        )}
                        <p className="text-xl md:text-2xl font-bold text-slate-100 truncate max-w-full">{match.teams.participant2.name}</p>
                    </div>
                </div>
            </div>

            <div className="mb-8 p-5 bg-slate-900/40 border border-slate-800 rounded-2xl backdrop-blur-sm">
                <h2 className="font-bold text-sm mb-6 text-center text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-3">Estatísticas Oficiais</h2>
                {totals ? (
                    <>
                        {renderStat('Gols', totals.participant1.goals, totals.participant2.goals)}
                        {renderStat('Escanteios', totals.participant1.corners, totals.participant2.corners)}
                        {renderStat('Cartões', cardsP1, cardsP2)}
                        <p className="text-xs text-center text-slate-400 leading-relaxed mt-6">
                            Chutes ao gol, faltas, pênaltis e impedimentos ainda não têm prova on-chain
                            documentada no feed da TxODDS, por isso não aparecem aqui.
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-center text-slate-400">Ainda sem estatísticas disponíveis para esta partida.</p>
                )}
            </div>

            <div className="mb-24">
                <h2 className="font-bold text-sm mb-4 text-center text-slate-200 uppercase tracking-widest border-b border-slate-800 pb-3">Timeline</h2>
                <div className="space-y-4">
                    {timeline.map((ev, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                            <div className="font-mono text-sm font-bold text-solana-green mt-1 tabular-nums">{formatClock(ev.clockSeconds)}</div>
                            <div>
                                <div className="flex items-center gap-2 font-bold text-sm text-slate-200">
                                    {ev.kind === 'goal' && <CircleDot className="w-4 h-4 text-solana-green" aria-hidden="true" />}
                                    {ev.kind === 'card' && (
                                        <Flag className={`w-4 h-4 ${ev.cardType === 'red' ? 'text-red-500' : 'text-yellow-400'}`} aria-hidden="true" />
                                    )}
                                    {ev.playerName ?? (ev.kind === 'goal' ? 'Gol' : 'Cartão')}
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{ev.teamName}</div>
                            </div>
                        </div>
                    ))}
                    {timeline.length === 0 && (
                        <p className="text-sm text-center text-slate-400 py-8">Nenhum gol ou cartão registrado ainda.</p>
                    )}
                </div>
            </div>

            <div className="fixed bottom-[72px] md:bottom-8 left-0 right-0 max-w-md md:max-w-3xl mx-auto p-4 bg-slate-950/80 backdrop-blur-md md:rounded-t-2xl border-t md:border border-slate-800 z-40">
                {isFinished ? (
                    <Link to={`/seal/${id}`} className="block w-full py-4 px-4 bg-solana-purple text-white text-center rounded-xl font-bold uppercase tracking-wider hover:bg-[#8036e6] transition-all shadow-[0_0_20px_rgba(153,69,255,0.4)]">
                        Gerar Recibo Oficial
                    </Link>
                ) : (
                    <div className="block w-full py-4 px-4 bg-slate-800 text-slate-400 text-center rounded-xl font-bold uppercase tracking-wider cursor-not-allowed">
                        Disponível após o fim da partida
                    </div>
                )}
            </div>
        </div>
    );
}
