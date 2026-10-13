'use client';

import { useTranslation } from '@/features/language/LanguageProvider';

export function Section({ title, lead, children }) {
  const t = useTranslation();
  return (
    <section className="section">
      {title && <h2 className="section-title">{t(title)}</h2>}
      {lead && <p className="section-lead">{t(lead)}</p>}
      {children}
    </section>
  );
}
