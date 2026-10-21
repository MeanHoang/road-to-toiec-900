'use client';

import { useTranslation } from '@/features/language/LanguageProvider';

import Link from 'next/link';
import { Icon } from '@/shared/ui/atoms/Icon';
import { Progress } from '@/shared/ui/atoms/Progress';

const leadIcons = { '📘': 'book', '🗂': 'cards', '🎮': 'game', '🖼': 'image', '✍️': 'pen', '🧩': 'exam', '🎧': 'headphones', '📋': 'list', '✏️': 'pen', '🔁': 'pen' };

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
      {body}
    </Link>
  );
}
