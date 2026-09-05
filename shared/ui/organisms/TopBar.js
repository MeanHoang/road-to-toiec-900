'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Thanh dính trên cùng: nút quay lại + breadcrumb. */
export function TopBar({ crumbs }) {
  const router = useRouter();
  return (
    <nav className="topbar" aria-label="Điều hướng">
      <button className="back" onClick={() => router.back()} type="button" aria-label="Quay lại">
        ←
      </button>
      <div className="breadcrumb">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'contents' }}>
            {i > 0 && (
              <span className="sep" aria-hidden="true">
                ›
              </span>
            )}
            {c.href ? <Link href={c.href}>{c.label}</Link> : <b aria-current="page">{c.label}</b>}
          </span>
        ))}
      </div>
    </nav>
  );
}
