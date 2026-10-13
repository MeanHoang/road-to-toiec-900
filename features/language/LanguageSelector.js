'use client';

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './LanguageProvider';
import { LANGUAGES } from './translate';

const FLAGS = { en: '🇬🇧', vi: '🇻🇳', zh: '🇨🇳', ko: '🇰🇷' };

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const options = useRef([]);
  const current = LANGUAGES.find((language) => language.code === locale);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    options.current[LANGUAGES.findIndex((language) => language.code === locale)]?.focus();
    const outside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, locale]);

  return (
    <div className="language-bar">
      <div className="language-picker" ref={root} onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}>
        <button
          ref={trigger}
          type="button"
          className={`language-trigger ${open ? 'is-open' : ''}`}
          aria-label={`${t('Language')}: ${current.label}`}
          aria-expanded={open}
          aria-controls="language-options"
          onClick={() => setOpen((previous) => !previous)}
        >
          <span className="language-flag" aria-hidden="true">{FLAGS[locale]}</span>
          <span lang={locale}>{current.label}</span>
          <svg className="language-chevron" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="m5 7 5 5 5-5" />
          </svg>
        </button>

        {open && (
          <div className="language-popover" id="language-options">
            <div className="language-heading">
              <strong>{t('Interface language')}</strong>
              <span>{t('Your choice is saved automatically.')}</span>
            </div>
            <div role="radiogroup" aria-label={t('Language')} className="language-options">
              {LANGUAGES.map((language, index) => (
                <button
                  key={language.code}
                  ref={(node) => { options.current[index] = node; }}
                  type="button"
                  role="radio"
                  aria-checked={locale === language.code}
                  tabIndex={locale === language.code ? 0 : -1}
                  className={`language-option ${locale === language.code ? 'is-selected' : ''}`}
                  onClick={() => { setLocale(language.code); close(); }}
                  onKeyDown={(event) => {
                    let next;
                    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % LANGUAGES.length;
                    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + LANGUAGES.length - 1) % LANGUAGES.length;
                    if (event.key === 'Home') next = 0;
                    if (event.key === 'End') next = LANGUAGES.length - 1;
                    if (next != null) {
                      event.preventDefault();
                      options.current[next]?.focus();
                    }
                  }}
                >
                  <span className="language-symbol" aria-hidden="true">{FLAGS[language.code]}</span>
                  <span className="language-name" lang={language.code}>{language.label}</span>
                  {locale === language.code && <span className="language-check" aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
