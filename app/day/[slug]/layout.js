'use client';

import { use } from 'react';
import { DayProvider } from '@/components/DayProvider';

// Nạp nội dung buổi học một lần ở đây rồi chia cho mọi màn con.
export default function DayLayout({ params, children }) {
  const { slug } = use(params);
  return <DayProvider slug={slug}>{children}</DayProvider>;
}
