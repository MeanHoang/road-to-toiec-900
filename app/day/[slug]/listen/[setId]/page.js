'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { ListenSetScreen } from '@/features/listening/ListenSetScreen';

export default function Page({ params }) {
  const { slug, setId } = use(params);
  return (
    <DayGate slug={slug}>
      {/* key={setId}: đổi bộ bài là dựng lại màn từ đầu. Không có nó thì đi từ
          câu cuối bộ này sang bộ sau vẫn nằm nguyên trong một route segment,
          React giữ lại state cũ và bộ mới mở ra ở đúng câu cuối. */}
      {(day) => <ListenSetScreen key={setId} slug={slug} setId={setId} day={day} />}
    </DayGate>
  );
}
