'use client';

import Link from 'next/link';
import { lessonActivities } from '@/features/lesson/activities';

/**
 * Một buổi trong drawer: bấm vào tên buổi thì xổ danh sách hoạt động.
 *
 * Buổi đang học tự xổ sẵn, buổi khác thu lại — mười buổi mà xổ hết thì phải
 * cuộn mới thấy được cái đang cần.
 */
export function DayNavGroup({ day, expanded, currentPath, onToggle, onNavigate }) {
  const activities = lessonActivities(day);
  const overview = `/day/${day.slug}`;

  return (
    <li className="nav-group">
      <button
        type="button"
        className={`nav-day ${currentPath.startsWith(overview) ? 'is-current' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="nav-day-no">{String(day.no).padStart(2, '0')}</span>
        <span className="nav-day-title">{day.title}</span>
        <span className={`nav-caret ${expanded ? 'is-open' : ''}`} aria-hidden="true">
          ›
        </span>
      </button>

      {expanded && (
        <ul className="nav-activities">
          <li>
            <Link
              href={overview}
              className={`nav-link ${currentPath === overview ? 'is-current' : ''}`}
              onClick={onNavigate}
            >
              <span aria-hidden="true">🏠</span> Tổng quan buổi
            </Link>
          </li>
          {activities.map((a) => (
            <li key={a.key}>
              <Link
                href={a.href}
                className={`nav-link ${currentPath.startsWith(a.href) ? 'is-current' : ''}`}
                onClick={onNavigate}
              >
                <span aria-hidden="true">{a.icon}</span> {a.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
