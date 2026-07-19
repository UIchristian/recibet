import React, { useEffect, useState } from 'react';
import { ShieldCheck, Link as LinkIcon, ExternalLink, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { downloadReceiptPdf } from '../utils/receiptPdf';
import HashChip from '../components/HashChip';
import { useTranslation } from '../hooks/useTranslation';

export default function MyReceipts() {
    const [receipts, setReceipts] = useState<any[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('my_receipts') || '[]');
        setReceipts(data.reverse());
    }, []);

    if (receipts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full min-h-[60vh] text-center relative z-10 animate-fade-in">
                <div className="relative mb-8 group cursor-default">
                    <div className="absolute inset-0 bg-solana-purple blur-2xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div className="w-28 h-28 bg-slate-900 border border-slate-700/50 rounded-3xl flex items-center justify-center relative shadow-2xl shadow-solana-purple/20 -rotate-6 transition-all duration-500 group-hover:rotate-0 group-hover:-translate-y-2">
                        <ShieldCheck className="w-14 h-14 text-slate-400 group-hover:text-solana-purple transition-colors duration-500" aria-hidden="true" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold mb-3 text-slate-100">{t('Nenhum Recibo Encontrado', 'No Receipts Found')}</h1>
                <p className="text-sm text-slate-400 mb-10 max-w-md leading-relaxed">
                    {t('Você ainda não gerou nenhum recibo neste navegador. Os recibos são provas criptográficas que garantem a autenticidade dos resultados contra manipulações.', 'You haven\'t generated any receipts in this browser yet. Receipts are cryptographic proofs that guarantee the authenticity of results against manipulation.')}
                </p>
                <Link to="/" className="px-8 py-4 bg-solana-purple text-white font-bold tracking-wide rounded-xl text-sm shadow-[0_0_20px_rgba(153,69,255,0.4)] hover:bg-[#8036e6] hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(153,69,255,0.6)] transition-all duration-300">
                    {t('Explorar Partidas', 'Explore Matches')}
                </Link>
            </div>
        );
    }

    return (
        <div className="p-4 min-h-full pb-24 relative max-w-3xl mx-auto">
            <h1 className="font-bold text-2xl text-slate-100 mb-2">{t('Seus Recibos', 'Your Receipts')}</h1>
            <p className="text-sm text-slate-400 mb-8">
                {t('Histórico dos certificados gerados neste navegador, cada um com prova real ancorada na Solana.', 'History of certificates generated in this browser, each with real proof anchored on Solana.')}
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
                                    {t('Emitido', 'Issued')}
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
                                    <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">{t('Anexo da Aposta Off-chain', 'Off-chain Bet Attachment')}</p>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">{t('Casa:', 'Bookmaker:')}</span> <span className="text-slate-200">{r.bet.casa}</span></p>
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">{t('Mercado:', 'Market:')}</span> <span className="text-slate-200">{r.bet.mercado}</span></p>
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">{t('Odd:', 'Odd:')}</span> <span className="text-slate-200">{r.bet.odd}</span></p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-5 pt-5 border-t border-slate-800">
                                <Link
                                    to={`/verify?hash=${r.commitment}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-solana-purple text-white rounded-xl text-xs font-bold hover:bg-[#8036e6] transition-colors shadow-[0_0_10px_rgba(153,69,255,0.3)]"
                                >
                                    <LinkIcon className="w-4 h-4" aria-hidden="true" />
                                    {t('Verificar Publicamente', 'Verify Publicly')}
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
