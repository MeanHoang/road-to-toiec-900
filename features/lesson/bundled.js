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

import d2day from '@/content/day-2/day.json';
import d2grammar from '@/content/day-2/grammar.json';
import d2theory from '@/content/day-2/theory.json';
import d2vocabulary from '@/content/day-2/vocabulary.json';
import d2translation from '@/content/day-2/translation.json';
import d2listening from '@/content/day-2/listening.json';

import d3day from '@/content/day-3/day.json';
import d3vocabulary from '@/content/day-3/vocabulary.json';
import d3translation from '@/content/day-3/translation.json';
import d3listening from '@/content/day-3/listening.json';

import d4day from '@/content/day-4/day.json';
import d4vocabulary from '@/content/day-4/vocabulary.json';
import d4theory from '@/content/day-4/theory.json';
import d4exercises from '@/content/day-4/exercises.json';
import d4listening from '@/content/day-4/listening.json';

import d5day from '@/content/day-5/day.json';
import d5vocabulary from '@/content/day-5/vocabulary.json';
import d5theory from '@/content/day-5/theory.json';
import d5listening from '@/content/day-5/listening.json';

import d6day from '@/content/day-6/day.json';
import d6vocabulary from '@/content/day-6/vocabulary.json';
import d6theory from '@/content/day-6/theory.json';
import d6translation from '@/content/day-6/translation.json';
import d6listening from '@/content/day-6/listening.json';

import d7day from '@/content/day-7/day.json';
import d7vocabulary from '@/content/day-7/vocabulary.json';
import d7theory from '@/content/day-7/theory.json';
import d7translation from '@/content/day-7/translation.json';
import d7listening from '@/content/day-7/listening.json';

import d8day from '@/content/day-8/day.json';
import d8vocabulary from '@/content/day-8/vocabulary.json';
import d8theory from '@/content/day-8/theory.json';
import d8listening from '@/content/day-8/listening.json';
import d8exercises from '@/content/day-8/exercises.json';

import d9day from '@/content/day-9/day.json';
import d9vocabulary from '@/content/day-9/vocabulary.json';
import d9theory from '@/content/day-9/theory.json';
import d9exercises from '@/content/day-9/exercises.json';
import d9listening from '@/content/day-9/listening.json';

import { assemble } from './schema';
import d10day from '@/content/day-10/day.json';
import d10vocabulary from '@/content/day-10/vocabulary.json';
import d10theory from '@/content/day-10/theory.json';
import d10exercises from '@/content/day-10/exercises.json';
import d10listening from '@/content/day-10/listening.json';

const REGISTRY = {
  'day-10': {
    day: d10day,
    vocabulary: d10vocabulary,
    theory: d10theory,
    exercises: d10exercises,
    listening: d10listening,
  },
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
  'day-2': {
    day: d2day,
    grammar: d2grammar,
    theory: d2theory,
    vocabulary: d2vocabulary,
    translation: d2translation,
    listening: d2listening,
  },
  'day-3': {
    day: d3day,
    vocabulary: d3vocabulary,
    translation: d3translation,
    listening: d3listening,
  },
  'day-4': {
    day: d4day,
    vocabulary: d4vocabulary,
    theory: d4theory,
    exercises: d4exercises,
    listening: d4listening,
  },
  'day-5': {
    day: d5day,
    vocabulary: d5vocabulary,
    theory: d5theory,
    listening: d5listening,
  },
  'day-6': {
    day: d6day,
    vocabulary: d6vocabulary,
    theory: d6theory,
    translation: d6translation,
    listening: d6listening,
  },
  'day-7': {
    day: d7day,
    vocabulary: d7vocabulary,
    theory: d7theory,
    translation: d7translation,
    listening: d7listening,
  },
  'day-8': {
    day: d8day,
    vocabulary: d8vocabulary,
    theory: d8theory,
    listening: d8listening,
    exercises: d8exercises,
  },
  'day-9': {
    day: d9day,
    vocabulary: d9vocabulary,
    theory: d9theory,
    exercises: d9exercises,
    listening: d9listening,
  },
};

export const bundledDays = daysIndex.days
  .map((slug) => assemble(slug, REGISTRY[slug]))
  .filter(Boolean);

export const getBundledDay = (slug) => bundledDays.find((d) => d.slug === slug);
