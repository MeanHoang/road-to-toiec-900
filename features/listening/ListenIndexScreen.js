'use client';

import { countQuestions } from '@/features/lesson/stats';
import { useProgress } from '@/features/progress/useProgress';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Callout } from '@/shared/ui/atoms/Callout';
import { Notice } from '@/shared/ui/atoms/Notice';
import { CountBadge } from '@/shared/ui/molecules/CountBadge';
import { NavCard } from '@/shared/ui/molecules/NavCard';
import { PageHeader } from '@/shared/ui/molecules/PageHeader';
import { countCorrect } from './rules';

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

      <Callout style={{ marginTop: 'var(--space-6)' }}>
        <strong>Homework 1 và 2 có đáp án chính thức</strong> lấy từ tài liệu, không phải AI đoán.
        Practice 1.2 và 2.2 là phần chữa trên lớp nên không kèm đáp án — hai bộ đó chỉ nghe và tự đối
        chiếu.
      </Callout>

      <Notice style={{ marginTop: 'var(--space-3)' }}>
        Phụ đề tiếng Anh và Vietsub chưa có — cần chạy transcribe bằng <code>whisper.cpp</code> ở
        máy.
      </Notice>
    </>
  );
}
