'use client';

import { useEffect } from 'react';

/**
 * Ngăn kéo bên trái. Chỉ lo CHUYỆN MỞ ĐÓNG, không biết bên trong là gì.
 *
 * Màn rộng: nằm cố định, đẩy nội dung sang phải, thu gọn thì biến mất hẳn.
 * Màn hẹp: đè lên nội dung, có lớp mờ phía sau, bấm ra ngoài hoặc Esc là đóng.
 */
export function Drawer({ open, onClose, label, children }) {
  // Esc để đóng — trên màn hẹp ngăn kéo che gần hết trang, phải luôn có đường ra.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`drawer-scrim ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`drawer ${open ? 'is-open' : ''}`} aria-label={label}>
        {children}
      </aside>
    </>
  );
}
