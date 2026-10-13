'use client';

// Chọn ĐỀ, rồi chọn thi cả đề hay thi riêng một phần.
//
// Bày theo ĐỀ chứ không theo Part, vì một đề TOEIC là 200 câu gồm cả hai kỹ
// năng làm liền một mạch — Nghe 45 phút rồi vào thẳng Đọc 75 phút. Bày Part 1,
// Part 2… thành những bài rời nhau là mô tả sai kỳ thi.
//
// Vẫn cho thi riêng một phần, vì đây là app luyện: ngồi đủ hai tiếng mỗi lần
// thì không ai luyện nổi. Thi riêng vẫn giữ nguyên luật của phần đó.

import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { clock } from './useExamRun';

export function ExamPicker({ papers, history, onStart }) {
  if (!papers?.length) {
    return <p className="caption">Chưa có nội dung nào để dựng đề.</p>;
  }

  // Dòng "đề thật 200 câu, đây mới có X" giống hệt nhau ở mọi đề, nên nói MỘT
  // lần dưới lưới. Lặp lại ở từng thẻ chỉ làm thẻ dài gấp đôi mà không thêm
  // thông tin nào.
  const first = papers[0];

  return (
    <>
      <div className="paper-grid">
        {papers.map((p) => (
          <PaperCard key={p.id} paper={p} history={history} onStart={onStart} />
        ))}
      </div>

      {!first.full && (
        <p className="caption paper-note">
          Mỗi đề thật có 200 câu. Các đề ở đây mới có {first.total} câu vì chưa đủ nội dung
          {Object.keys(first.shortfall).length > 0 && (
            <> — thiếu {Object.keys(first.shortfall).join(', ')}</>
          )}
          . Phần Đọc lấy từ đề mẫu chính thức của ETS (30/100 câu).
        </p>
      )}
    </>
  );
}

/** Một đề: thi cả đề, hoặc thi riêng từng phần. */
function PaperCard({ paper, history, onStart }) {
  const listening = paper.sections.find((s) => s.kind === 'listening');
  const reading = paper.sections.find((s) => s.kind === 'reading');

  return (
      <Card className="paper">
        <div className="paper-head">
          <div>
            <b className="paper-title">{paper.label}</b>
            <p className="caption">
              {paper.total} câu · {clock(paper.seconds)}
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => onStart(paper.nth, null)}>
            Thi cả đề
          </Button>
        </div>

        <LastScore history={history} nth={paper.nth} only={null} />

        <div className="paper-sections">
          {listening && (
            <SectionRow
              section={listening}
              history={history}
              nth={paper.nth}
              only="listening"
              onStart={onStart}
            />
          )}
          {reading && (
            <SectionRow
              section={reading}
              history={history}
              nth={paper.nth}
              only="reading"
              onStart={onStart}
            />
          )}
        </div>

        {/* Đề 2 trở đi đang dùng lại phần Nghe Part 2 và phần Đọc của đề 1,
            vì mỗi thứ đó mới có đúng một bộ. Nói ra, chứ bày bốn đề mà im thì
            người học tưởng mình vừa thi bốn bài khác nhau. */}
        {paper.reuses?.length > 0 && (
          <p className="caption">Dùng lại {paper.reuses.join(', ')} của đề trước.</p>
        )}

      </Card>
  );
}

/** Một phần của đề: thi riêng được, và nói rõ luật của phần đó. */
function SectionRow({ section, history, nth, only, onStart }) {
  return (
    <div className="paper-section">
      <div className="paper-section-main">
        <div className="exam-row-head">
          <b>{section.label}</b>
          <Badge>
            {section.questions.length} câu · {clock(section.seconds)}
          </Badge>
        </div>
        <LastScore history={history} nth={nth} only={only} />
      </div>
      <Button size="sm" onClick={() => onStart(nth, only)}>
        Thi riêng
      </Button>
    </div>
  );
}

/** Điểm lần thi gần nhất của đúng kiểu bài này. Không có thì không hiện gì. */
function LastScore({ history, nth, only }) {
  const last = (history || [])
    .filter((a) => (a.only ?? null) === only && (a.nth ?? 0) === nth)
    .sort((a, b) => b.id.localeCompare(a.id))[0];
  if (!last) return null;

  const when = new Date(last.id);
  return (
    <p className="caption">
      Lần gần nhất: <b>{last.correct}/{last.total} câu</b> ·{' '}
      {when.toLocaleDateString('vi-VN')} {when.toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
    </p>
  );
}
