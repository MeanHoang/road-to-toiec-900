'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MidAutumnScene } from '@/shared/ui/organisms/MidAutumnScene';
import { ACTIVE_EVENT } from '@/shared/lib/event';
import { NavDrawer } from './NavDrawer';
import { isCalmRoute } from './currentRoute';

/**
 * Khung của cả app: ngăn kéo bên trái + nội dung bên phải.
 *
 * Không có thanh tiêu đề riêng: mỗi màn đã tự có tiêu đề của nó, thêm một
 * thanh nữa chỉ để lặp lại đúng chữ đó là thừa. Nút đóng/mở nằm ngay trong
 * ngăn kéo lúc mở, và co về mép trái lúc đóng.
 */
const isWide = () => window.matchMedia('(min-width: 1024px)').matches;

export function AppShell({ children }) {
  const pathname = usePathname() || '/';
  const inLesson = pathname.startsWith('/day/');

  const [open, setOpen] = useState(false);

  /**
   * Ngăn kéo mở khi đang HỌC, đóng khi ở trang chủ: trang chủ vốn đã là danh
   * sách buổi rồi, thêm một danh sách nữa bên cạnh là thừa. Vào một buổi thì
   * mới cần đường nhảy qua lại giữa các phần.
   *
   * Phụ thuộc `inLesson` chứ không phải `pathname`, nên nó chỉ đổi lúc ra/vào
   * khu vực bài học — nhảy giữa các màn trong cùng một buổi thì tôn trọng việc
   * người học đã tự thu ngăn kéo lại. Màn hẹp thì luôn đóng sẵn, không thì vào
   * trang là bị che mất nội dung.
   */
  useEffect(() => {
    setOpen(inLesson && isWide());
  }, [inLesson]);

  // Bấm một mục trong ngăn kéo: màn hẹp thì đóng lại cho thấy nội dung, màn
  // rộng thì GIỮ NGUYÊN — ngăn kéo ở đó là để nhảy qua nhảy lại.
  const closeIfNarrow = () => {
    if (!isWide()) setOpen(false);
  };

  return (
    <div className={`shell ${open ? 'drawer-open' : ''}`}>
      {/* Bật/tắt hiệu ứng lễ hội là quyết định của người viết code, ở
          shared/lib/event.js — không phải một công tắc cho người học. */}
      {ACTIVE_EVENT === 'mid-autumn' && <MidAutumnScene calm={isCalmRoute(pathname)} />}

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
