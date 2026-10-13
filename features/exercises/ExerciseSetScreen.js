'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Notice } from '@/shared/ui/atoms/Notice';
import { Textarea } from '@/shared/ui/atoms/Textarea';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { StepList } from '@/shared/ui/molecules/StepList';

/**
 * Một bài trắc nghiệm ngữ pháp, làm từng câu một.
 *
 * Hai kiểu bài:
 *   choice   chọn một phương án điền vào chỗ trống — chấm được, lưu tiến độ
 *   rewrite  viết lại câu (vd chủ động → bị động) — không chấm máy được vì
 *            có nhiều cách viết đúng, nên chỉ cho xem câu mẫu để tự soát
 *
 * Câu trả lời lưu chung ngăn `listen` với bài nghe (cùng dạng picked/correct/
 * tries), nhờ vậy luật gộp giữa các máy và điểm xếp hạng dùng lại được nguyên.
 */
export function ExerciseSetScreen({ slug, setId, day }) {
  const t = useTranslation();
  const set = day.exercises.find((s) => s.code === setId);
  const { day: state, ready, answer } = useProgress(slug);
  const [idx, setIdx] = useState(0);

  if (!set) {
    return <Notice>{t('Exercise set not found: “')}{setId}&rdquo;.</Notice>;
  }

  const item = set.questions[idx];
  const saved = ready ? state.listen[item.id] : null;
  const lastQuestion = idx === set.questions.length - 1;
  const nextSet = day.exercises[day.exercises.findIndex((s) => s.code === setId) + 1];
  const goto = (i) => setIdx(Math.max(0, Math.min(i, set.questions.length - 1)));

  return (
    <>
      <PageHeader eyebrow={day.title} title={set.title} subtitle={set.subtitle} />

      <StepList
        items={set.questions}
        currentIndex={idx}
        isDone={(q) => ready && state.listen[q.id]?.correct}
        onPick={goto}
        labelOf={(q) => q.no}
      />

      <div className="stack stack-lg" style={{ marginTop: 'var(--space-5)' }}>
        {set.kind === 'rewrite' ? (
          <RewriteCard key={item.id} item={item} />
        ) : (
          <ChoiceCard
            key={item.id}
            item={item}
            saved={saved}
            onAnswer={(letter, correct) => answer(item.id, letter, correct)}
          />
        )}

        <div className="row row-between">
          <Button variant="quiet" disabled={idx === 0} onClick={() => goto(idx - 1)}>
            {t('← Previous question')}
          </Button>

          {!lastQuestion ? (
            <Button variant="primary" onClick={() => goto(idx + 1)}>
              {t('Next question →')}
            </Button>
          ) : nextSet ? (
            <Button variant="primary" href={`/day/${slug}/exercises/${nextSet.code}`}>
              {t(nextSet.title)} →
            </Button>
          ) : (
            <Button variant="primary" href={`/day/${slug}/exercises`}>
              {t('All sets complete — back to list →')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/** Câu chọn đáp án. Chọn sai thì báo sai và cho chọn lại, đúng thì mở phần dịch. */
function ChoiceCard({ item, saved, onAnswer }) {
  const t = useTranslation();
  const [picked, setPicked] = useState(null);
  const solved = Boolean(saved?.correct);
  const letters = Object.keys(item.options);

  return (
    <Card>
      <div className="stack" style={{ gap: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-snug)' }}>
          <strong>{item.no}.</strong> {item.text}
        </p>

        <div className="options">
          {letters.map((letter) => {
            let cls = '';
            if (solved && letter === item.answer) cls = 'is-correct';
            else if (!solved && picked === letter) cls = 'is-wrong';

            return (
              <button
                key={letter}
                type="button"
                className={`option ${cls}`}
                disabled={solved}
                onClick={() => {
                  setPicked(letter);
                  onAnswer(letter, letter === item.answer);
                }}
              >
                <span className="key">{letter}</span>
                <span>{item.options[letter]}</span>
              </button>
            );
          })}
        </div>

        {solved && (
          <div className="feedback feedback-success">
            {t('✅ Correct —')} <strong>{item.options[item.answer]}</strong>.
            {item.explain && <p style={{ marginTop: 'var(--space-2)' }}>{item.explain}</p>}
            {item.vi && (
              <p style={{ marginTop: 'var(--space-2)' }}>
                <Badge>{t('Translation')}</Badge> {item.vi}
              </p>
            )}
          </div>
        )}

        {!solved && picked && (
          <div className="feedback feedback-error">
            {t('❌ Incorrect — unsuccessful attempts:')} <strong>{saved?.tries || 1}</strong>{t('. Try another answer.')}
          </div>
        )}

        {item.source?.answer === 'ai' && (
          <p className="caption">{t('This answer was generated by AI. The material does not include an official answer key.')}</p>
        )}
      </div>
    </Card>
  );
}

/** Câu viết lại. Gõ nháp vào ô, rồi mở câu mẫu để tự đối chiếu. */
function RewriteCard({ item }) {
  const t = useTranslation();
  const [draft, setDraft] = useState('');
  const [shown, setShown] = useState(false);

  return (
    <Card>
      <div className="stack" style={{ gap: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-snug)' }}>
          <strong>{item.no}.</strong> {item.text}
        </p>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('Rewrite the sentence here…')}
          rows={2}
        />

        {shown ? (
          <div className="feedback feedback-success">
            {t('Sample answer:')} <strong>{item.answer}</strong>
            {item.source?.answer === 'ai' && (
              <p className="caption" style={{ marginTop: 'var(--space-2)' }}>
                {t('This sample answer was generated by AI. Other correct answers may be possible.')}
              </p>
            )}
          </div>
        ) : (
          <div className="row row-end">
            <Button onClick={() => setShown(true)}>{t('Show sample answer')}</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
