import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, ShieldCheck, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyReceipts() {
    const { connected } = useWallet();
    const [receipts, setReceipts] = useState<any[]>([]);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('my_receipts') || '[]');
        setReceipts(data.reverse());
    }, []);

    if (!connected) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full text-center relative z-10">
                <Wallet className="w-16 h-16 text-slate-700 mb-6 drop-shadow-[0_0_10px_rgba(153,69,255,0.3)]" />
                <h2 className="text-xl font-bold mb-2 text-slate-100">Carteira Desconectada</h2>
                <p className="text-sm text-slate-400 mb-8">
                    Conecte sua carteira Solana para visualizar os recibos oficiais (SBTs) que você ancorou.
                </p>
                <div className="text-xs text-solana-purple bg-solana-purple/10 border border-solana-purple/20 p-4 rounded-xl font-medium">
                    Utilize o botão no canto superior direito.
                </div>
            </div>
        );
    }

    if (receipts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full text-center relative z-10">
                <ShieldCheck className="w-16 h-16 text-slate-700 mb-6 drop-shadow-[0_0_10px_rgba(20,241,149,0.3)]" />
                <h2 className="text-xl font-bold mb-2 text-slate-100">Nenhum Recibo</h2>
                <p className="text-sm text-slate-400 mb-8">
                    Você ainda não ancorou nenhum resultado na blockchain.
                </p>
                <Link to="/" className="px-8 py-3 bg-solana-purple text-white font-bold rounded-xl text-sm shadow-[0_0_15px_rgba(153,69,255,0.4)] hover:bg-[#8036e6] transition-all">
                    Explorar Partidas
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 min-h-full pb-24 relative max-w-3xl mx-auto">
            <h1 className="font-bold text-2xl text-slate-100 mb-2">Seus Recibos (SBTs)</h1>
            <p className="text-sm text-slate-400 mb-8">
                Tokens não-transferíveis vinculados permanentemente à sua identidade.
            </p>

            <div className="space-y-5">
                {receipts.map((r, idx) => (
                    <div key={idx} className="bg-slate-900/60 backdrop-blur-sm border border-solana-green/40 shadow-[0_0_20px_rgba(20,241,149,0.05)] rounded-2xl p-5 relative overflow-hidden transition-all hover:border-solana-green/70">
                        <div className="absolute top-0 right-0 p-2 bg-solana-green/20 rounded-bl-2xl border-b border-l border-solana-green/30">
                            <ShieldCheck className="w-4 h-4 text-solana-green" />
                        </div>
                        <div className="text-xs font-bold text-solana-green uppercase tracking-wider mb-4 flex items-center gap-1 drop-shadow-[0_0_5px_rgba(20,241,149,0.4)]">
                            SBT Mintado
                        </div>
                        
                        <div className="mb-5">
                            <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">Commitment (Hash)</p>
                            <p className="font-mono text-xs text-solana-green break-all bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner">
                                {r.commitment}
                            </p>
                        </div>

                        {r.bet && (
                            <div className="mb-5 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Anexo da Aposta Off-chain</p>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-400"><span className="text-slate-500">Casa:</span> <span className="text-slate-200">{r.bet.casa}</span></p>
                                    <p className="text-xs text-slate-400"><span className="text-slate-500">Mercado:</span> <span className="text-slate-200">{r.bet.mercado}</span></p>
                                    <p className="text-xs text-slate-400"><span className="text-slate-500">Odd:</span> <span className="text-slate-200">{r.bet.odd}</span></p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 mt-5 pt-5 border-t border-slate-800">
                            <Link 
                                to={`/verify?hash=${r.commitment}`}
                                className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-solana-purple text-white rounded-xl text-xs font-bold hover:bg-[#8036e6] transition-colors shadow-[0_0_10px_rgba(153,69,255,0.3)]"
                            >
                                <LinkIcon className="w-4 h-4" />
                                Verificar Públicamente
                            </Link>
                            <a 
                                href={`https://explorer.solana.com/tx/${r.signature}?cluster=devnet`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center justify-center p-3 border border-slate-700 rounded-xl text-slate-400 hover:text-solana-green hover:border-solana-green/50 hover:bg-solana-green/10 transition-all"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
