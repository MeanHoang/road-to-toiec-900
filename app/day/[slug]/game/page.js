'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { GameScreen } from '@/features/game/GameScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug}>{(day) => <GameScreen slug={slug} day={day} />}</DayGate>;
}
