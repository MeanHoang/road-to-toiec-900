'use client';

// Chặn đầu mỗi màn con: chờ nội dung tải xong rồi mới render.
// Gom vào một chỗ để 9 màn không phải lặp lại đoạn kiểm tra loading/không tìm thấy.

import { Notice } from '@/shared/ui/atoms/Notice';
import { LessonSkeleton } from './LessonSkeleton';
import { useDay } from './DayProvider';

export function DayGate({ slug, children }) {
  const { day, loading, error } = useDay();

  if (loading) {
    return <LessonSkeleton />;
  }

  if (error || !day) {
    return (
      <div className="page-head">
        <Notice>
          {error ? `Không tải được nội dung: ${error}` : `Không tìm thấy buổi học "${slug}".`}
        </Notice>
      </div>
    );
  }

  return children(day);
}
