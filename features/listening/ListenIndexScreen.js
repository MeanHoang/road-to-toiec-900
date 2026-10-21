'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { countQuestions } from '@/features/lesson/stats';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Callout } from '@/shared/ui/atoms/Callout';
import { CountBadge } from '@/shared/ui/molecules/CountBadge';
import { LearningArt } from '@/shared/ui/atoms/LearningArt';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { countCorrect } from './rules';

/**
 * Bộ nào có đáp án, đáp án từ đâu — tính từ dữ liệu, vì mỗi buổi một khác:
 * Day 1–2 có key chính thức, các buổi sau không có và đáp án là AI giải.
 */
function KeyNote({ sets }) {
  const t = useTranslation();
  const keyed = sets.filter((s) => s.hasKey);
  const aiKeyed = keyed.filter((s) => s.questions.some((q) => q.source?.answer === 'ai'));
  const official = keyed.filter((s) => !aiKeyed.includes(s));
  const noKey = sets.filter((s) => !s.hasKey);
  const names = (list) => list.map((s) => s.title).join(', ');

  return (
    <Callout style={{ marginTop: 'var(--space-6)' }}>
      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        {official.length > 0 && (
          <p>
            <strong>{t('Official answer keys')}</strong> {t('from the source material:')} {names(official)}.
          </p>
        )}
        {aiKeyed.length > 0 && (
          <p>
            <strong>{t('AI-generated answers')}</strong> {t('for sets without an official key:')} {names(aiKeyed)}.
          </p>
        )}
        {noKey.length > 0 && (
          <p>
            <strong>{t('No answer key')}</strong>{t('. Listen and transcribe, then compare with the audio transcript:')}{' '}
            {names(noKey)}.
          </p>
        )}
      </div>
    </Callout>
  );
}

export function ListenIndexScreen({ slug, day }) {
  const t = useTranslation();
  const { day: state, ready } = useProgress(slug);

  return (
    <>
      <PageHeader
        eyebrow={day.title}
        title={t('Listening practice')}
        subtitle={t('{0} sets · {1} questions · individual audio for each question', [day.listening.length, countQuestions(day)])}
      />

      <div className="activity-grid set-collection" data-count={day.listening.length}>
        {day.listening.map((set) => {
          const done = ready ? countCorrect(set, state.listen) : 0;
          const total = set.questions.length;

          return (
            <NavCard
              key={set.id}
              href={`/day/${slug}/listen/${set.code}`}
              art={<LearningArt kind={set.code === 'vocab' ? 'vocab' : set.code.startsWith('hw') ? 'headphones' : set.mode === 'dictation' ? 'dictation' : 'headphones'} />}
              tone={set.code === 'vocab' ? 'mint' : set.code.startsWith('hw') ? 'lilac' : 'sky'}
              title={set.title}
              meta={set.subtitle}
              percent={set.hasKey && ready ? (done / total) * 100 : undefined}
              trailing={
                set.hasKey ? (
                  <CountBadge done={done} total={total} />
                ) : (
                  <Badge tone="warning">{t('no answer key')}</Badge>
                )
              }
            />
          );
        })}
      </div>

      <KeyNote sets={day.listening} />
    </>
  );
}
