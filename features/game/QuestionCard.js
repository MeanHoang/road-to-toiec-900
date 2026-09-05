'use client';

import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Progress } from '@/shared/ui/atoms/Progress';
import { Speak } from '@/shared/ui/molecules/Speak';

const DIR_LABEL = {
  'en-vi': 'Anh → Việt',
  'vi-en': 'Việt → Anh',
  cloze: 'Điền vào câu',
};

const DIR_TONE = { 'en-vi': 'brand', 'vi-en': 'accent', cloze: 'warning' };

/** Một câu hỏi: đề, bốn phương án, và phần chữa sau khi đã chọn. */
export function QuestionCard({ question, index, total, score, picked, onPick, onNext }) {
  const answered = Boolean(picked);
  const wrong = answered && picked.id !== question.word.id;

  return (
    <Card>
      <div className="quiz-head">
        <span>
          Câu {index + 1} / {total}
        </span>
        <span className="row" style={{ gap: 'var(--space-3)' }}>
          <Badge tone={DIR_TONE[question.dir]}>{DIR_LABEL[question.dir]}</Badge>
          <span>
            ✅ {score.right} &nbsp; ❌ {score.wrong}
          </span>
        </span>
      </div>

      <Progress percent={(index / total) * 100} />

      <div
        className="quiz-prompt"
        style={question.dir === 'cloze' ? { fontSize: 'var(--text-2xl)' } : undefined}
      >
        {question.prompt}
        {question.sub && <span className="ipa">{question.sub}</span>}
      </div>

      <div className="options">
        {question.options.map((opt, i) => {
          let cls = '';
          if (answered) {
            if (opt.id === question.word.id) cls = 'is-correct';
            else if (opt.id === picked.id) cls = 'is-wrong';
          }
          return (
            <button
              key={opt.id}
              className={`option ${cls}`}
              onClick={() => onPick(opt)}
              type="button"
              disabled={answered}
            >
              <span className="key">{'ABCD'[i]}</span>
              {question.label(opt)}
            </button>
          );
        })}
      </div>

      {wrong && (
        <div className="feedback feedback-error">
          ❌ Sai rồi. <strong>{question.word.word}</strong> = {question.word.meaningVi}
          <br />
          Từ này đã được đẩy về nhóm <strong>chưa học</strong> ở thẻ và bảng từ vựng.
        </div>
      )}

      {answered && (
        <div className="row row-end" style={{ marginTop: 'var(--space-4)' }}>
          <Speak text={question.word.word} />
          <Button variant="primary" onClick={onNext}>
            Câu tiếp →
          </Button>
        </div>
      )}
    </Card>
  );
}
