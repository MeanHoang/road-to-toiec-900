'use client';

import { useTranslation } from '@/features/language/LanguageProvider';

import Link, { useLinkStatus } from 'next/link';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { Icon } from '@/shared/ui/atoms/Icon';
import { Progress } from '@/shared/ui/atoms/Progress';

const leadIcons = { '📘': 'book', '🗂': 'cards', '🎮': 'game', '🖼': 'image', '✍️': 'pen', '🧩': 'exam', '🎧': 'headphones', '📋': 'list', '✏️': 'pen', '🔁': 'pen' };

/** Link status also covers the first visit while its route code is downloading. */
function NavigationContent({ children }) {
  const { pending } = useLinkStatus();
  const t = useTranslation();
  return <>
    {children}
    {pending && <span className="nav-card-pending" role="status" aria-busy="true"><span className="visually-hidden">{t('Opening activity')}</span><Skeleton width="65%" height={20} /><Skeleton width="90%" height={14} /><Skeleton width="45%" height={14} /></span>}
  </>;
}

/**
 * Thẻ điều hướng dạng danh sách — dùng cho cả danh sách buổi học lẫn
 * danh sách hoạt động trong một buổi. `lead` là số buổi hoặc icon.
 */
export function NavCard({ href, lead, leadBrand, title, meta, trailing, percent, empty, art, tone = 'mint', artLayout = 'banner' }) {
  const t = useTranslation();
  const body = (
    <>
      {art ? <span className="nav-card-art">{art}<span className="nav-art-label">{trailing || (lead && <span className="badge">{lead}</span>)}</span><span className="nav-art-arrow" aria-hidden="true">↗</span></span> : <span className={`lead-slot ${leadBrand ? 'brand' : ''}`} aria-hidden="true">
        {leadIcons[lead] ? <Icon name={leadIcons[lead]} /> : lead}
      </span>}
      <span className="body">
        <span className="title">{t(title)}</span>
        <span className="meta">{t(meta)}</span>
        {percent != null && <Progress percent={percent} size="sm" />}
      </span>
      {!art && (trailing ??
        (href && (
          <span className="chevron" aria-hidden="true">
            ›
          </span>
        )))}
    </>
  );

  const className = `nav-card ${art ? `nav-illustrated nav-art-${artLayout} learning-tone-${tone}` : ''}`;
  if (empty || !href) return <div className={`${className} nav-card-empty`}>{body}</div>;
  return (
    <Link className={className} href={href}>
      <NavigationContent>{body}</NavigationContent>
    </Link>
  );
}
