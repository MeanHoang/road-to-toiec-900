'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { CardsScreen } from '@/features/vocabulary/CardsScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug} crumbLabel="Thẻ từ vựng">{(day) => <CardsScreen slug={slug} day={day} />}</DayGate>;
}
