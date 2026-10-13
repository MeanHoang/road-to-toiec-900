'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
/**
 * Dãy số thứ tự câu — dùng chung cho bài nghe và bài dịch.
 * `isWrong` để câu đã làm nhưng sai KHÔNG hiện xanh giống câu đúng.
 *
 * Thuần trình bày: mọi thứ "câu nào đúng / câu nào sai" do màn gọi truyền vào.
 */
export function StepList({ items, currentIndex, isDone, isWrong, onPick, labelOf }) {
  const t = useTranslation();
  return (
    <div className="steps">
      {items.map((it, i) => {
        const wrong = isWrong?.(it);
        const state =
          i === currentIndex ? 'is-current' : wrong ? 'is-wrong' : isDone(it) ? 'is-done' : '';
        return (
          <button
            key={it.id}
            type="button"
            className={`step ${state}`}
            onClick={() => onPick(i)}
            aria-label={t('Question {0}{1}', [labelOf ? labelOf(it) : i + 1, wrong ? t(' — answered incorrectly') : isDone(it) ? t(' — answered correctly') : ''])}
          >
            {labelOf ? labelOf(it) : i + 1}
          </button>
        );
      })}
    </div>
  );
}
