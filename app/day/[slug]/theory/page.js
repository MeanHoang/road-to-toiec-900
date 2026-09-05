'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { TheoryScreen } from '@/features/theory/TheoryScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug}>{(day) => <TheoryScreen slug={slug} day={day} />}</DayGate>;
}
