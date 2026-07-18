import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { mintSBT } from '../solana/mintSBT';
import { ChevronLeft, CheckCircle2, Link as LinkIcon, Loader2 } from 'lucide-react';
import SHA256 from 'crypto-js/sha256';

export default function SealingFlow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { connection } = useConnection();
    const wallet = useWallet();
    
    const [matchData, setMatchData] = useState<any>(null);
    const [commitment, setCommitment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [betCasa, setBetCasa] = useState('');
    const [betMercado, setBetMercado] = useState('');
    const [betOdd, setBetOdd] = useState('');

    useEffect(() => {
        fetch(`http://localhost:3001/api/matches/${id}`)
            .then(res => res.json())
            .then(json => {
                setMatchData(json.data);
                setCommitment(json.commitment);
            })
            .catch(err => console.error(err));
    }, [id]);

    if (!matchData) return <div className="p-8 text-center text-slate-500">Preparando dados...</div>;

    const handleSeal = async () => {
        if (!wallet.connected) {
            setError("Conecte a carteira primeiro (canto superior direito).");
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            // Include bet data in the final commitment hash if provided
            let finalCommitment = commitment;
            let betPayload = null;
            if (betCasa || betMercado || betOdd) {
                betPayload = { casa: betCasa, mercado: betMercado, odd: betOdd };
                const betHash = SHA256(JSON.stringify(betPayload)).toString();
                finalCommitment = SHA256(commitment + betHash).toString();
            }

            const { signature, mint } = await mintSBT(connection, wallet as any, finalCommitment);

            // Save to local storage for "My Receipts"
            const receipts = JSON.parse(localStorage.getItem('my_receipts') || '[]');
            receipts.push({
                matchId: id,
                mint,
                signature,
                commitment: finalCommitment,
                date: new Date().toISOString(),
                bet: betPayload
            });
            localStorage.setItem('my_receipts', JSON.stringify(receipts));

            navigate('/receipts');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erro ao selar transação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 min-h-full pb-24 relative max-w-2xl mx-auto">
            <Link to={`/match/${id}`} className="inline-flex items-center text-sm font-semibold text-slate-400 mb-6 hover:text-slate-200 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Link>

            <h1 className="font-bold text-2xl text-slate-100 mb-2">Revisão do Recibo</h1>
            <p className="text-sm text-slate-400 mb-8">
                Confira os dados oficiais abaixo. Após a selagem, este registro se tornará à prova de adulteração na blockchain Solana.
            </p>

            <div className="border border-slate-800 rounded-2xl p-5 mb-8 bg-slate-900/40 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                    <span className="font-semibold text-slate-400">Partida</span>
                    <span className="font-bold text-slate-100">{matchData.homeTeam} x {matchData.awayTeam}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                    <span className="font-semibold text-slate-400">Placar Oficial</span>
                    <span className="font-bold text-solana-green text-2xl">{matchData.score.home} - {matchData.score.away}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                    <span className="font-semibold text-slate-400">Data</span>
                    <span className="font-bold text-slate-100">{matchData.date}</span>
                </div>
                <div>
                    <span className="block font-semibold text-slate-300 mb-2">Dados Ancorados</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Estatísticas completas (Gols, Cartões, Escanteios, Chutes ao gol, Faltas, Pênaltis, Impedimentos) e Timeline Oficial de eventos incluindo VAR.
                    </p>
                </div>
            </div>

            <h3 className="font-bold text-lg mb-4 text-slate-100">Anexar Aposta (Opcional)</h3>
            <p className="text-xs text-slate-400 mb-4">
                Preencha caso queira vincular sua aposta a este recibo. Apenas um hash criptográfico será enviado à rede; os dados originais ficam fora da cadeia.
            </p>
            <div className="space-y-3 mb-8">
                <input 
                    type="text" 
                    placeholder="Casa de Apostas (ex: Bet365)" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-solana-green focus:ring-1 focus:ring-solana-green text-slate-100 placeholder-slate-500 transition-colors"
                    value={betCasa} onChange={e => setBetCasa(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="Mercado (ex: +2.5 Gols)" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-solana-green focus:ring-1 focus:ring-solana-green text-slate-100 placeholder-slate-500 transition-colors"
                    value={betMercado} onChange={e => setBetMercado(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="Odd (ex: 1.85)" 
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-solana-green focus:ring-1 focus:ring-solana-green text-slate-100 placeholder-slate-500 transition-colors"
                    value={betOdd} onChange={e => setBetOdd(e.target.value)}
                />
            </div>

            <div className="flex items-start gap-3 bg-solana-green/10 border border-solana-green/20 text-solana-green p-4 rounded-xl mb-8">
                <LinkIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-medium leading-relaxed">
                    O recibo será cunhado como um <strong>SBT Não-Transferível</strong> na sua carteira, tão confiável quanto o feed oficial.
                </p>
            </div>

            {error && <div className="text-red-400 text-sm font-semibold mb-4 text-center bg-red-950/50 border border-red-900/50 p-3 rounded-xl">{error}</div>}

            <button 
                onClick={handleSeal}
                disabled={loading}
                className="w-full py-4 px-4 bg-solana-green text-slate-950 text-center rounded-xl font-bold uppercase tracking-wider hover:bg-[#0fd682] transition-all shadow-[0_0_20px_rgba(20,241,149,0.3)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {loading ? 'Processando (Aprove na Carteira)...' : 'Selar e Cunhar SBT'}
            </button>
        </div>
    );
}
