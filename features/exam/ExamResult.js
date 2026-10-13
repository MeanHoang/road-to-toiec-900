'use client';

// Kết quả một lượt thi.
//
// Chấm RIÊNG từng phần chứ không gộp một con số: đề thật cũng trả hai điểm
// riêng cho Nghe và Đọc, và biết mình yếu phần nào mới sửa được.
//
// Hiện SỐ CÂU ĐÚNG, không quy ra thang 10-990. ETS không công khai bảng quy
// đổi câu đúng sang điểm, nên mọi con số kiểu "bạn được 720" đều là bịa.

import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Progress } from '@/shared/ui/atoms/Progress';
import { partTitle } from './rules';

/** Cắt mảng đáp án theo ranh giới từng chặng đã lưu trong lượt thi. */
function bySection(attempt) {
  const out = [];
  let at = 0;
  for (const s of attempt.sections || [{ label: attempt.label, count: attempt.total }]) {
    const slice = attempt.answers.slice(at, at + s.count);
    out.push({
      ...s,
      answers: slice,
      from: at,
      correct: slice.filter((a) => a.picked === a.answer).length,
    });
    at += s.count;
  }
  return out;
}

/** Điểm theo từng Part, theo thứ tự đề. Lượt thi cũ không ghi Part thì bỏ qua. */
function byPart(attempt) {
  const out = new Map();
  for (const a of attempt.answers) {
    if (!a.part) continue;
    const row = out.get(a.part) || { part: a.part, count: 0, correct: 0 };
    row.count++;
    if (a.picked === a.answer) row.correct++;
    out.set(a.part, row);
  }
  return [...out.values()].sort((x, y) => x.part - y.part);
}

export function ExamResult({ attempt, onAgain, onBack }) {
  const sections = bySection(attempt);
  const parts = byPart(attempt);
  const correct = attempt.answers.filter((a) => a.picked === a.answer).length;
  const blank = attempt.answers.filter((a) => !a.picked).length;

  return (
    <div className="stack">
      <Card className="exam-score">
        <span className="eyebrow">
          {attempt.label}
          {attempt.learner ? ` · ${attempt.learner}` : ''}
        </span>
        <b className="exam-score-big">
          {correct}/{attempt.total}
        </b>
        <span className="caption">câu đúng</span>
        <Progress percent={(correct / attempt.total) * 100} label="Tỉ lệ đúng" />
        {blank > 0 && (
          <p className="caption">
            {blank} câu bỏ trống — trong đề thật, bỏ trống tính như trả lời sai, nên cứ chọn bừa
            còn hơn để trống.
          </p>
        )}
      </Card>

      {/* Chỉ tách ra khi đề có hơn một phần. Thi riêng phần Nghe mà vẫn bày
          một bảng "theo phần" với đúng một dòng thì chỉ tổ rối. */}
      {sections.length > 1 && (
        <Card>
          <span className="eyebrow">Theo phần</span>
          <div className="exam-sections">
            {sections.map((s) => (
              <div key={s.label} className="exam-section-score">
                <b>{s.label}</b>
                <span className="exam-section-num">
                  {s.correct}/{s.count}
                </span>
                <Progress percent={(s.correct / s.count) * 100} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Theo Part: biết mình yếu Part nào mới biết luyện riêng Part đó. */}
      {parts.length > 1 && (
        <Card>
          <span className="eyebrow">Theo Part</span>
          <div className="exam-sections">
            {parts.map((p) => (
              <div key={p.part} className="exam-section-score">
                <b>{partTitle(p.part)}</b>
                <span className="exam-section-num">
                  {p.correct}/{p.count}
                </span>
                <Progress percent={(p.correct / p.count) * 100} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <span className="eyebrow">Từng câu</span>
        {sections.map((s) => (
          <div key={s.label} className="exam-review">
            {sections.length > 1 && <span className="caption">{s.label}</span>}
            {s.answers.map((a, i) => {
              const ok = a.picked === a.answer;
              return (
                <div key={a.id} className="exam-review-row">
                  <span className="exam-review-no">{a.no ?? s.from + i + 1}</span>
                  <Badge tone={ok ? 'success' : 'danger'}>{ok ? 'đúng' : 'sai'}</Badge>
                  <span className="caption">
                    Chọn {a.picked || '—'} · Đáp án {a.answer}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </Card>

      <div className="exam-actions">
        <Button variant="primary" onClick={onAgain}>
          Thi lại
        </Button>
        <Button onClick={onBack}>Chọn đề khác</Button>
      </div>
    </div>
  );
}
