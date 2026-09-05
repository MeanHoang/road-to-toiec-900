'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { VocabTableScreen } from '@/features/vocabulary/VocabTableScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug}>{(day) => <VocabTableScreen slug={slug} day={day} />}</DayGate>;
}
