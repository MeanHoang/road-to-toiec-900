'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { ListenIndexScreen } from '@/features/listening/ListenIndexScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug} crumbLabel="Luyện nghe">{(day) => <ListenIndexScreen slug={slug} day={day} />}</DayGate>;
}
