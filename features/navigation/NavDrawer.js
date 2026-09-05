'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDayIndex } from '@/features/lesson/useDayIndex';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { Drawer } from '@/shared/ui/organisms/Drawer';
import { DayNavGroup } from './DayNavGroup';
import { daySlugOf } from './currentRoute';

/** Nội dung của ngăn kéo: trang chủ, rồi từng buổi xổ ra các hoạt động. */
export function NavDrawer({ open, onClose, onNavigate, currentPath }) {
  const { days, loading } = useDayIndex();
  const activeSlug = daySlugOf(currentPath);

  // Buổi đang học tự xổ. Người dùng bấm mở buổi khác thì tôn trọng lựa chọn đó,
  // đừng đóng lại chỉ vì đường dẫn đổi.
  const [expanded, setExpanded] = useState(activeSlug);
  useEffect(() => {
    if (activeSlug) setExpanded(activeSlug);
  }, [activeSlug]);

  return (
    <Drawer open={open} onClose={onClose} label="Điều hướng bài học">
      <div className="drawer-head">
        <Link href="/" className="drawer-brand" onClick={onNavigate}>
          Road to TOEIC 900
        </Link>
        <button
          type="button"
          className="drawer-handle drawer-handle-in"
          onClick={onClose}
          aria-label="Thu gọn menu điều hướng"
          aria-expanded={true}
        >
          «
        </button>
      </div>

      <nav className="drawer-body">
        {loading ? (
          <div className="stack" style={{ padding: 'var(--space-3)' }}>
            <Skeleton height={34} />
            <Skeleton height={34} />
          </div>
        ) : (
          <ul className="nav-days">
            {days.map((day) => (
              <DayNavGroup
                key={day.slug}
                day={day}
                expanded={expanded === day.slug}
                currentPath={currentPath}
                onToggle={() => setExpanded((s) => (s === day.slug ? null : day.slug))}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}
      </nav>
    </Drawer>
  );
}
