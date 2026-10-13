'use client';

// Chọn ĐỀ, rồi thi cả đề hoặc thi riêng một Part.
//
// Một đề TOEIC là 200 câu làm liền một mạch: Listening (Part 1-4) rồi vào
// thẳng Reading (Part 5-7). "Thi cả đề" chạy đúng như vậy.
//
// Vẫn cho thi riêng từng Part, vì đây là app luyện: ngồi đủ hai tiếng mỗi lần
// thì không ai luyện nổi, và người học thường yếu ở một Part cụ thể. Thi riêng
// vẫn giữ nguyên luật của Part đó.

import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { SECTIONS } from './rules';
import { clock } from './useExamRun';

export function ExamPicker({ papers, history, onStart }) {
  if (!papers?.length) {
    return <p className="caption">Chưa có đề nào.</p>;
  }

  return (
    <div className="paper-grid">
      {papers.map((p) => (
        <PaperCard key={p.id} paper={p} history={history} onStart={onStart} />
      ))}
    </div>
  );
}

/** Một đề: thi cả đề, hoặc thi riêng từng Part. */
function PaperCard({ paper, history, onStart }) {
  return (
    <Card className="paper">
      <div className="paper-head">
        <div>
          <b className="paper-title">{paper.title}</b>
          <p className="caption">
            {paper.total} câu · {clock(paper.seconds)}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => onStart(paper.id, null)}>
          Thi cả đề
        </Button>
      </div>

      <LastScore history={history} paperId={paper.id} only={null} />

      {SECTIONS.map((s) => {
        const parts = paper.parts.filter((p) => p.section === s.kind);
        if (!parts.length) return null;
        const count = parts.reduce((n, p) => n + p.count, 0);
        return (
          <div key={s.kind} className="paper-sections">
            <span className="exam-group-title">
              {s.label} · {count} câu
            </span>
            {parts.map((p) => (
              <PartRow key={p.part} part={p} history={history} paperId={paper.id} onStart={onStart} />
            ))}
          </div>
        );
      })}
    </Card>
  );
}

/** Một Part của đề: thi riêng được. */
function PartRow({ part, history, paperId, onStart }) {
  return (
    <div className="paper-section">
      <div className="paper-section-main">
        <div className="exam-row-head">
          <b>
            Part {part.part} · {part.label}
          </b>
          <Badge>
            {part.count} câu · {clock(part.seconds)}
          </Badge>
        </div>
        <LastScore history={history} paperId={paperId} only={part.part} />
      </div>
      <Button size="sm" onClick={() => onStart(paperId, part.part)}>
        Thi riêng
      </Button>
    </div>
  );
}

/** Điểm lần thi gần nhất của đúng bài này. Không có thì không hiện gì. */
function LastScore({ history, paperId, only }) {
  const last = (history || [])
    .filter((a) => a.paperId === paperId && (a.only ?? null) === only)
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
