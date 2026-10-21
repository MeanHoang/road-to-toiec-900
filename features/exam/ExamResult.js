'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
// Kết quả một lượt thi.
//
// Chấm RIÊNG từng phần chứ không gộp một con số: đề thật cũng trả hai điểm
// riêng cho Nghe và Đọc, và biết mình yếu phần nào mới sửa được.
//
// Hiện SỐ CÂU ĐÚNG, không quy ra thang 10-990. ETS không công khai bảng quy
// đổi câu đúng sang điểm, nên mọi con số kiểu "bạn được 720" đều là bịa.

import { useState } from 'react';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Progress } from '@/shared/ui/atoms/Progress';
import { Modal } from '@/shared/ui/organisms/Modal';
import { Pagination } from '@/shared/ui/molecules/Pagination';
import { ExamQuestion } from './ExamQuestion';
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

export function ExamResult({ attempt, questions = [], onAgain, onBack }) {
  const t = useTranslation();
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 9;
  const question = selected && questions.find((q) => q.id === selected.id);
  const sections = bySection(attempt);
  const parts = byPart(attempt);
  const correct = attempt.answers.filter((a) => a.picked === a.answer).length;
  const blank = attempt.answers.filter((a) => !a.picked).length;

  return (
    <div className="exam-result">
      <div className="exam-result-summary">
      <Card className="exam-score">
        <span className="eyebrow">
          {t(attempt.label)}
          {attempt.learner ? ` · ${attempt.learner}` : ''}
        </span>
        <b className="exam-score-big">
          {correct}/{attempt.total}
        </b>
        <span className="caption">{t('correct answers')}</span>
        <Progress percent={(correct / attempt.total) * 100} label={t('Accuracy')} />
        {blank > 0 && (
          <p className="caption">
            {blank} {t('unanswered questions. In the actual test, unanswered questions count as incorrect, so make a guess rather than leave them blank.')}
          </p>
        )}
      </Card>

      {/* Chỉ tách ra khi đề có hơn một phần. Thi riêng phần Nghe mà vẫn bày
          một bảng "theo phần" với đúng một dòng thì chỉ tổ rối. */}
      {sections.length > 1 && (
        <Card>
          <span className="eyebrow">{t('By section')}</span>
          <div className="exam-sections">
            {sections.map((s) => (
              <div key={s.label} className="exam-section-score">
                <b>{t(s.label)}</b>
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
          <span className="eyebrow">{t('By part')}</span>
          <div className="exam-sections">
            {parts.map((p) => (
              <div key={p.part} className="exam-section-score">
                <b>{t(partTitle(p.part))}</b>
                <span className="exam-section-num">
                  {p.correct}/{p.count}
                </span>
                <Progress percent={(p.correct / p.count) * 100} size="sm" />
              </div>
            ))}
          </div>
        </Card>
      )}

      </div>
      <Card className="review-card">
        <span className="eyebrow">{t('Question review')}</span>
        <p className="caption">{t('Select an incorrect or unanswered question to review it and see the correct answer.')}</p>
        {sections.filter((s) => s.from < (page + 1) * pageSize && s.from + s.count > page * pageSize).map((s) => (
          <div key={s.label} className="exam-review">
            {sections.length > 1 && <span className="caption">{t(s.label)}</span>}
            {s.answers.map((a, i) => {
              const position = s.from + i;
              if (position < page * pageSize || position >= (page + 1) * pageSize) return null;
              const ok = a.picked === a.answer;
              const Row = ok ? 'div' : 'button';
              return (
                <Row
                  key={a.id}
                  className={`exam-review-row ${ok ? '' : 'exam-review-trigger'}`}
                  {...(!ok && {
                    type: 'button',
                    onClick: () => setSelected({ ...a, no: a.no ?? s.from + i + 1 }),
                    'aria-label': t('Review question {0}', [a.no ?? s.from + i + 1]),
                    'aria-haspopup': 'dialog',
                  })}
                >
                  <span className="exam-review-no">{a.no ?? s.from + i + 1}</span>
                  <Badge tone={ok ? 'success' : 'danger'}>{ok ? t('correct') : a.picked ? t('incorrect') : t('unanswered')}</Badge>
                  <span className="caption">
                    {t('Your answer')} {a.picked || '—'} {t('· Correct answer')} {a.answer}
                  </span>
                </Row>
              );
            })}
          </div>
        ))}
        <Pagination page={page} total={attempt.answers.length} pageSize={pageSize} onChange={setPage} />
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={t('Answer to question {0}', [selected?.no ?? ''])}
      >
        {selected && (
          <div className="stack exam-answer-review">
            <p>
              {selected.picked ? t('Your answer {0}', [selected.picked]) : t('You left this question unanswered')}
              {' · '}{t('Correct answer:')} <b>{selected.answer}</b>
            </p>
            {question && (
              <>
                <ExamQuestion question={{ ...question, answer: selected.answer }} picked={selected.picked} review />
                {question.audio && <audio key={question.id} controls src={question.audio} preload="none" aria-label={t('Replay question audio')} />}
                {question.script?.length > 0 && (
                  <div className="script-list">
                    <span className="eyebrow">{t('Transcript')}</span>
                    {question.script.map((line, i) => <p key={i}>{line.text}</p>)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      <div className="exam-actions">
        <Button variant="primary" onClick={onAgain}>
          {t('Retake test')}
        </Button>
        <Button onClick={onBack}>{t('Choose another test')}</Button>
      </div>
    </div>
  );
}
