'use client';

// Chặn đầu mỗi màn con: chờ nội dung tải xong rồi mới render.
// Gom vào một chỗ để 9 màn không phải lặp lại đoạn kiểm tra loading/không tìm thấy.

import { Notice } from '@/shared/ui/atoms/Notice';
import { TopBar } from '@/shared/ui/organisms/TopBar';
import { lessonCrumbs } from './crumbs';
import { useDay } from './DayProvider';

export function DayGate({ slug, crumbLabel, children }) {
  const { day, loading, error } = useDay();

  const crumbs = lessonCrumbs(slug, day?.title || slug, ...(crumbLabel ? [crumbLabel] : []));

  if (loading) {
    return (
      <>
        <TopBar crumbs={crumbs} />
        <div className="page-head">
          <p className="section-lead">Đang tải nội dung buổi học…</p>
        </div>
      </>
    );
  }

  if (error || !day) {
    return (
      <>
        <TopBar crumbs={crumbs} />
        <div className="page-head">
          <Notice>
            {error ? `Không tải được nội dung: ${error}` : `Không tìm thấy buổi học "${slug}".`}
          </Notice>
        </div>
      </>
    );
  }

  return children(day);
}
