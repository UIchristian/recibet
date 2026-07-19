import { useSettings } from '../contexts/SettingsContext';

export function useTranslation() {
    const { language } = useSettings();
    const isPt = language === 'pt-BR';
    
    // Simple inline translation helper for clean JSX
    const t = (ptText: string, enText: string) => {
        return isPt ? ptText : enText;
    };

    return { t, language, isPt };
}
