'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { ListenSetScreen } from '@/features/listening/ListenSetScreen';

export default function Page({ params }) {
  const { slug, setId } = use(params);
  return (
    <DayGate slug={slug}>
      {(day) => <ListenSetScreen slug={slug} setId={setId} day={day} />}
    </DayGate>
  );
}
