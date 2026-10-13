'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
// Ô chọn câu: lưới số câu, câu nào đã chọn đáp án thì tô đậm.
//
// Đây không phải tiện ích thêm thắt, nó là cách làm bài mà chính ETS hướng
// dẫn cho phần Đọc: "if you do not know the answer to a question, come back
// to it later" (Examinee Handbook). Không có ô này thì "quay lại sau" nghĩa là
// bấm Câu trước hai chục lần.
//

export function QuestionPalette({ marks, onGo }) {
  const t = useTranslation();
  const blank = marks.filter((m) => !m.picked).length;

  return (
    <div className="palette">
      <div className="palette-head">
        <span className="eyebrow">{t('Questions')}</span>
        <span className="caption">
          {blank === 0 ? t('All answered') : t('{0} unanswered', [blank])}
        </span>
      </div>
      <div className="palette-grid">
        {marks.map((m) => (
          <button
            key={m.no}
            type="button"
            className={[
              'palette-cell',
              m.picked && 'is-picked',
              m.current && 'is-current',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={m.current ? 'true' : undefined}
            aria-label={t('Question {0}{1}', [m.no, m.picked ? t(', answered') : t(', unanswered')])}
            onClick={() => onGo(m.at)}
          >
            {m.no}
          </button>
        ))}
      </div>
    </div>
  );
}
