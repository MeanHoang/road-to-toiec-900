'use client';

import { use } from 'react';
import { DayGate } from '@/features/lesson/DayGate';
import { PicturesScreen } from '@/features/pictures/PicturesScreen';

export default function Page({ params }) {
  const { slug } = use(params);
  return <DayGate slug={slug}>{(day) => <PicturesScreen slug={slug} day={day} />}</DayGate>;
}
