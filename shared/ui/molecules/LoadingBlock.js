'use client';

import { useTranslation } from '@/features/language/LanguageProvider';

import { Skeleton } from '@/shared/ui/atoms/Skeleton';

/**
 * Vùng đang tải: skeleton cho người nhìn, một câu cho trình đọc màn hình.
 *
 * `role="status"` + `aria-busy` để người dùng screen reader biết trang đang
 * chờ — skeleton là hình ảnh thuần, với họ nó im lặng hoàn toàn.
 */
export function LoadingBlock({ label, children }) {
  const t = useTranslation();
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="stack">
      <span className="visually-hidden">{t(label)}</span>
      {children}
    </div>
  );
}
