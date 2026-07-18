import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

import Layout from './components/Layout';
import MatchList from './pages/MatchList';
import MatchDetail from './pages/MatchDetail';
import SealingFlow from './pages/SealingFlow';
import PublicVerification from './pages/PublicVerification';
import MyReceipts from './pages/MyReceipts';

function App() {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Layout />}>
                                <Route index element={<MatchList />} />
                                <Route path="match/:id" element={<MatchDetail />} />
                                <Route path="seal/:id" element={<SealingFlow />} />
                                <Route path="verify" element={<PublicVerification />} />
                                <Route path="receipts" element={<MyReceipts />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
