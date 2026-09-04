'use client';

import { use } from 'react';
import {countQuestions} from '@/lib/days';
import { useProgress } from '@/lib/progress';
import { Badge, Callout, Notice } from '@/components/primitives';
import { TopBar, PageHeader, NavCard } from '@/components/patterns';
import { DayGate } from '@/components/DayGate';

function ListenIndexScreen({ slug, day }) {
  const { day: state, ready } = useProgress(slug);

  return (
    <>
      <TopBar
        crumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: day.title, href: `/day/${slug}` },
          { label: 'Luyện nghe' },
        ]}
      />

      <PageHeader
        eyebrow={day.title}
        title="Luyện nghe"
        subtitle={`${day.listening.length} bộ bài · ${countQuestions(day)} câu · mỗi câu có audio riêng`}
      />

      <div className="stack">
        {day.listening.map((set) => {
          const done = set.questions.filter((q) => ready && state.listen[q.id]?.correct).length;
          const n = set.questions.length;

          const trailing = !set.hasKey ? (
            <Badge tone="warning">chưa có đáp án</Badge>
          ) : done >= n ? (
            <Badge tone="success">xong</Badge>
          ) : (
            <Badge tone={done ? 'brand' : 'neutral'}>
              {done} / {n}
            </Badge>
          );

          return (
            <NavCard
              key={set.id}
              href={`/day/${slug}/listen/${set.code}`}
              lead={set.mode === 'dictation' ? '✏️' : '🎧'}
              title={set.title}
              meta={set.subtitle}
              percent={set.hasKey && ready ? (done / n) * 100 : undefined}
              trailing={trailing}
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

export default function Page({ params }) {
  const { slug } = use(params);
  return (
    <DayGate slug={slug} crumbLabel={'Luyện nghe'}>
      {(day) => <ListenIndexScreen slug={slug} day={day} />}
    </DayGate>
  );
}
