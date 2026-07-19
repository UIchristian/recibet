import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getFixturesResilient, formatMatchDate, flagCode, STATUS_LABELS, type Fixture } from '../api/txline';
import LoadingState from '../components/LoadingState';

const MatchList = () => {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [partial, setPartial] = useState(false);
    const [filter, setFilter] = useState('hoje');
    const [search, setSearch] = useState('');

    useEffect(() => {
        getFixturesResilient()
            .then(({ fixtures, partial }) => { setFixtures(fixtures); setPartial(partial); })
            .catch(err => setLoadError(err.message || 'Falha ao carregar partidas.'))
            .finally(() => setLoading(false));
    }, []);

    const filteredMatches = fixtures
        .filter(f => {
            const { date } = formatMatchDate(f.StartTime);
            if (filter === 'hoje' && date !== 'Hoje' && f.status !== 'ao_vivo') return false;
            if (filter === 'historico' && (date === 'Hoje' || f.status === 'ao_vivo')) return false;
            if (search) {
                const query = search.toLowerCase();
                if (!f.Participant1.toLowerCase().includes(query) && !f.Participant2.toLowerCase().includes(query)) {
                    return false;
                }
            }
            return true;
        })
        // Histórico mostra os mais recentes primeiro; hoje/próximos em ordem cronológica.
        .sort((a, b) => filter === 'historico' ? b.StartTime - a.StartTime : a.StartTime - b.StartTime);

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-2 text-slate-100">Partidas</h1>
            <p className="text-slate-400 mb-8 text-sm">Acompanhe e sele resultados na rede Solana.</p>

            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
                <label htmlFor="match-search" className="sr-only">Pesquisar por seleção</label>
                <input
                    id="match-search"
                    type="text"
                    placeholder="Pesquisar por seleção..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl focus:outline-none focus:border-solana-purple focus:ring-1 focus:ring-solana-purple text-slate-100 placeholder-slate-500 transition-colors"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <button
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === 'hoje' ? 'bg-solana-green text-slate-950 hover:bg-[#0fd682]' : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                    onClick={() => setFilter('hoje')}
                    aria-pressed={filter === 'hoje'}
                >
                    Jogos de Hoje
                </button>
                <button
                    className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === 'historico' ? 'bg-solana-green text-slate-950 hover:bg-[#0fd682]' : 'bg-slate-900/50 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                    onClick={() => setFilter('historico')}
                    aria-pressed={filter === 'historico'}
                >
                    Histórico da Copa
                </button>
            </div>

            {loading && <LoadingState message="Carregando partidas da API..." />}

            {!loading && loadError && (
                <div role="alert" className="py-12 text-center text-red-400 bg-red-950/30 border border-red-900/50 rounded-2xl">
                    {loadError} — confira se a API (tx-on-chain/api) está rodando em {import.meta.env.VITE_API_URL || 'http://localhost:3001'}.
                </div>
            )}

            {!loading && !loadError && partial && (
                <div className="mb-6 text-xs text-yellow-400 bg-yellow-950/30 border border-yellow-900/50 p-3 rounded-xl text-center">
                    O calendário completo demorou demais para carregar — mostrando só as partidas mais recentes por enquanto.
                </div>
            )}

            {!loading && !loadError && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMatches.map(fixture => {
                        const { date, time } = formatMatchDate(fixture.StartTime);
                        const homeFlag = flagCode(fixture.Participant1);
                        const awayFlag = flagCode(fixture.Participant2);
                        return (
                            <Link to={`/match/${fixture.FixtureId}`} key={fixture.FixtureId} className="block bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-solana-purple/50 transition-colors group">
                                <div className="flex justify-between items-center gap-2 text-xs text-slate-400 mb-5 font-semibold">
                                    <span className="truncate">{date} • {time}</span>
                                    <span className={`flex-shrink-0 uppercase tracking-widest font-bold ${fixture.status === 'ao_vivo' ? 'text-red-400 animate-pulse' : 'text-solana-purple'}`}>
                                        {STATUS_LABELS[fixture.status]}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-4 gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {homeFlag ? (
                                            <img src={`https://flagcdn.com/w40/${homeFlag}.png`} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0"></div>
                                        )}
                                        <span className="font-bold text-lg text-slate-200 truncate">{fixture.Participant1}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {awayFlag ? (
                                            <img src={`https://flagcdn.com/w40/${awayFlag}.png`} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0"></div>
                                        )}
                                        <span className="font-bold text-lg text-slate-200 truncate">{fixture.Participant2}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                    {filteredMatches.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl">
                            Nenhuma partida encontrada para este filtro.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MatchList;
