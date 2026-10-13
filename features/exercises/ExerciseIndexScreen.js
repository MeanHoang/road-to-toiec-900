'use client';

import { countExercises } from '@/features/lesson/stats';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Callout } from '@/shared/ui/atoms/Callout';
import { CountBadge } from '@/shared/ui/molecules/CountBadge';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';

export function ExerciseIndexScreen({ slug, day }) {
  const { day: state, ready } = useProgress(slug);
  const aiKeyed = day.exercises.some((set) =>
    set.questions.some((q) => q.source?.answer === 'ai'),
  );

  return (
    <>
      <PageHeader
        eyebrow={day.title}
        title="Trắc nghiệm ngữ pháp"
        subtitle={`${day.exercises.length} bài · ${countExercises(day)} câu · chọn đáp án đúng để điền vào câu`}
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
                graded ? <CountBadge done={done} total={total} /> : <Badge>tự soát</Badge>
              }
            />
          );
        })}
      </div>

      {aiKeyed && (
        <Callout style={{ marginTop: 'var(--space-6)' }}>
          <strong>Đáp án do AI giải</strong> — tài liệu không kèm đáp án chính thức. Thấy câu nào
          nghi sai thì đối chiếu lại với lớp.
        </Callout>
      )}
    </>
  );
}
