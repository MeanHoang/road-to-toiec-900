'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { DayOverviewScreen } from '@/features/lesson/DayOverviewScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug}>{(day) => <DayOverviewScreen slug={slug} day={day} />}</DayGate>;
}
