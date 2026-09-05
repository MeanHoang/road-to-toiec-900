'use client';

import { useProgress } from '@/features/progress/useProgress';
import { summarize } from '@/features/progress/summarize';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { countQuestions } from './stats';

/**
 * Một buổi học trên trang chủ.
 *
 * Là component riêng vì mỗi buổi phải gọi useProgress của RIÊNG nó — hook nhận
 * một slug, không gọi trong vòng lặp được.
 */
export function DayRow({ day }) {
  const { day: state, ready } = useProgress(day.slug);
  const s = summarize(state, day);

  return (
    <NavCard
      href={`/day/${day.slug}`}
      lead={String(day.no).padStart(2, '0')}
      leadBrand
      title={`${day.title} — ${day.subtitle}`}
      meta={`${day.grammar.length} cấu trúc · ${day.vocabulary.length} từ vựng · ${countQuestions(day)} câu nghe`}
      percent={ready ? s.percent : 0}
    />
  );
}
