'use client';

import { useEffect, useState } from 'react';
import { lessonCrumbs } from '@/features/lesson/crumbs';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Textarea } from '@/shared/ui/atoms/Textarea';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { StepList } from '@/shared/ui/molecules/StepList';
import { TopBar } from '@/shared/ui/organisms/TopBar';
import { isAllCorrect, isTagged } from './marks';
import { TokenRow } from './TokenRow';

export function GrammarExerciseScreen({ slug, day }) {
  const { day: state, ready, setTrans } = useProgress(slug);
  const [idx, setIdx] = useState(0);
  const [marks, setMarks] = useState({}); // vị trí token -> 'S' | 'V' | 'O'
  const [checked, setChecked] = useState(false);
  const [draft, setDraft] = useState('');

  const q = day.translation[idx];

  // Vào một câu đã làm thì DỰNG LẠI bài cũ chứ không xoá trắng —
  // để xem lại mình gạch thế nào, đúng hay sai ở đâu.
  useEffect(() => {
    if (!ready) return;
    const prev = state.trans[day.translation[idx].id];
    setMarks(prev?.marks || {});
    setDraft(prev?.draft || '');
    setChecked(Boolean(prev?.done));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, ready]);

  const tagged = isTagged(marks, q.key);
  const correct = isAllCorrect(marks, q.key);

  const done = day.translation.filter((t) => ready && state.trans[t.id]?.done);
  const rightCount = done.filter((t) => state.trans[t.id]?.correct).length;

  const check = () => {
    setChecked(true);
    // Lưu cả bài đã gạch và bản dịch, đúng hay sai đều lưu.
    setTrans(q.id, { done: true, correct, marks, draft });
  };

  /** Xoá bài của riêng câu này để làm lại từ đầu. */
  const redo = () => {
    setMarks({});
    setDraft('');
    setChecked(false);
    setTrans(q.id, undefined);
  };

  return (
    <>
      <TopBar crumbs={lessonCrumbs(slug, day.title, 'Bài tập ngữ pháp')} />

      <PageHeader
        eyebrow={day.title}
        title="Bài tập ngữ pháp"
        subtitle="Gạch câu thành từng phần S / V / O, rồi dịch sang tiếng Việt."
      >
        {ready && done.length > 0 && (
          <div className="row" style={{ marginTop: 'var(--space-4)' }}>
            <Badge tone="success">✅ {rightCount} đúng</Badge>
            <Badge tone="danger">❌ {done.length - rightCount} sai</Badge>
            <span className="caption">
              Kết quả lưu lại trên máy — bấm số câu để xem lại hoặc làm lại
            </span>
          </div>
        )}
      </PageHeader>

      <StepList
        items={day.translation}
        currentIndex={idx}
        isDone={(t) => ready && state.trans[t.id]?.correct}
        isWrong={(t) => ready && state.trans[t.id]?.done && !state.trans[t.id]?.correct}
        onPick={setIdx}
        labelOf={(t) => t.no}
      />

      <Card style={{ marginTop: 'var(--space-4)' }}>
        <div className="quiz-head">
          <span>
            Câu {idx + 1} / {day.translation.length}
          </span>
          {checked ? (
            <Badge tone={correct ? 'success' : 'danger'}>
              {correct ? '✅ đã làm đúng' : '❌ đã làm sai'}
            </Badge>
          ) : (
            <Badge tone="brand">Bước 1 · gạch S / V / O</Badge>
          )}
        </div>

        <p className="section-lead">
          {checked
            ? 'Bài bạn đã làm — bấm "Làm lại" nếu muốn thử lại.'
            : 'Bấm vào cụm từ, rồi chọn nhãn bên dưới.'}
        </p>

        <TokenRow
          key={q.id}
          question={q}
          marks={marks}
          checked={checked}
          onAssign={(i, label) => setMarks((m) => ({ ...m, [i]: label }))}
        />

        <hr />

        <div className="quiz-head">
          <Badge tone={tagged ? 'brand' : 'neutral'}>Bước 2 · dịch sang tiếng Việt</Badge>
          {!tagged && <span className="caption">🔒 mở khi gạch xong</span>}
        </div>

        <Textarea
          rows={2}
          disabled={!tagged || checked}
          placeholder="Nhập bản dịch của bạn…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        {checked && (
          <div className={`feedback ${correct ? 'feedback-success' : 'feedback-error'}`}>
            {correct ? '✅ Gạch đúng hết.' : '❌ Có cụm gạch sai — chỗ viền đỏ ở trên.'}
            <p style={{ marginTop: 'var(--space-3)' }}>
              <strong>Bản dịch mẫu:</strong> {q.vi}
            </p>
            <p className="caption" style={{ marginTop: 'var(--space-2)' }}>
              Bản dịch không chấm máy móc — một câu có nhiều cách dịch đúng. Tự đối chiếu.
            </p>
          </div>
        )}

        <div className="row row-between" style={{ marginTop: 'var(--space-4)' }}>
          <Button variant="quiet" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            ← Câu trước
          </Button>

          <span className="row">
            {checked && (
              <Button variant="quiet" onClick={redo}>
                ↺ Làm lại câu này
              </Button>
            )}
            {!checked ? (
              <Button variant="primary" disabled={!tagged} onClick={check}>
                Kiểm tra
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={idx === day.translation.length - 1}
                onClick={() => setIdx(idx + 1)}
              >
                Câu tiếp →
              </Button>
            )}
          </span>
        </div>
      </Card>
    </>
  );
}
