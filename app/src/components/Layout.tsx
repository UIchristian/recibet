import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Home, Receipt, Search } from 'lucide-react';

const Layout = () => {
    const location = useLocation();
    const { connected } = useWallet();

    const isActive = (path: string) => location.pathname === path;
    const current = (path: string) => (isActive(path) ? 'page' : undefined);

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 relative w-full">
            {/* Background Glow Effect */}
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-solana-purple/10 to-transparent pointer-events-none"></div>

            {/* Header */}
            <header className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-50 sticky top-0">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-24">
                    <Link to="/" className="flex items-center" aria-label="Recibet, ir para a página inicial">
                        <img src="/logo_transparent.png" alt="" className="h-16 md:h-20 object-contain transition-transform hover:scale-105" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8" aria-label="Navegação principal">
                        <Link to="/" aria-current={current('/')} className={`flex items-center gap-2 text-sm font-semibold transition-all ${isActive('/') ? 'text-solana-green drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}>
                            <Home className="w-5 h-5" /> Partidas
                        </Link>
                        <Link to="/verify" aria-current={current('/verify')} className={`flex items-center gap-2 text-sm font-semibold transition-all ${isActive('/verify') ? 'text-solana-green drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}>
                            <Search className="w-5 h-5" /> Verificar
                        </Link>
                        <Link to="/receipts" aria-current={current('/receipts')} className={`flex items-center gap-2 text-sm font-semibold transition-all ${isActive('/receipts') ? 'text-solana-green drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}>
                            <Receipt className="w-5 h-5" /> Recibos
                        </Link>
                    </nav>

                    <div>
                        {/* WalletMultiButton usa "children" como texto fixo, mesmo ja conectado -
                            por isso so passamos o rotulo quando ainda nao ha carteira conectada.
                            Conectado, ele mesmo mostra o endereco truncado (ex: 3E1g..Bz2Pz). */}
                        <WalletMultiButton>
                            {connected ? undefined : 'Conectar Carteira'}
                        </WalletMultiButton>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full mx-auto md:p-6 pb-24 md:pb-10">
                <Outlet />
            </main>

            {/* Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around p-3 z-50" aria-label="Navegação">
                <Link to="/" aria-current={current('/')} className={`flex flex-col items-center p-2.5 rounded-xl transition-all ${isActive('/') ? 'text-solana-green bg-solana-green/10 shadow-[0_0_10px_rgba(20,241,149,0.2)]' : 'text-slate-400 hover:text-slate-300'}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Partidas</span>
                </Link>
                <Link to="/verify" aria-current={current('/verify')} className={`flex flex-col items-center p-2.5 rounded-xl transition-all ${isActive('/verify') ? 'text-solana-green bg-solana-green/10 shadow-[0_0_10px_rgba(20,241,149,0.2)]' : 'text-slate-400 hover:text-slate-300'}`}>
                    <Search className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Verificar</span>
                </Link>
                <Link to="/receipts" aria-current={current('/receipts')} className={`flex flex-col items-center p-2.5 rounded-xl transition-all ${isActive('/receipts') ? 'text-solana-green bg-solana-green/10 shadow-[0_0_10px_rgba(20,241,149,0.2)]' : 'text-slate-400 hover:text-slate-300'}`}>
                    <Receipt className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Recibos</span>
                </Link>
            </nav>
        </div>
    );
};

export default Layout;
