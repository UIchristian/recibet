import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

// Chip monospace com botao de copiar, reaproveitado em qualquer lugar que mostre um
// hash/assinatura (verificacao publica, recibos, revisao do recibo).
export default function HashChip({ value, label }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard indisponivel (ex: contexto nao seguro) - falha silenciosa, o
            // usuario ainda pode selecionar e copiar o texto manualmente.
        }
    };

    return (
        <div>
            {label && <p className="text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">{label}</p>}
            <div className="flex items-stretch gap-2">
                <p className="flex-1 min-w-0 font-mono text-xs text-solana-green break-all bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner">
                    {value}
                </p>
                <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'Hash copiado' : 'Copiar hash'}
                    className="flex-none flex items-center justify-center w-11 rounded-xl border border-slate-700 text-slate-400 hover:text-solana-green hover:border-solana-green/50 hover:bg-solana-green/10 transition-colors"
                >
                    {copied ? <Check className="w-4 h-4 text-solana-green" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                    href={`https://explorer.solana.com/tx/${value}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver no Solana Explorer"
                    className="flex-none flex items-center justify-center w-11 rounded-xl border border-slate-700 text-slate-400 hover:text-solana-purple hover:border-solana-purple/50 hover:bg-solana-purple/10 transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
