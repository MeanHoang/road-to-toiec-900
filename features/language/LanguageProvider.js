'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, LANGUAGE_COOKIE, LANGUAGE_KEY, languageOf, translate, validLanguage } from './translate';

const LanguageContext = createContext(null);

function persistLanguage(locale) {
  try { window.localStorage.setItem(LANGUAGE_KEY, locale); } catch { /* Cookies still preserve the preference. */ }
  document.cookie = `${LANGUAGE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LanguageProvider({ initialLocale = 'en', children }) {
  const [locale, setLocale] = useState(() => languageOf(initialLocale));
  const chooseLanguage = useCallback((next) => {
    if (!validLanguage(next)) return;
    persistLanguage(next);
    setLocale(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    // The server reads the cookie, so returning visits render in the saved language.
    // Recover the saved browser preference when a cookie expires or is cleared.
    // An existing valid cookie takes priority because it also drives server rendering.
    let saved = languageOf(initialLocale);
    const cookie = document.cookie.split('; ').find((entry) => entry.startsWith(`${LANGUAGE_COOKIE}=`))?.slice(LANGUAGE_COOKIE.length + 1);
    if (!validLanguage(cookie)) {
      try {
        const stored = window.localStorage.getItem(LANGUAGE_KEY);
        if (validLanguage(stored)) saved = stored;
      } catch { /* Storage may be disabled; retain the server locale. */ }
    }
    setLocale(saved);
    persistLanguage(saved);
    const sync = (event) => {
      if (event.key === LANGUAGE_KEY && validLanguage(event.newValue)) {
        document.cookie = `${LANGUAGE_COOKIE}=${event.newValue}; Path=/; Max-Age=31536000; SameSite=Lax`;
        setLocale(event.newValue);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const value = useMemo(() => ({
    locale,
    dateLocale: LANGUAGES.find((language) => language.code === locale).dateLocale,
    setLocale: chooseLanguage,
    t: (text, values) => translate(locale, text, values),
  }), [locale, chooseLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

export const useTranslation = () => useLanguage().t;
