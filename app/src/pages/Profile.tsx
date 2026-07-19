import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

const Profile = () => {
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    useEffect(() => {
        const savedProfile = localStorage.getItem('recibet-profile');
        if (savedProfile) {
            const data = JSON.parse(savedProfile);
            setName(data.name || '');
            setEmail(data.email || '');
            setPassword(data.password || '');
            setAvatarUrl(data.avatarUrl || '');
        }
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('recibet-profile', JSON.stringify({ name, email, password, avatarUrl }));
        alert(t('Perfil salvo com sucesso!', 'Profile saved successfully!'));
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-slate-100">{t('Meu Perfil', 'My Profile')}</h1>

            <form onSubmit={handleSave} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-solana-purple overflow-hidden mb-4">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    {t('Sem Foto', 'No Photo')}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-6 mt-6">
                        <button 
                            type="button"
                            onClick={() => setAvatarUrl('https://api.dicebear.com/9.x/avataaars/svg?seed=Winner&backgroundColor=14F195')}
                            className={`w-16 h-16 rounded-full border-2 transition-all overflow-hidden ${avatarUrl.includes('Winner') ? 'border-solana-green scale-110 shadow-[0_0_15px_rgba(20,241,149,0.5)]' : 'border-slate-700 hover:border-slate-500'}`}
                        >
                            <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Winner&backgroundColor=14F195" alt="Avatar 1" />
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAvatarUrl('https://api.dicebear.com/9.x/avataaars/svg?seed=Bettor&backgroundColor=9945FF')}
                            className={`w-16 h-16 rounded-full border-2 transition-all overflow-hidden ${avatarUrl.includes('Bettor') ? 'border-solana-purple scale-110 shadow-[0_0_15px_rgba(153,69,255,0.5)]' : 'border-slate-700 hover:border-slate-500'}`}
                        >
                            <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Bettor&backgroundColor=9945FF" alt="Avatar 2" />
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAvatarUrl('https://api.dicebear.com/9.x/avataaars/svg?seed=Lucky&backgroundColor=f59e0b')}
                            className={`w-16 h-16 rounded-full border-2 transition-all overflow-hidden ${avatarUrl.includes('Lucky') ? 'border-amber-500 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'border-slate-700 hover:border-slate-500'}`}
                        >
                            <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Lucky&backgroundColor=f59e0b" alt="Avatar 3" />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('Nome', 'Name')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-solana-purple text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-solana-purple text-slate-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">{t('Senha', 'Password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-solana-purple text-slate-200"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-4 bg-solana-purple hover:bg-[#8036e6] text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(153,69,255,0.4)]"
                    >
                        {t('Salvar Alterações', 'Save Changes')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
