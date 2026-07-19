import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConnection } from '@solana/wallet-adapter-react';
import { Search, ShieldCheck, AlertCircle } from 'lucide-react';
import SHA256 from 'crypto-js/sha256';
import HashChip from '../components/HashChip';

type OnchainResult = {
    kind: 'onchain';
    signature: string;
    slot: number;
    blockTime: number | null;
    success: boolean;
};

type LocalResult = {
    kind: 'local';
    receipt: any;
    onchainVerified: boolean;
    integrityVerified: boolean;
};

export default function PublicVerification() {
    const [searchParams] = useSearchParams();
    const hashParam = searchParams.get('hash');
    const { connection } = useConnection();

    const [hashInput, setHashInput] = useState(hashParam || '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<OnchainResult | LocalResult | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (hashParam) {
            handleVerify(hashParam);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hashParam]);

    const handleVerify = async (hashToVerify: string) => {
        if (!hashToVerify) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            // Caminho 1: o valor colado é a própria assinatura de transação (recibo sem
            // aposta anexada) — dá para confirmar direto na rede, sem depender de nada local.
            const tx = await connection
                .getTransaction(hashToVerify, { maxSupportedTransactionVersion: 0 })
                .catch(() => null);

            if (tx) {
                setResult({
                    kind: 'onchain',
                    signature: hashToVerify,
                    slot: tx.slot,
                    blockTime: tx.blockTime ?? null,
                    success: tx.meta?.err == null,
                });
                return;
            }

            // Caminho 2: o valor é um hash derivado (aposta anexada misturou o txHash com
            // os dados da aposta). Só conseguimos reconstituir isso a partir do recibo local
            // salvo neste navegador — não é verificação de terceiro, é conferência do dono.
            const receipts = JSON.parse(localStorage.getItem('my_receipts') || '[]');
            const local = receipts.find((r: any) => r.commitment === hashToVerify);

            if (local?.certificate?.txHash) {
                const expectedCommitment = local.bet
                    ? SHA256(local.certificate.txHash + SHA256(JSON.stringify(local.bet)).toString()).toString()
                    : local.certificate.txHash;
                const integrityVerified = expectedCommitment === local.commitment;

                const baseTx = await connection
                    .getTransaction(local.certificate.txHash, { maxSupportedTransactionVersion: 0 })
                    .catch(() => null);

                setResult({
                    kind: 'local',
                    receipt: local,
                    onchainVerified: !!baseTx && baseTx.meta?.err == null,
                    integrityVerified,
                });
                return;
            }

            setError('Hash não encontrado on-chain nem em recibos salvos neste navegador.');
        } catch (err: any) {
            setError(err.message || "Erro de verificação.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 min-h-full pb-24 relative max-w-3xl mx-auto">
            <h1 className="font-bold text-2xl text-slate-100 mb-2">Verificação Pública</h1>
            <p className="text-sm text-slate-400 mb-4">
                Cole o hash de commitment do recibo para revalidar a prova. Não requer login.
            </p>

            <details className="mb-8 text-sm text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3">
                <summary className="cursor-pointer font-semibold text-slate-200">Como funciona a verificação?</summary>
                <div className="mt-3 space-y-2 text-xs leading-relaxed">
                    <p>
                        Existem dois tipos de hash. A <b>assinatura de transação</b> (recibo sem aposta anexada)
                        é conferida direto na Solana, por qualquer pessoa, sem depender de nós.
                    </p>
                    <p>
                        Já o <b>commitment com aposta anexada</b> mistura essa assinatura com o hash da aposta,
                        e só pode ser reconstituído a partir do recibo salvo no navegador de quem o gerou.
                    </p>
                </div>
            </details>

            <form
                className="flex gap-2 mb-8"
                onSubmit={(e) => { e.preventDefault(); handleVerify(hashInput); }}
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
                    <label htmlFor="hash-input" className="sr-only">Hash de commitment para verificar</label>
                    <input
                        id="hash-input"
                        type="text"
                        placeholder="Cole o Hash de Commitment..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-solana-purple focus:ring-1 focus:ring-solana-purple text-slate-100 font-mono placeholder-slate-500 transition-colors"
                        value={hashInput}
                        onChange={(e) => setHashInput(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-solana-purple text-white font-bold rounded-xl hover:bg-[#8036e6] shadow-[0_0_15px_rgba(153,69,255,0.3)] transition-all disabled:opacity-70 disabled:shadow-none"
                >
                    {loading ? 'Buscando...' : 'Verificar'}
                </button>
            </form>

            {error && (
                <div role="alert" className="flex flex-col items-center justify-center p-8 text-center bg-red-950/50 rounded-2xl border border-red-900/50 backdrop-blur-sm">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" aria-hidden="true" />
                    <h2 className="font-bold text-red-400 mb-2">Verificação Falhou</h2>
                    <p className="text-sm text-red-300">{error}</p>
                </div>
            )}

            <div role="status" aria-live="polite">
                {result?.kind === 'onchain' && (
                  <div className="rounded-2xl p-px bg-gradient-to-br from-solana-purple/70 to-solana-green/70 shadow-[0_0_30px_rgba(20,241,149,0.1)]">
                    <div className="certificate-card bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 md:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <span className="stamp">
                                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                                {result.success ? 'Verificado' : 'Falhou'}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {result.success ? 'Confirmado On-Chain' : 'Transação Falhou'}
                            </span>
                        </div>
                        <h2 className="font-serif font-bold text-2xl mb-6 text-slate-100 text-balance">Prova Verificada Diretamente na Solana</h2>
                        <div className="space-y-4">
                            <HashChip label="Assinatura" value={result.signature} />
                            <div className="flex justify-between border-b border-slate-800 pb-3 pt-1">
                                <span className="text-sm text-slate-400">Slot</span>
                                <span className="text-sm font-bold text-slate-200 tabular-nums">{result.slot}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <span className="text-sm text-slate-400">Horário</span>
                                <span className="text-sm font-bold text-slate-200">
                                    {result.blockTime ? new Date(result.blockTime * 1000).toLocaleString('pt-BR') : '-'}
                                </span>
                            </div>
                            <a
                                href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
                                target="_blank" rel="noreferrer"
                                className="block text-center text-xs font-bold text-solana-purple hover:underline pt-2"
                            >
                                Ver no Solana Explorer →
                            </a>
                            <div className="mt-6 pt-5 border-t border-slate-800">
                                <p className="text-xs text-slate-400 text-center leading-relaxed">
                                    Esta é a transação real enviada pela nossa API (validateStatV2), que só é
                                    aceita pelo programa on-chain se os dados batem com o Merkle root ancorado.
                                    Qualquer pessoa pode conferir isso, sem depender de nós.
                                </p>
                            </div>
                        </div>
                    </div>
                  </div>
                )}

                {result?.kind === 'local' && (
                  <div className="rounded-2xl p-px bg-gradient-to-br from-solana-purple/70 to-solana-green/70 shadow-[0_0_30px_rgba(20,241,149,0.1)]">
                    <div className="certificate-card bg-slate-900/95 backdrop-blur-md rounded-2xl p-6 md:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <span className="stamp">
                                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                                Recibo Local
                            </span>
                        </div>
                        <h2 className="font-serif font-bold text-2xl mb-2 text-slate-100 text-balance">Recibo com Aposta Anexada</h2>
                        <p className="text-xs text-slate-400 mb-6">
                            Este commitment mistura o hash da aposta — só é conferível a partir do recibo salvo
                            neste navegador. Para prova 100% pública sem depender de dados locais, verifique
                            diretamente a assinatura da transação (sem aposta anexada).
                        </p>

                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <span className="text-sm text-slate-400">Partida</span>
                                <span className="text-sm font-bold text-slate-200">
                                    {result.receipt.certificate.match.participant1} x {result.receipt.certificate.match.participant2}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <span className="text-sm text-slate-400">Placar</span>
                                <span className="font-serif text-lg font-bold text-slate-100">
                                    {result.receipt.certificate.finalScore.participant1} - {result.receipt.certificate.finalScore.participant2}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <span className="text-sm text-slate-400">Integridade do hash</span>
                                <span className={`text-sm font-bold ${result.integrityVerified ? 'text-solana-green' : 'text-red-400'}`}>
                                    {result.integrityVerified ? 'Confere' : 'NÃO confere'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-3">
                                <span className="text-sm text-slate-400">Certificado base on-chain</span>
                                <span className={`text-sm font-bold ${result.onchainVerified ? 'text-solana-green' : 'text-red-400'}`}>
                                    {result.onchainVerified ? 'Confirmado' : 'Não encontrado'}
                                </span>
                            </div>
                            {result.receipt.bet && (
                                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                    <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Aposta Anexada</p>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">Casa:</span> <span className="text-slate-200">{result.receipt.bet.casa}</span></p>
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">Mercado:</span> <span className="text-slate-200">{result.receipt.bet.mercado}</span></p>
                                        <p className="text-xs text-slate-400"><span className="text-slate-400">Odd:</span> <span className="text-slate-200">{result.receipt.bet.odd}</span></p>
                                    </div>
                                </div>
                            )}
                            <a
                                href={`https://explorer.solana.com/tx/${result.receipt.certificate.txHash}?cluster=devnet`}
                                target="_blank" rel="noreferrer"
                                className="block text-center text-xs font-bold text-solana-purple hover:underline pt-2"
                            >
                                Ver certificado base no Solana Explorer →
                            </a>
                        </div>
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
}
