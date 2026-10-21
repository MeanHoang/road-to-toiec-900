'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import Link from 'next/link';
import { Icon } from '@/shared/ui/atoms/Icon';
import { useEffect, useState } from 'react';
import { useDayIndex } from '@/features/lesson/useDayIndex';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { Drawer } from '@/shared/ui/organisms/Drawer';
import { DayNavGroup } from './DayNavGroup';
import { daySlugOf } from './currentRoute';

/** Nội dung của ngăn kéo: trang chủ, rồi từng buổi xổ ra các hoạt động. */
export function NavDrawer({ open, onClose, onNavigate, currentPath }) {
  const t = useTranslation();
  const { days, loading } = useDayIndex();
  const activeSlug = daySlugOf(currentPath);

  // Buổi đang học tự xổ. Người dùng bấm mở buổi khác thì tôn trọng lựa chọn đó,
  // đừng đóng lại chỉ vì đường dẫn đổi.
  const [expanded, setExpanded] = useState(activeSlug);
  useEffect(() => {
    if (activeSlug) setExpanded(activeSlug);
  }, [activeSlug]);

  return (
    <Drawer open={open} onClose={onClose} label={t('Lesson navigation')}>
      <div className="drawer-head">
        <Link href="/" className="drawer-brand" onClick={onNavigate}>
          <span className="brand-symbol brand-mascot"><img src="/brand/chicken-mark.webp" width="38" height="38" alt="" /></span><span>TOEIC <b>900</b><small>Road to TOEIC 900</small></span>
        </Link>
        <button
          type="button"
          className="drawer-handle drawer-handle-in"
          onClick={onClose}
          aria-label={t('Collapse navigation menu')}
          aria-expanded={true}
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      <nav className="drawer-body">
        <div className="nav-primary">
          <Link href="/" onClick={onNavigate} className={`nav-link ${currentPath === '/' ? 'is-current' : ''}`} aria-current={currentPath === '/' ? 'page' : undefined}><Icon name="home" />{t('Lessons')}</Link>
          <Link href="/exam" onClick={onNavigate} className={`nav-link ${currentPath.startsWith('/exam') ? 'is-current' : ''}`} aria-current={currentPath.startsWith('/exam') ? 'page' : undefined}><Icon name="exam" />{t('Exam room')}</Link>
        </div>
        <p className="nav-section-label">{t('Lesson navigation')}</p>
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
