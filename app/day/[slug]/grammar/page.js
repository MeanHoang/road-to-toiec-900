'use client';

import { use, useEffect, useState } from 'react';
import { useProgress } from '@/lib/progress';
import { Badge, Button, Card, Textarea } from '@/components/primitives';
import { TopBar, PageHeader, StepList } from '@/components/patterns';
import { DayGate } from '@/components/DayGate';

const LABELS = [
  { key: 'S', text: 'chủ ngữ', tone: 'brand' },
  { key: 'V', text: 'động từ', tone: 'success' },
  { key: 'O', text: 'tân ngữ', tone: 'accent' },
];

function GrammarExerciseScreen({ slug, day }) {
  const { day: state, ready, setTrans } = useProgress(slug);
  const [idx, setIdx] = useState(0);
  const [marks, setMarks] = useState({}); // vị trí token -> 'S' | 'V' | 'O'
  const [sel, setSel] = useState(null); // token đang chọn
  const [checked, setChecked] = useState(false);
  const [draft, setDraft] = useState('');

  const q = day.translation[idx];
  const saved = ready ? state.trans[q.id] : null;

  // Vào một câu đã làm thì DỰNG LẠI bài cũ chứ không xoá trắng —
  // để xem lại mình gạch thế nào, đúng hay sai ở đâu.
  useEffect(() => {
    if (!ready) return;
    const prev = state.trans[day.translation[idx].id];
    setMarks(prev?.marks || {});
    setDraft(prev?.draft || '');
    setChecked(!!prev?.done);
    setSel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, ready]);

  // Chỉ đếm cụm thật sự là S/V/O; cụm `null` để trống mới là đúng.
  const required = q.key.filter(Boolean).length;
  const tagged = Object.values(marks).filter(Boolean).length >= required;
  const correct = q.key.every((want, i) => (marks[i] || null) === want);

  const done = day.translation.filter((t) => ready && state.trans[t.id]?.done);
  const rightCount = done.filter((t) => state.trans[t.id]?.correct).length;

  const assign = (label) => {
    if (sel == null) return;
    setMarks((m) => ({ ...m, [sel]: label }));
    setSel(null);
  };

  const check = () => {
    setChecked(true);
    // Lưu cả bài đã gạch và bản dịch, đúng hay sai đều lưu.
    setTrans(q.id, { done: true, correct, marks, draft });
  };

  /** Xoá bài của riêng câu này để làm lại từ đầu. */
  const redo = () => {
    setMarks({});
    setDraft('');
    setSel(null);
    setChecked(false);
    setTrans(q.id, undefined);
  };

  return (
    <>
      <TopBar
        crumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: day.title, href: `/day/${slug}` },
          { label: 'Bài tập ngữ pháp' },
        ]}
      />

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
          {checked ? 'Bài bạn đã làm — bấm "Làm lại" nếu muốn thử lại.' : 'Bấm vào cụm từ, rồi chọn nhãn bên dưới.'}
        </p>

        <div className="tokens">
          {q.tokens.map((tok, i) => {
            const mark = marks[i];
            const wrong = checked && (mark || null) !== q.key[i];
            return (
              <button
                key={i}
                type="button"
                className={[
                  'token',
                  mark && `is-${mark.toLowerCase()}`,
                  sel === i && 'is-selected',
                  wrong && 'is-wrong',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => !checked && setSel(sel === i ? null : i)}
              >
                {tok}
              </button>
            );
          })}
        </div>

        {!checked && (
          <div className="row" style={{ marginTop: 'var(--space-4)' }}>
            {sel == null ? (
              <span className="caption">Chọn một cụm từ ở trên để gán nhãn</span>
            ) : (
              <>
                <span className="caption">Gán nhãn cho &ldquo;{q.tokens[sel]}&rdquo;:</span>
                {LABELS.map((l) => (
                  <Button key={l.key} size="sm" onClick={() => assign(l.key)}>
                    <Badge tone={l.tone}>{l.key}</Badge>
                    {l.text}
                  </Button>
                ))}
                <Button variant="quiet" size="sm" onClick={() => assign(null)}>
                  Xoá nhãn
                </Button>
              </>
            )}
          </div>
        )}

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

export default function Page({ params }) {
  const { slug } = use(params);
  return (
    <DayGate slug={slug} crumbLabel={'Bài tập ngữ pháp'}>
      {(day) => <GrammarExerciseScreen slug={slug} day={day} />}
    </DayGate>
  );
}
