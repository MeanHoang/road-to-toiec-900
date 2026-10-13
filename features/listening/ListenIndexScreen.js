'use client';

import { countQuestions } from '@/features/lesson/stats';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Callout } from '@/shared/ui/atoms/Callout';
import { CountBadge } from '@/shared/ui/molecules/CountBadge';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { countCorrect } from './rules';

/**
 * Bộ nào có đáp án, đáp án từ đâu — tính từ dữ liệu, vì mỗi buổi một khác:
 * Day 1–2 có key chính thức, các buổi sau không có và đáp án là AI giải.
 */
function KeyNote({ sets }) {
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
            <strong>Có đáp án chính thức</strong> lấy từ tài liệu: {names(official)}.
          </p>
        )}
        {aiKeyed.length > 0 && (
          <p>
            <strong>Đáp án do AI giải</strong> vì tài liệu không kèm key: {names(aiKeyed)}.
          </p>
        )}
        {noKey.length > 0 && (
          <p>
            <strong>Không có đáp án</strong>, chỉ nghe rồi chép lại để đối chiếu lời audio:{' '}
            {names(noKey)}.
          </p>
        )}
      </div>
    </Callout>
  );
}

export function ListenIndexScreen({ slug, day }) {
  const { day: state, ready } = useProgress(slug);

  return (
    <>
      <PageHeader
        eyebrow={day.title}
        title="Luyện nghe"
        subtitle={`${day.listening.length} bộ bài · ${countQuestions(day)} câu · mỗi câu có audio riêng`}
      />

      <div className="stack">
        {day.listening.map((set) => {
          const done = ready ? countCorrect(set, state.listen) : 0;
          const total = set.questions.length;

          return (
            <NavCard
              key={set.id}
              href={`/day/${slug}/listen/${set.code}`}
              lead={set.mode === 'dictation' ? '✏️' : '🎧'}
              title={set.title}
              meta={set.subtitle}
              percent={set.hasKey && ready ? (done / total) * 100 : undefined}
              trailing={
                set.hasKey ? (
                  <CountBadge done={done} total={total} />
                ) : (
                  <Badge tone="warning">chưa có đáp án</Badge>
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
