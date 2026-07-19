import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Filter } from 'lucide-react';
import { getFixturesResilient, formatMatchDate, flagCode, STATUS_LABELS, translateTeam, type Fixture } from '../api/txline';
import LoadingState from '../components/LoadingState';
import SkeletonCard from '../components/SkeletonCard';
import { useTranslation } from '../hooks/useTranslation';

const MatchList = () => {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [partial, setPartial] = useState(false);
    const [filter, setFilter] = useState('hoje');
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const { t, language } = useTranslation();

    useEffect(() => {
        getFixturesResilient()
            .then(({ fixtures, partial }) => { setFixtures(fixtures); setPartial(partial); })
            .catch(err => setLoadError(err.message || 'Falha ao carregar partidas.'))
            .finally(() => setLoading(false));
    }, []);

    const filteredMatches = fixtures
        .filter(f => {
            const { date } = formatMatchDate(f.StartTime);
            
            // Filtro por nome
            if (search) {
                const query = search.toLowerCase();
                const t1 = translateTeam(f.Participant1, language).toLowerCase();
                const t2 = translateTeam(f.Participant2, language).toLowerCase();
                if (!t1.includes(query) && !t2.includes(query)) {
                    return false;
                }
            }
            
            // Filtro por data exata
            if (dateFilter) {
                const fDate = new Date(f.StartTime);
                const filterD = new Date(dateFilter + 'T12:00:00Z'); // Evitar timezone offset issue
                if (fDate.getUTCFullYear() !== filterD.getUTCFullYear() ||
                    fDate.getUTCMonth() !== filterD.getUTCMonth() ||
                    fDate.getUTCDate() !== filterD.getUTCDate()) {
                    return false;
                }
                return true; // Se tem dataFilter, ignora o 'hoje' / 'historico'
            }

            if (filter === 'hoje' && date !== 'Hoje' && f.status !== 'ao_vivo') return false;
            if (filter === 'semana') {
                const now = new Date();
                const fDate = new Date(f.StartTime);
                const diffTime = fDate.getTime() - now.getTime();
                const diffDays = diffTime / (1000 * 3600 * 24);
                if (diffDays < -3 || diffDays > 7) return false;
            }
            return true;
        })
        .sort((a, b) => a.StartTime - b.StartTime);

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold mb-2 text-slate-100">{t('Partidas', 'Matches')}</h1>
            <p className="text-slate-400 mb-8 text-sm">{t('Acompanhe e sele resultados na rede Solana.', 'Track and seal results on Solana.')}</p>

            <div className="mb-8">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-colors font-semibold ${showFilters ? 'bg-solana-purple text-white' : 'bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800'}`}
                >
                    <Filter className="w-5 h-5" />
                    {t('Filtros', 'Filters')}
                    {(search || dateFilter) && (
                        <span className="w-2.5 h-2.5 rounded-full bg-solana-green ml-2" title={t("Filtros ativos", "Active filters")}></span>
                    )}
                </button>

                {showFilters && (
                    <div className="mt-4 p-5 bg-slate-900/50 border border-slate-800 rounded-2xl animate-fade-in">
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
                                <label htmlFor="match-search" className="sr-only">Pesquisar por seleção</label>
                                <input
                                    id="match-search"
                                    type="text"
                                    placeholder={t("Filtrar por nome de time (Ex: Brasil)...", "Filter by team name (Ex: Brazil)...")}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-700/50 rounded-2xl focus:outline-none focus:border-solana-purple focus:ring-1 focus:ring-solana-purple text-slate-100 placeholder-slate-500 transition-colors"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
                                <label htmlFor="date-filter" className="sr-only">Filtrar por data</label>
                                <input
                                    id="date-filter"
                                    type="date"
                                    className="w-full md:w-auto pl-12 pr-4 py-4 bg-slate-950 border border-slate-700/50 rounded-2xl focus:outline-none focus:border-solana-purple focus:ring-1 focus:ring-solana-purple text-slate-100 transition-colors"
                                    value={dateFilter}
                                    onChange={(e) => {
                                        setDateFilter(e.target.value);
                                        if(e.target.value) setFilter('all');
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === 'hoje' && !dateFilter ? 'bg-solana-green text-slate-950 hover:bg-[#0fd682]' : 'bg-slate-950 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                                onClick={() => { setFilter('hoje'); setDateFilter(''); }}
                                aria-pressed={filter === 'hoje' && !dateFilter}
                            >
                                {t('Jogos de Hoje', 'Today\'s Matches')}
                            </button>
                            <button
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === 'semana' && !dateFilter ? 'bg-solana-green text-slate-950 hover:bg-[#0fd682]' : 'bg-slate-950 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                                onClick={() => { setFilter('semana'); setDateFilter(''); }}
                                aria-pressed={filter === 'semana' && !dateFilter}
                            >
                                {t('Jogos da Semana', 'This Week\'s Matches')}
                            </button>
                            <button
                                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filter === 'todos' && !dateFilter ? 'bg-solana-green text-slate-950 hover:bg-[#0fd682]' : 'bg-slate-950 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                                onClick={() => { setFilter('todos'); setDateFilter(''); }}
                                aria-pressed={filter === 'todos' && !dateFilter}
                            >
                                {t('Jogos Total da Copa', 'All World Cup Matches')}
                            </button>
                            {dateFilter && (
                                <button
                                    className="px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all bg-solana-purple text-white hover:bg-purple-500"
                                    onClick={() => setDateFilter('')}
                                >
                                    {t('Limpar Data', 'Clear Date')}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            )}

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
                            <Link to={`/match/${fixture.FixtureId}`} key={fixture.FixtureId} className="block bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl hover:shadow-solana-purple/10 hover:border-solana-purple/50 transition-all duration-300 group">
                                <div className="flex justify-between items-center gap-2 text-xs text-slate-400 mb-5 font-semibold">
                                    <span className="truncate">{date} • {time}</span>
                                    <span className={`flex-shrink-0 uppercase tracking-widest font-bold ${fixture.status === 'ao_vivo' ? 'text-red-400 animate-pulse' : 'text-solana-purple'}`}>
                                        {t(STATUS_LABELS[fixture.status], STATUS_LABELS[fixture.status])} 
                                        {/* Assumindo que STATUS_LABELS já está em PT por padrão. Idealmente, STATUS_LABELS usaria chaves de tradução. */}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-4 gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {homeFlag ? (
                                            <img src={`https://flagcdn.com/w40/${homeFlag}.png`} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0"></div>
                                        )}
                                        <span className="font-bold text-lg text-slate-200 truncate">{translateTeam(fixture.Participant1, language)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {awayFlag ? (
                                            <img src={`https://flagcdn.com/w40/${awayFlag}.png`} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0"></div>
                                        )}
                                        <span className="font-bold text-lg text-slate-200 truncate">{translateTeam(fixture.Participant2, language)}</span>
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
