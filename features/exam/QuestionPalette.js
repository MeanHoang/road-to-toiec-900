'use client';

// Ô chọn câu: lưới số câu, câu nào đã chọn đáp án thì tô đậm.
//
// Đây không phải tiện ích thêm thắt, nó là cách làm bài mà chính ETS hướng
// dẫn cho phần Đọc: "if you do not know the answer to a question, come back
// to it later" (Examinee Handbook). Không có ô này thì "quay lại sau" nghĩa là
// bấm Câu trước hai chục lần.
//

export function QuestionPalette({ marks, onGo }) {
  const blank = marks.filter((m) => !m.picked).length;

  return (
    <div className="palette">
      <div className="palette-head">
        <span className="eyebrow">Questions</span>
        <span className="caption">
          {blank === 0 ? 'All answered' : `${blank} unanswered`}
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
            aria-label={`Question ${m.no}${m.picked ? ', answered' : ', unanswered'}`}
            onClick={() => onGo(m.at)}
          >
            {m.no}
          </button>
        ))}
      </div>
    </div>
  );
}
