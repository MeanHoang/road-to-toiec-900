'use client';

import { useTranslation } from '@/features/language/LanguageProvider';

/** Đầu trang của màn con: nhãn nhỏ + tiêu đề + phụ đề. */
export function PageHeader({ eyebrow, title, subtitle, children }) {
  const t = useTranslation();
  return (
    <header className="page-head">
      {eyebrow && <span className="eyebrow">{t(eyebrow)}</span>}
      <h1>{t(title)}</h1>
      {subtitle && <p className="subtitle">{t(subtitle)}</p>}
      {children}
    </header>
  );
}
