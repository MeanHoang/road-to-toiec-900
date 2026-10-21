'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { Button } from '@/shared/ui/atoms/Button';

export function Pagination({ page, total, pageSize, onChange }) {
  const t = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <nav className="pagination" aria-label={t('Pages')}>
    <span className="caption" aria-live="polite">{total ? `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, total)} / ${total}` : '0 / 0'}</span>
    <div className="row"><Button size="sm" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label={t('Previous page')}>←</Button><span className="pagination-position">{page + 1} / {pages}</span><Button size="sm" disabled={page + 1 >= pages} onClick={() => onChange(page + 1)} aria-label={t('Next page')}>→</Button></div>
  </nav>;
}
