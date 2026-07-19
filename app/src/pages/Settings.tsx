import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

const Settings = () => {
    const { language, setLanguage, fontSize, setFontSize, theme, setTheme } = useSettings();
    const isPt = language === 'pt-BR';

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-slate-100">{isPt ? 'Configurações' : 'Settings'}</h1>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-8">
                {/* Idioma */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">{isPt ? 'Idioma' : 'Language'}</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setLanguage('pt-BR')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${language === 'pt-BR' ? 'bg-solana-green text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                            Português (BR)
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${language === 'en' ? 'bg-solana-green text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                            English
                        </button>
                    </div>
                </div>

                {/* Tamanho da Fonte */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">{isPt ? 'Tamanho da Fonte' : 'Font Size'}</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setFontSize('normal')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${fontSize === 'normal' ? 'bg-solana-green text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                            {isPt ? 'Normal' : 'Normal'}
                        </button>
                        <button
                            onClick={() => setFontSize('large')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${fontSize === 'large' ? 'bg-solana-green text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                            {isPt ? 'Grande' : 'Large'}
                        </button>
                    </div>
                </div>

                {/* Tema/Contraste */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">{isPt ? 'Modo de Contraste' : 'Contrast Mode'}</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTheme('dark')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${theme === 'dark' ? 'bg-solana-green text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                            {isPt ? 'Padrão (Escuro)' : 'Standard (Dark)'}
                        </button>
                        <button
                            onClick={() => setTheme('high-contrast')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${theme === 'high-contrast' ? 'bg-solana-green text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
                        >
                            {isPt ? 'Alto Contraste' : 'High Contrast'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
