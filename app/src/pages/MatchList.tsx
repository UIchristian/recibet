import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeFlag?: string;
    awayFlag?: string;
    date: string;
    time: string;
    status: string;
    score: { home: number; away: number };
}

const MatchList = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [filter, setFilter] = useState('hoje');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('http://localhost:3001/api/matches')
            .then(res => res.json())
            .then(data => setMatches(data))
            .catch(err => console.error(err));
    }, []);

    const filteredMatches = matches.filter(m => {
        if (filter === 'hoje' && m.date !== 'Hoje') return false;
        if (filter === 'historico' && m.date === 'Hoje') return false;
        if (search) {
            const query = search.toLowerCase();
            if (!m.homeTeam.toLowerCase().includes(query) && !m.awayTeam.toLowerCase().includes(query)) {
                return false;
            }
        }
        return true;
    });

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-2 text-slate-100">Partidas</h1>
            <p className="text-slate-400 mb-8 text-sm">Acompanhe e sele resultados na rede Solana.</p>

            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-gradient-to-r from-solana-purple/20 to-solana-green/20 rounded-2xl blur-xl group-focus-within:opacity-100 opacity-40 transition-opacity"></div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-solana-purple w-5 h-5 drop-shadow-[0_0_5px_rgba(153,69,255,0.5)]" />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por seleção..." 
                        className="w-full pl-12 pr-4 py-4 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl focus:outline-none focus:border-solana-purple focus:ring-1 focus:ring-solana-purple text-slate-100 placeholder-slate-500 transition-all shadow-lg"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <button 
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === 'hoje' ? 'bg-solana-green text-slate-950 shadow-[0_0_15px_rgba(20,241,149,0.4)] hover:bg-[#0fd682]' : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                    onClick={() => setFilter('hoje')}
                >
                    Jogos de Hoje
                </button>
                <button 
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === 'historico' ? 'bg-solana-green text-slate-950 shadow-[0_0_15px_rgba(20,241,149,0.4)] hover:bg-[#0fd682]' : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                    onClick={() => setFilter('historico')}
                >
                    Histórico da Copa
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMatches.map(match => (
                    <Link to={`/match/${match.id}`} key={match.id} className="block bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:border-solana-purple/60 hover:shadow-[0_0_20px_rgba(153,69,255,0.15)] transition-all group">
                        <div className="flex justify-between items-center text-xs text-slate-400 mb-5 font-semibold">
                            <span>{match.date} • {match.time}</span>
                            <span className="text-solana-purple uppercase tracking-widest font-bold group-hover:drop-shadow-[0_0_5px_rgba(153,69,255,0.6)]">{match.status}</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {match.homeFlag ? (
                                    <img src={`https://flagcdn.com/w40/${match.homeFlag}.png`} alt={match.homeTeam} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"></div>
                                )}
                                <span className="font-bold text-lg text-slate-200">{match.homeTeam}</span>
                            </div>
                            <span className="font-bold text-2xl text-solana-green drop-shadow-[0_0_8px_rgba(20,241,149,0.3)]">{match.score.home}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {match.awayFlag ? (
                                    <img src={`https://flagcdn.com/w40/${match.awayFlag}.png`} alt={match.awayTeam} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"></div>
                                )}
                                <span className="font-bold text-lg text-slate-200">{match.awayTeam}</span>
                            </div>
                            <span className="font-bold text-2xl text-solana-green drop-shadow-[0_0_8px_rgba(20,241,149,0.3)]">{match.score.away}</span>
                        </div>
                    </Link>
                ))}
                {filteredMatches.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl">
                        Nenhuma partida encontrada para este filtro.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchList;
