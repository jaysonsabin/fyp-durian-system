"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ms'); // Default to Bahasa Melayu
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('durian_language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ms')) {
      setLanguage(savedLanguage);
    }
    setIsMounted(true);
  }, []);

  const changeLanguage = (lang) => {
    if (lang === 'en' || lang === 'ms') {
      setLanguage(lang);
      localStorage.setItem('durian_language', lang);
    }
  };

  const t = (key) => {
    if (!translations[language]) return key;
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
