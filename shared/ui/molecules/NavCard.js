import Link from 'next/link';
import { Progress } from '@/shared/ui/atoms/Progress';

/**
 * Thẻ điều hướng dạng danh sách — dùng cho cả danh sách buổi học lẫn
 * danh sách hoạt động trong một buổi. `lead` là số buổi hoặc icon.
 */
export function NavCard({ href, lead, leadBrand, title, meta, trailing, percent, empty }) {
  const body = (
    <>
      <span className={`lead-slot ${leadBrand ? 'brand' : ''}`} aria-hidden="true">
        {lead}
      </span>
      <span className="body">
        <span className="title">{title}</span>
        <span className="meta">{meta}</span>
        {percent != null && <Progress percent={percent} size="sm" />}
      </span>
      {trailing ??
        (href && (
          <span className="chevron" aria-hidden="true">
            ›
          </span>
        ))}
    </>
  );

  if (empty || !href) return <div className="nav-card nav-card-empty">{body}</div>;
  return (
    <Link className="nav-card" href={href}>
      {body}
    </Link>
  );
}
