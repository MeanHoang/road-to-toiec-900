'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
import { countExercises } from '@/features/lesson/stats';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Callout } from '@/shared/ui/atoms/Callout';
import { CountBadge } from '@/shared/ui/molecules/CountBadge';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';

export function ExerciseIndexScreen({ slug, day }) {
  const t = useTranslation();
  const { day: state, ready } = useProgress(slug);
  const aiKeyed = day.exercises.some((set) =>
    set.questions.some((q) => q.source?.answer === 'ai'),
  );

  return (
    <>
      <PageHeader
        eyebrow={day.title}
        title={t('Grammar quiz')}
        subtitle={t('{0} sets · {1} questions · choose the correct answer to complete each sentence', [day.exercises.length, countExercises(day)])}
      />

      <div className="stack">
        {day.exercises.map((set) => {
          const total = set.questions.length;
          const done = ready ? set.questions.filter((q) => state.listen[q.id]?.correct).length : 0;
          const graded = set.kind !== 'rewrite';

          return (
            <NavCard
              key={set.id}
              href={`/day/${slug}/exercises/${set.code}`}
              lead={graded ? '🧩' : '🔁'}
              title={set.title}
              meta={set.subtitle}
              percent={graded && ready ? (done / total) * 100 : undefined}
              trailing={
                graded ? <CountBadge done={done} total={total} /> : <Badge>{t('self-check')}</Badge>
              }
            />
          );
        })}
      </div>

      {aiKeyed && (
        <Callout style={{ marginTop: 'var(--space-6)' }}>
          <strong>{t('AI-generated answers')}</strong> {t('— the material does not include an official answer key. Check any doubtful answers with your class.')}
        </Callout>
      )}
    </>
  );
}
