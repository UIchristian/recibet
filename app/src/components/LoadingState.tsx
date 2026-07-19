import React from 'react';

// Spinner de marca (gradiente roxo/verde), reutilizado em todo estado de carregamento de
// pagina no lugar de texto puro. role="status" ja avisa leitor de tela sozinho.
export default function LoadingState({ message = 'Carregando...' }: { message?: string }) {
    return (
        <div role="status" className="flex flex-col items-center justify-center gap-4 py-16">
            <span
                className="w-10 h-10 rounded-full border-[3px] border-slate-800 border-t-solana-green border-r-solana-purple animate-spin"
                aria-hidden="true"
            />
            <span className="text-sm text-slate-400">{message}</span>
        </div>
    );
}
