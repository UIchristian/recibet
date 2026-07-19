import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, CheckCircle2, Link as LinkIcon, Loader2, FileDown } from 'lucide-react';
import SHA256 from 'crypto-js/sha256';
import { getGameSummary, issueCertificate, formatMatchDate, type MatchSummary, type Certificate } from '../api/txline';
import { downloadReceiptPdf } from '../utils/receiptPdf';
import HashChip from '../components/HashChip';
import LoadingState from '../components/LoadingState';
import { useTranslation } from '../hooks/useTranslation';

export default function SealingFlow() {
    const { id } = useParams();

    const [matchData, setMatchData] = useState<MatchSummary | null>(null);
    const [loadError, setLoadError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('');
    const [error, setError] = useState('');
    const { t } = useTranslation();

    const [betOpen, setBetOpen] = useState(false);
    const [betCasa, setBetCasa] = useState('');
    const [betMercado, setBetMercado] = useState('');
    const [betOdd, setBetOdd] = useState('');

    // Guarda o certificado (e o commitment derivado) assim que a prova on-chain e emitida.
    const [sealedCertificate, setSealedCertificate] = useState<Certificate | null>(null);
    const [sealedCommitment, setSealedCommitment] = useState('');

    useEffect(() => {
        if (!id) return;
        getGameSummary(id)
            .then(setMatchData)
            .catch(err => setLoadError(err.message || t('Falha ao carregar a partida.', 'Failed to load match.')));
    }, [id]);

    if (loadError) return <div role="alert" className="p-8 text-center text-red-400">{loadError}</div>;
    if (!matchData) return <LoadingState message={t('Preparando dados...', 'Preparing data...')} />;

    const isFinished = matchData.finalScore !== null;
    const { date } = formatMatchDate(matchData.startTime);

    const currentBetPayload = () =>
        betCasa || betMercado || betOdd ? { casa: betCasa, mercado: betMercado, odd: betOdd } : null;

    const handleGenerate = async () => {
        if (!id) return;

        setLoading(true);
        setError('');

        try {
            // Emite o certificado on-chain de verdade: envia transacoes reais na Solana
            // provando que gols/cartoes/escanteios batem com o Merkle root ancorado.
            setStep(t('Emitindo certificado on-chain (algumas transações reais, pode levar ~30s)...', 'Issuing on-chain certificate (some real transactions, may take ~30s)...'));
            const certificate = await issueCertificate(id);

            const betPayload = currentBetPayload();
            let finalCommitment = certificate.txHash;
            if (betPayload) {
                const betHash = SHA256(JSON.stringify(betPayload)).toString();
                finalCommitment = SHA256(certificate.txHash + betHash).toString();
            }

            setSealedCertificate(certificate);
            setSealedCommitment(finalCommitment);

            const receipts = JSON.parse(localStorage.getItem('my_receipts') || '[]');
            receipts.push({
                matchId: id,
                commitment: finalCommitment,
                date: new Date().toISOString(),
                bet: betPayload,
                certificate,
            });
            localStorage.setItem('my_receipts', JSON.stringify(receipts));

            downloadReceiptPdf({ certificate, commitment: finalCommitment, bet: betPayload });
        } catch (err: any) {
            console.error(err);
            setError(err.message || t("Erro ao emitir o certificado on-chain.", "Error issuing the on-chain certificate."));
        } finally {
            setLoading(false);
            setStep('');
        }
    };

    const handleDownloadPdf = () => {
        if (!sealedCertificate) return;
        downloadReceiptPdf({
            certificate: sealedCertificate,
            commitment: sealedCommitment,
            bet: currentBetPayload(),
        });
    };

    return (
        <div className="p-4 min-h-full pb-24 relative max-w-2xl mx-auto">
            <Link to={`/match/${id}`} className="inline-flex items-center text-sm font-semibold text-slate-400 mb-6 hover:text-slate-200 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" /> {t('Voltar', 'Back')}
            </Link>

            <h1 className="font-bold text-2xl text-slate-100 mb-2">{t('Revisão do Recibo', 'Receipt Review')}</h1>
            <p className="text-sm text-slate-400 mb-8">
                {t('Confira os dados oficiais abaixo. Ao gerar, a API envia uma prova criptográfica real (transações on-chain) confirmando que estes dados batem com o feed oficial, e você recebe um PDF com essa prova para guardar ou compartilhar.', 'Check the official data below. By generating, the API sends a real cryptographic proof (on-chain transactions) confirming these data match the official feed, and you get a PDF with this proof to keep or share.')}
            </p>

            {!isFinished && (
                <div className="mb-6 text-sm text-yellow-400 bg-yellow-950/30 border border-yellow-900/50 p-4 rounded-xl">
                    {t('Esta partida ainda não terminou — o certificado só pode ser emitido depois do apito final.', 'This match hasn\'t ended yet — the certificate can only be issued after the final whistle.')}
                </div>
            )}

            <div className="rounded-2xl p-px bg-gradient-to-br from-solana-purple/50 to-solana-green/50 mb-8">
                <div className="certificate-card bg-slate-900/95 rounded-2xl p-6 md:p-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">{t('Prévia do Recibo', 'Receipt Preview')}</p>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                        <span className="font-semibold text-slate-400">{t('Partida', 'Match')}</span>
                        <span className="font-bold text-slate-100 text-right">{matchData.teams.participant1.name} x {matchData.teams.participant2.name}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                        <span className="font-semibold text-slate-400">{t('Placar Oficial', 'Official Score')}</span>
                        <span className="font-serif font-bold text-slate-100 text-2xl">
                            {isFinished ? `${matchData.finalScore!.participant1} - ${matchData.finalScore!.participant2}` : '-'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                        <span className="font-semibold text-slate-400">{t('Data', 'Date')}</span>
                        <span className="font-bold text-slate-100">{date}</span>
                    </div>
                    <div>
                        <span className="block font-semibold text-slate-300 mb-2">{t('Dados Ancorados', 'Anchored Data')}</span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {t('Gols, Cartões Amarelos, Cartões Vermelhos e Escanteios dos dois times, cada um provado individualmente contra o Merkle root ancorado na Solana.', 'Goals, Yellow Cards, Red Cards and Corners from both teams, each individually proven against the Merkle root anchored on Solana.')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mb-8 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setBetOpen(o => !o)}
                    aria-expanded={betOpen}
                    aria-controls="bet-panel"
                    className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 hover:bg-slate-900/40 transition-colors"
                >
                    <span className="font-bold text-slate-100">{t('Vincular minha aposta a este recibo (opcional)', 'Link my bet to this receipt (optional)')}</span>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform ${betOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {betOpen && (
                    <div id="bet-panel" className="px-5 pb-5 pt-1">
                        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                            {t('Assim seu recibo prova não só o que aconteceu no jogo, mas o que você apostou, útil se precisar contestar uma casa. Só um hash vai à rede, seus dados ficam fora da cadeia.', 'This way your receipt proves not only what happened in the match, but what you bet, useful if you need to contest a bookmaker. Only a hash goes to the network, your data stays off-chain.')}
                        </p>
                        <div className="space-y-3">
                            <label className="block">
                                <span className="sr-only">{t('Casa de Apostas', 'Bookmaker')}</span>
                                <input
                                    type="text"
                                    placeholder="Bet365"
                                    aria-label="Casa de Apostas"
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-solana-green focus:ring-1 focus:ring-solana-green text-slate-100 placeholder-slate-500 transition-colors"
                                    value={betCasa} onChange={e => setBetCasa(e.target.value)}
                                />
                            </label>
                            <label className="block">
                                <span className="sr-only">Mercado</span>
                                <input
                                    type="text"
                                    placeholder="Mais de 2.5 gols"
                                    aria-label="Mercado"
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-solana-green focus:ring-1 focus:ring-solana-green text-slate-100 placeholder-slate-500 transition-colors"
                                    value={betMercado} onChange={e => setBetMercado(e.target.value)}
                                />
                            </label>
                            <label className="block">
                                <span className="sr-only">Odd</span>
                                <input
                                    type="text"
                                    placeholder="1.85"
                                    aria-label="Odd"
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-solana-green focus:ring-1 focus:ring-solana-green text-slate-100 placeholder-slate-500 transition-colors"
                                    value={betOdd} onChange={e => setBetOdd(e.target.value)}
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-3 bg-solana-green/10 border border-solana-green/20 text-solana-green p-4 rounded-xl mb-8">
                <LinkIcon className="w-5 h-5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs font-medium leading-relaxed">
                    {t('O recibo é gerado como um ', 'The receipt is generated as a ')}<strong>{t('PDF com a prova on-chain', 'PDF with the on-chain proof')}</strong>{t(', referenciando a transação de verificação na Solana.', ', referencing the verification transaction on Solana.')}
                </p>
            </div>

            {error && <div role="alert" className="text-red-400 text-sm font-semibold mb-4 text-center bg-red-950/50 border border-red-900/50 p-3 rounded-xl">{error}</div>}

            <div role="status" aria-live="polite">
                {sealedCertificate && !loading && (
                    <div className="mb-6 rounded-2xl p-px bg-gradient-to-br from-solana-purple/60 to-solana-green/60">
                        <div className="certificate-card bg-slate-900/95 rounded-2xl p-5">
                            <span className="stamp text-xs mb-4 inline-flex">
                                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                {t('Emitido', 'Issued')}
                            </span>
                            <p className="text-sm text-slate-200 font-semibold mb-4">{t('Certificado emitido e PDF baixado com sucesso.', 'Certificate issued and PDF downloaded successfully.')}</p>
                            <HashChip label={t('Commitment do Recibo', 'Receipt Commitment')} value={sealedCommitment} />
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading || !isFinished || !!sealedCertificate}
                className="w-full py-4 px-4 bg-solana-green text-slate-950 text-center rounded-xl font-bold uppercase tracking-wider hover:bg-[#0fd682] transition-all shadow-[0_0_20px_rgba(20,241,149,0.3)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
                {loading ? (step || t('Processando...', 'Processing...')) : sealedCertificate ? t('Recibo Gerado', 'Receipt Generated') : t('Gerar Recibo', 'Generate Receipt')}
            </button>

            {sealedCertificate && (
                <button
                    onClick={handleDownloadPdf}
                    className="w-full mt-3 py-3 px-4 bg-transparent border border-slate-700 text-slate-300 text-center rounded-xl font-bold uppercase tracking-wider text-sm hover:border-solana-purple hover:text-solana-purple transition-all flex items-center justify-center gap-2"
                >
                    <FileDown className="w-4 h-4" aria-hidden="true" />
                    {t('Baixar PDF Novamente', 'Download PDF Again')}
                </button>
            )}
        </div>
    );
}
