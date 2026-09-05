'use client';

import { countQuestions } from '@/features/lesson/stats';

/** Đếm tiến độ để hiện ở trang chủ và màn tổng quan. */
export function summarize(progress, day) {
  const known = Object.values(progress.vocab).filter((s) => s === 'known').length;
  const starred = Object.values(progress.star || {}).filter(Boolean).length;
  const total = day.vocabulary.length;
  const listenTotal = countQuestions(day);
  const listenDone = Object.values(progress.listen).filter((a) => a?.correct).length;
  const transTotal = day.translation.length;
  const transDone = Object.values(progress.trans).filter((t) => t?.done).length;

  const denominator = total + listenTotal + transTotal;
  const percent = denominator
    ? Math.round(((known + listenDone + transDone) / denominator) * 100)
    : 0;

  return { known, starred, total, listenDone, listenTotal, transDone, transTotal, percent };
}
