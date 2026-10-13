'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import Link from 'next/link';

/**
 * Nút. Mỗi màn chỉ nên có ĐÚNG MỘT variant="primary".
 * Có `href` thì render thành <Link>, còn lại là <button>.
 */
export function Button({ variant = 'default', size, as, href, className = '', children, ...props }) {
  const t = useTranslation();
  const translatedChildren = t(children);
  const cls = [
    'btn',
    variant !== 'default' && `btn-${variant}`,
    size === 'sm' && 'btn-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) return <Link className={cls} href={href} {...props}>{translatedChildren}</Link>;
  const Tag = as || 'button';
  return <Tag className={cls} type={Tag === 'button' ? 'button' : undefined} {...props}>{translatedChildren}</Tag>;
}
