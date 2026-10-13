'use client';

import { useProgress } from '@/features/progress/useProgress';
import { summarize } from '@/features/progress/summarize';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { countExercises, countQuestions } from './stats';

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
      // Chỉ kể thứ buổi đó có — buổi Part 2 không có từ vựng, ghi "0 từ vựng" là nhiễu.
      meta={[
        day.grammar.length > 0 && `${day.grammar.length} cấu trúc`,
        day.vocabulary.length > 0 && `${day.vocabulary.length} từ vựng`,
        countExercises(day) > 0 && `${countExercises(day)} câu ngữ pháp`,
        countQuestions(day) > 0 && `${countQuestions(day)} câu nghe`,
      ]
        .filter(Boolean)
        .join(' · ')}
      percent={ready ? s.percent : 0}
    />
  );
}
