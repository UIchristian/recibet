import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'pt-BR';
export type FontSize = 'normal' | 'large';
export type Theme = 'dark' | 'high-contrast';

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('recibet-language') as Language) || 'pt-BR';
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return (localStorage.getItem('recibet-fontSize') as FontSize) || 'normal';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('recibet-theme') as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('recibet-language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('recibet-fontSize', fontSize);
    if (fontSize === 'large') {
      document.documentElement.classList.add('text-[110%]');
    } else {
      document.documentElement.classList.remove('text-[110%]');
    }
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('recibet-theme', theme);
    if (theme === 'high-contrast') {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [theme]);

  return (
    <SettingsContext.Provider value={{ language, setLanguage, fontSize, setFontSize, theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
