'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { ExerciseSetScreen } from '@/features/exercises/ExerciseSetScreen';

export default function Page({ params }) {
  const { slug, setId } = use(params);
  return (
    <DayGate slug={slug}>
      {/* key={setId}: sang bài khác thì dựng lại màn, không giữ vị trí câu của bài cũ. */}
      {(day) => <ExerciseSetScreen key={setId} slug={slug} setId={setId} day={day} />}
    </DayGate>
  );
}
