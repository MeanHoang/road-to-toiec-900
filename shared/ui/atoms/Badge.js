'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
export function Badge({ tone = 'neutral', eyebrow, className = '', children, ...props }) {
  const t = useTranslation();
  const translatedChildren = t(children);
  const cls = [
    'badge',
    tone !== 'neutral' && `badge-${tone}`,
    eyebrow && 'badge-eyebrow',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <span className={cls} {...props}>{translatedChildren}</span>;
}
