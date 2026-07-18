import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ShieldCheck, Home, Receipt, Search } from 'lucide-react';

const Layout = () => {
    const location = useLocation();

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 relative w-full">
            {/* Background Glow Effect */}
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-solana-purple/10 to-transparent pointer-events-none"></div>

            {/* Header */}
            <header className="relative border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-50 sticky top-0">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-20">
                    <div className="flex items-center">
                        <img src="/logo_transparent.png" alt="Recibet Logo" className="h-14 md:h-16 object-contain drop-shadow-[0_0_15px_rgba(20,241,149,0.3)] hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(153,69,255,0.5)] transition-all cursor-pointer" />
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/" className={`flex items-center gap-2 text-sm font-semibold transition-all ${location.pathname === '/' ? 'text-solana-green drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}>
                            <Home className="w-5 h-5" /> Partidas
                        </Link>
                        <Link to="/verify" className={`flex items-center gap-2 text-sm font-semibold transition-all ${location.pathname === '/verify' ? 'text-solana-green drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}>
                            <Search className="w-5 h-5" /> Verificar
                        </Link>
                        <Link to="/receipts" className={`flex items-center gap-2 text-sm font-semibold transition-all ${location.pathname === '/receipts' ? 'text-solana-green drop-shadow-[0_0_8px_rgba(20,241,149,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}>
                            <Receipt className="w-5 h-5" /> Recibos
                        </Link>
                    </nav>

                    <div>
                        <WalletMultiButton>
                            Conectar Carteira
                        </WalletMultiButton>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full mx-auto md:p-6 pb-24 md:pb-10">
                <Outlet />
            </main>

            {/* Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 flex justify-around p-3 z-50">
                <Link to="/" className={`flex flex-col items-center p-2 rounded-xl transition-all ${location.pathname === '/' ? 'text-solana-green bg-solana-green/10 shadow-[0_0_10px_rgba(20,241,149,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Partidas</span>
                </Link>
                <Link to="/verify" className={`flex flex-col items-center p-2 rounded-xl transition-all ${location.pathname === '/verify' ? 'text-solana-green bg-solana-green/10 shadow-[0_0_10px_rgba(20,241,149,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Search className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Verificar</span>
                </Link>
                <Link to="/receipts" className={`flex flex-col items-center p-2 rounded-xl transition-all ${location.pathname === '/receipts' ? 'text-solana-green bg-solana-green/10 shadow-[0_0_10px_rgba(20,241,149,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Receipt className="w-6 h-6" />
                    <span className="text-xs font-medium mt-1">Recibos</span>
                </Link>
            </nav>
        </div>
    );
};

export default Layout;
