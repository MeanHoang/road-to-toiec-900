'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { ExerciseIndexScreen } from '@/features/exercises/ExerciseIndexScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug}>{(day) => <ExerciseIndexScreen slug={slug} day={day} />}</DayGate>;
}
