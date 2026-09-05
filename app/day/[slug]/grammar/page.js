'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { GrammarExerciseScreen } from '@/features/translation/GrammarExerciseScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug}>{(day) => <GrammarExerciseScreen slug={slug} day={day} />}</DayGate>;
}
