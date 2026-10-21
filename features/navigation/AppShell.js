'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MidAutumnScene } from '@/shared/ui/organisms/MidAutumnScene';
import { WomenDayScene } from '@/shared/ui/organisms/WomenDayScene';
import { ACTIVE_EVENT } from '@/shared/lib/event';
import Link from 'next/link';
import { Icon } from '@/shared/ui/atoms/Icon';
import { NavDrawer } from './NavDrawer';
import { AppearanceSettings } from '@/features/appearance/AppearanceSettings';
import { LanguageSelector } from '@/features/language/LanguageSelector';

/** Shared workspace: persistent navigation on desktop, an overlay on mobile. */
const isWide = () => window.matchMedia('(min-width: 1024px)').matches;

export function AppShell({ children, initialPalette }) {
  const t = useTranslation();
  const pathname = usePathname() || '/';
  const inLesson = pathname.startsWith('/day/');

  const [open, setOpen] = useState(false);

  useEffect(() => {
    const viewport = window.matchMedia('(min-width: 1024px)');
    const syncDrawer = () => setOpen(viewport.matches);
    syncDrawer();
    viewport.addEventListener('change', syncDrawer);
    return () => viewport.removeEventListener('change', syncDrawer);
  }, []);

  // Bấm một mục trong ngăn kéo: màn hẹp thì đóng lại cho thấy nội dung, màn
  // rộng thì GIỮ NGUYÊN — ngăn kéo ở đó là để nhảy qua nhảy lại.
  const closeIfNarrow = () => {
    if (!isWide()) setOpen(false);
  };

  return (
    <div className={`shell ${open ? 'drawer-open' : ''}`}>
      {/* Bật/tắt hiệu ứng lễ hội là quyết định của người viết code, ở
          shared/lib/event.js — không phải một công tắc cho người học. */}
      {ACTIVE_EVENT === 'mid-autumn' && <MidAutumnScene />}
      {ACTIVE_EVENT === 'women-day' && <WomenDayScene />}

      <NavDrawer
        open={open}
        onClose={() => setOpen(false)}
        onNavigate={closeIfNarrow}
        currentPath={pathname}
      />

      <div className="shell-main">
        <div className="workspace-bar">
          <button type="button" className="workspace-menu" onClick={() => setOpen(!open)} aria-label={t(open ? 'Collapse navigation menu' : 'Open navigation menu')} aria-expanded={open}><Icon name="menu" /></button>
          <Link href="/" className="workspace-brand">TOEIC <b>900</b></Link>
          <span className="workspace-context">{t(inLesson ? 'Lesson navigation' : pathname.startsWith('/exam') ? 'Exam room' : 'Choose a lesson to get started')}</span>
          <LanguageSelector />
          <AppearanceSettings initialPalette={initialPalette} />
        </div>
        <main className="app-shell">{children}</main>
      </div>
    </div>
  );
}
