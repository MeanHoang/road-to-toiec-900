'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
// Chặn đầu mỗi màn con: chờ nội dung tải xong rồi mới render.
// Gom vào một chỗ để 9 màn không phải lặp lại đoạn kiểm tra loading/không tìm thấy.

import { Notice } from '@/shared/ui/atoms/Notice';
import { LessonSkeleton } from './LessonSkeleton';
import { useDay } from './DayProvider';

export function DayGate({ slug, children }) {
  const t = useTranslation();
  const { day, loading, error } = useDay();

  if (loading) {
    return <LessonSkeleton />;
  }

  if (error || !day) {
    return (
      <div className="page-head">
        <Notice>
          {error ? t('Unable to load content: {0}', [error]) : t('Lesson not found: "{0}".', [slug])}
        </Notice>
      </div>
    );
  }

  return children(day);
}
