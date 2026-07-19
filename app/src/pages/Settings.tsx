import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';

const Settings = () => {
    const { language, setLanguage, fontSize, setFontSize, theme, setTheme } = useSettings();
    const { t } = useTranslation();

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-slate-100">{t('Configurações', 'Settings')}</h1>

            <div className="space-y-8">
                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">{t('Idioma', 'Language')}</h2>
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

                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">{t('Tamanho da Fonte', 'Font Size')}</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setFontSize('normal')}
                            className={`flex-1 py-3 px-4 rounded-xl border ${fontSize === 'normal' ? 'bg-solana-purple/20 border-solana-purple text-solana-purple' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                            {t('Normal', 'Normal')}
                        </button>
                        <button
                            onClick={() => setFontSize('large')}
                            className={`flex-1 py-3 px-4 rounded-xl border ${fontSize === 'large' ? 'bg-solana-purple/20 border-solana-purple text-solana-purple' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                            {t('Grande', 'Large')}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">{t('Modo de Contraste', 'Contrast Mode')}</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex-1 py-3 px-4 rounded-xl border ${theme === 'dark' ? 'bg-solana-purple/20 border-solana-purple text-solana-purple' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                            {t('Padrão (Escuro)', 'Standard (Dark)')}
                        </button>
                        <button
                            onClick={() => setTheme('high-contrast')}
                            className={`flex-1 py-3 px-4 rounded-xl border ${theme === 'high-contrast' ? 'bg-solana-purple/20 border-solana-purple text-solana-purple' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                        >
                            {t('Alto Contraste', 'High Contrast')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
