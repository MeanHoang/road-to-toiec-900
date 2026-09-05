'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NavDrawer } from './NavDrawer';

/**
 * Khung của cả app: ngăn kéo bên trái + nội dung bên phải.
 *
 * Không có thanh tiêu đề riêng: mỗi màn đã tự có tiêu đề của nó, thêm một
 * thanh nữa chỉ để lặp lại đúng chữ đó là thừa. Nút đóng/mở nằm ngay trong
 * ngăn kéo lúc mở, và co về mép trái lúc đóng.
 */
export function AppShell({ children }) {
  const pathname = usePathname() || '/';

  // Màn hẹp phải đóng sẵn, không thì vào trang là bị ngăn kéo che mất nội dung.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(window.matchMedia('(min-width: 1024px)').matches);
  }, []);

  // Bấm một mục trong ngăn kéo: màn hẹp thì đóng lại cho thấy nội dung, màn
  // rộng thì GIỮ NGUYÊN — ngăn kéo ở đó là để nhảy qua nhảy lại.
  const closeIfNarrow = () => {
    if (!window.matchMedia('(min-width: 1024px)').matches) setOpen(false);
  };

  return (
    <div className={`shell ${open ? 'drawer-open' : ''}`}>
      <NavDrawer
        open={open}
        onClose={() => setOpen(false)}
        onNavigate={closeIfNarrow}
        currentPath={pathname}
      />

      {!open && (
        <button
          type="button"
          className="drawer-handle"
          onClick={() => setOpen(true)}
          aria-label="Mở menu điều hướng"
          aria-expanded={false}
        >
          »
        </button>
      )}

      <div className="shell-main">
        <main className="app-shell">{children}</main>
      </div>
    </div>
  );
}
