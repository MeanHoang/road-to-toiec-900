'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { useEffect, useState } from 'react';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Card } from '@/shared/ui/atoms/Card';
import { Textarea } from '@/shared/ui/atoms/Textarea';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { StepList } from '@/shared/ui/molecules/StepList';
import { isAllCorrect, isTagged } from './marks';
import { TokenRow } from './TokenRow';

export function GrammarExerciseScreen({ slug, day }) {
  const t = useTranslation();
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
      <PageHeader
        eyebrow={day.title}
        title={t('Grammar exercises')}
        subtitle={t('Label each sentence with S / V / O, then translate it into Vietnamese.')}
      >
        {ready && done.length > 0 && (
          <div className="row" style={{ marginTop: 'var(--space-4)' }}>
            <Badge tone="success">✅ {rightCount} {t('correct')}</Badge>
            <Badge tone="danger">❌ {done.length - rightCount} {t('incorrect')}</Badge>
            <span className="caption">
              {t('Your results are saved on this device. Select a question number to review or retry it.')}
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

      <Card className="grammar-workspace" style={{ marginTop: 'var(--space-4)' }}>
        <div className="grammar-task-grid"><div className="grammar-label-step">
        <div className="quiz-head">
          <span>
            {t('Question')} {idx + 1} / {day.translation.length}
          </span>
          {checked ? (
            <Badge tone={correct ? 'success' : 'danger'}>
              {correct ? t('✅ Correct') : t('❌ Incorrect')}
            </Badge>
          ) : (
            <Badge tone="brand">{t('Step 1 · label S / V / O')}</Badge>
          )}
        </div>

        <p className="section-lead">
          {checked
            ? t('Your saved answer. Click Retry to try again.')
            : t('Select a phrase, then choose a label below.')}
        </p>

        <TokenRow
          key={q.id}
          question={q}
          marks={marks}
          checked={checked}
          onAssign={(i, label) => setMarks((m) => ({ ...m, [i]: label }))}
        />

        </div><div className="grammar-translation-step">

        <div className="quiz-head">
          <Badge tone={tagged ? 'brand' : 'neutral'}>{t('Step 2 · translate into Vietnamese')}</Badge>
          {!tagged && <span className="caption">{t('🔒 Unlocks after labeling')}</span>}
        </div>

        <Textarea
          rows={2}
          aria-label={t('Enter your Vietnamese translation…')}
          disabled={!tagged || checked}
          placeholder={t('Enter your Vietnamese translation…')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />

        </div></div>
        {checked && (
          <div className={`feedback ${correct ? 'feedback-success' : 'feedback-error'}`}>
            {correct ? t('✅ All labels are correct.') : t('❌ Some labels are incorrect. Check the phrases outlined in red.')}
            <p style={{ marginTop: 'var(--space-3)' }}>
              <strong>{t('Sample translation:')}</strong> {q.vi}
            </p>
            <p className="caption" style={{ marginTop: 'var(--space-2)' }}>
              {t('Translations are not automatically graded. Compare yours with the sample; more than one translation may be correct.')}
            </p>
          </div>
        )}

        <div className="row row-between" style={{ marginTop: 'var(--space-4)' }}>
          <Button variant="quiet" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
            {t('← Previous question')}
          </Button>

          <span className="row">
            {checked && (
              <Button variant="quiet" onClick={redo}>
                {t('↺ Retry question')}
              </Button>
            )}
            {!checked ? (
              <Button variant="primary" disabled={!tagged} onClick={check}>
                {t('Check')}
              </Button>
            ) : (
              <Button
                variant="primary"
                disabled={idx === day.translation.length - 1}
                onClick={() => setIdx(idx + 1)}
              >
                {t('Next question →')}
              </Button>
            )}
          </span>
        </div>
      </Card>
    </>
  );
}
