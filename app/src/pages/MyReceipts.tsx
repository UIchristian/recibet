import React, { useEffect, useState } from 'react';
import { ShieldCheck, Link as LinkIcon, ExternalLink, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadReceiptPdf } from '../utils/receiptPdf';
import HashChip from '../components/HashChip';

export default function MyReceipts() {
    const [receipts, setReceipts] = useState<any[]>([]);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('my_receipts') || '[]');
        setReceipts(data.reverse());
    }, []);

    if (receipts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full text-center relative z-10">
                <ShieldCheck className="w-16 h-16 text-slate-700 mb-6 drop-shadow-[0_0_10px_rgba(20,241,149,0.3)]" aria-hidden="true" />
                <h1 className="text-xl font-bold mb-2 text-slate-100">Nenhum Recibo</h1>
                <p className="text-sm text-slate-400 mb-8">
                    Você ainda não gerou nenhum recibo neste navegador.
                </p>
                <Link to="/" className="px-8 py-3 bg-solana-purple text-white font-bold rounded-xl text-sm shadow-[0_0_15px_rgba(153,69,255,0.4)] hover:bg-[#8036e6] transition-all">
                    Explorar Partidas
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 min-h-full pb-24 relative max-w-3xl mx-auto">
            <h1 className="font-bold text-2xl text-slate-100 mb-2">Seus Recibos</h1>
            <p className="text-sm text-slate-400 mb-8">
                Histórico dos certificados gerados neste navegador, cada um com prova real ancorada na Solana.
            </p>

            <div className="space-y-5">
                {receipts.map((r, idx) => {
                    const cluster = r.certificate?.network?.toLowerCase().includes('mainnet') ? 'mainnet-beta' : 'devnet';
                    return (
                        <div key={idx} className="rounded-2xl p-px bg-gradient-to-br from-solana-purple/50 to-solana-green/50 transition-all hover:from-solana-purple/80 hover:to-solana-green/80">
                        <div className="certificate-card bg-slate-900/95 rounded-2xl p-6 relative">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                <span className="stamp text-xs">
                                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                    Emitido
                                </span>
                            </div>

                            {r.certificate?.match && (
                                <div className="mb-5 flex items-center justify-between gap-3">
                                    <span className="font-bold text-slate-100">
                                        {r.certificate.match.participant1} x {r.certificate.match.participant2}
                                    </span>
                                    {r.certificate.finalScore && (
                                        <span className="font-serif font-bold text-lg text-slate-100">
                                            {r.certificate.finalScore.participant1} - {r.certificate.finalScore.participant2}
                                        </span>
                                    )}
                                </div>
                            )}

                            <HashChip label="Commitment (Hash)" value={r.commitment} />

                            {r.bet && (
                                <div className="mt-5 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                    <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Anexo da Aposta Off-chain</p>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">Casa:</span> <span className="text-slate-200">{r.bet.casa}</span></p>
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">Mercado:</span> <span className="text-slate-200">{r.bet.mercado}</span></p>
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">Odd:</span> <span className="text-slate-200">{r.bet.odd}</span></p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-5 pt-5 border-t border-slate-800">
                                <Link
                                    to={`/verify?hash=${r.commitment}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-solana-purple text-white rounded-xl text-xs font-bold hover:bg-[#8036e6] transition-colors shadow-[0_0_10px_rgba(153,69,255,0.3)]"
                                >
                                    <LinkIcon className="w-4 h-4" aria-hidden="true" />
                                    Verificar Publicamente
                                </Link>
                                {r.certificate && (
                                    <button
                                        onClick={() => downloadReceiptPdf({ certificate: r.certificate, commitment: r.commitment, bet: r.bet })}
                                        className="flex items-center justify-center p-3 border border-slate-700 rounded-xl text-slate-400 hover:text-solana-green hover:border-solana-green/50 hover:bg-solana-green/10 transition-all"
                                        aria-label="Baixar PDF novamente"
                                        title="Baixar PDF novamente"
                                    >
                                        <FileDown className="w-5 h-5" aria-hidden="true" />
                                    </button>
                                )}
                                {r.certificate?.txHash && (
                                    <a
                                        href={`https://explorer.solana.com/tx/${r.certificate.txHash}?cluster=${cluster}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center p-3 border border-slate-700 rounded-xl text-slate-400 hover:text-solana-green hover:border-solana-green/50 hover:bg-solana-green/10 transition-all"
                                        aria-label="Ver no Solana Explorer"
                                        title="Ver no Solana Explorer"
                                    >
                                        <ExternalLink className="w-5 h-5" aria-hidden="true" />
                                    </a>
                                )}
                            </div>
                        </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
