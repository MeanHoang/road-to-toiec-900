'use client';

// Ô chọn câu: lưới số câu, câu nào đã chọn đáp án thì tô đậm.
//
// Đây không phải tiện ích thêm thắt, nó là cách làm bài mà chính ETS hướng
// dẫn cho phần Đọc: "if you do not know the answer to a question, come back
// to it later" (Examinee Handbook). Không có ô này thì "quay lại sau" nghĩa là
// bấm Câu trước hai chục lần.
//
// Chặng NGHE truyền `readOnly`: băng đã chạy qua thì quay lại cũng vô ích, và
// quay lại sẽ làm audio phát lần nữa — hỏng luật mỗi câu nghe một lần. Vẫn bày
// lưới ra vì nó cho biết mình đã bỏ trống câu nào, chỉ là bấm không nhảy.

export function QuestionPalette({ marks, readOnly, onGo }) {
  const blank = marks.filter((m) => !m.picked).length;

  return (
    <div className="palette">
      <div className="palette-head">
        <span className="eyebrow">Câu hỏi</span>
        <span className="caption">
          {blank === 0 ? 'đã làm hết' : `còn ${blank} câu chưa làm`}
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
            disabled={readOnly}
            aria-current={m.current ? 'true' : undefined}
            aria-label={`Câu ${m.no}${m.picked ? ', đã chọn' : ', chưa chọn'}`}
            onClick={() => onGo(m.no - 1)}
          >
            {m.no}
          </button>
        ))}
      </div>
    </div>
  );
}
