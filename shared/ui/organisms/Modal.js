'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useEffect } from 'react';

/**
 * Hộp thoại nổi lên giữa màn. Không biết bên trong là gì.
 *
 * Màn rộng: nổi giữa. Màn hẹp: trượt lên từ đáy như tấm thẻ kéo lên — ngón tay
 * ở dưới, nút đóng phải nằm trong tầm với.
 */
export function Modal({ open, onClose, title, children }) {
  const t = useTranslation();
  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);

    // Khoá cuộn nền: mở hộp thoại mà nền vẫn trôi thì rất mất phương hướng.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-scrim" onClick={onClose}>
      {/* Bấm trong hộp thì không tính là bấm ra ngoài. */}
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={t(title)}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <strong>{t(title)}</strong>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('Close')}>
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
