'use client';

import { countExercises, countQuestions } from '@/features/lesson/stats';

/** Số câu đã làm đúng trong các bộ — chỉ đếm id của đúng những bộ đó. */
const countCorrectIn = (sets, answers) =>
  sets.reduce((n, set) => n + set.questions.filter((q) => answers[q.id]?.correct).length, 0);

/** Đếm tiến độ để hiện ở trang chủ và màn tổng quan. */
export function summarize(progress, day) {
  const known = Object.values(progress.vocab).filter((s) => s === 'known').length;
  const starred = Object.values(progress.star || {}).filter(Boolean).length;
  const total = day.vocabulary.length;
  const listenTotal = countQuestions(day);
  // Câu nghe và câu trắc nghiệm ngữ pháp cùng lưu ở `progress.listen` (cùng
  // dạng picked/correct/tries), nên phải đếm theo id của từng loại — đếm cả
  // ngăn thì thanh Luyện nghe ăn luôn cả câu ngữ pháp.
  const listenDone = countCorrectIn(day.listening, progress.listen);
  const drillTotal = countExercises(day);
  const drillDone = countCorrectIn(day.exercises, progress.listen);
  const transTotal = day.translation.length;
  const transDone = Object.values(progress.trans).filter((t) => t?.done).length;

  const denominator = total + listenTotal + transTotal + drillTotal;
  const percent = denominator
    ? Math.round(((known + listenDone + transDone + drillDone) / denominator) * 100)
    : 0;

  return {
    known,
    starred,
    total,
    listenDone,
    listenTotal,
    transDone,
    transTotal,
    drillDone,
    drillTotal,
    percent,
  };
}
