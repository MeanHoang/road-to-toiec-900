'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
export function Notice({ className = '', children, ...props }) {
  const t = useTranslation();
  const translatedChildren = t(children);
  return <div className={`notice ${className}`} {...props}>{translatedChildren}</div>;
}
