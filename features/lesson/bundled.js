// Bộ nội dung BUNDLE SẴN trong repo — nguồn dự phòng khi chưa cấu hình Firestore,
// hoặc khi Firestore đọc lỗi. Nguồn chính xem features/lesson/api.js.
//
// Thêm buổi mới thì đẩy lên Firestore bằng `npm run push-content`; chỉ thêm import
// tĩnh ở đây khi muốn buổi đó chạy được cả lúc offline.

import daysIndex from '@/content/days.json';

import d1day from '@/content/day-1/day.json';
import d1grammar from '@/content/day-1/grammar.json';
import d1theory from '@/content/day-1/theory.json';
import d1vocabulary from '@/content/day-1/vocabulary.json';
import d1translation from '@/content/day-1/translation.json';
import d1listening from '@/content/day-1/listening.json';
import d1pictures from '@/content/day-1/pictures.json';
import d1quiz from '@/content/day-1/quiz.json';

import { assemble } from './schema';

const REGISTRY = {
  'day-1': {
    day: d1day,
    grammar: d1grammar,
    theory: d1theory,
    vocabulary: d1vocabulary,
    translation: d1translation,
    listening: d1listening,
    pictures: d1pictures,
    quiz: d1quiz,
  },
};

export const bundledDays = daysIndex.days
  .map((slug) => assemble(slug, REGISTRY[slug]))
  .filter(Boolean);

export const getBundledDay = (slug) => bundledDays.find((d) => d.slug === slug);
