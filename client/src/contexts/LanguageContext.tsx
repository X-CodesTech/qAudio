import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type LanguageContextType = {
  currentLanguage: string;
  changeLanguage: (lang: string) => void;
  availableLanguages: { code: string; name: string }[];
};

const defaultLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'pt', name: 'Português' },
  { code: 'he', name: 'עברית' },
  { code: 'ar', name: 'العربية' }
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  useEffect(() => {
    // Handle RTL direction for Arabic and Hebrew
    document.documentElement.dir = ['ar', 'he'].includes(currentLanguage) ? 'rtl' : 'ltr';
    
    // Set language class on the body for CSS customization
    document.body.classList.remove('lang-en', 'lang-es', 'lang-fr', 'lang-de', 'lang-pt', 'lang-he', 'lang-ar');
    document.body.classList.add(`lang-${currentLanguage}`);
  }, [currentLanguage]);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    availableLanguages: defaultLanguages
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};