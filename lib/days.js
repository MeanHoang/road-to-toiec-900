// Bộ nội dung BUNDLE SẴN trong repo — dùng làm nguồn dự phòng khi chưa cấu hình
// Firestore, hoặc khi Firestore đọc lỗi. Nguồn chính xem lib/content.js.
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

export const SCHEMA_VERSION = 1;

/**
 * Gộp các file collection của một buổi thành object phẳng cho component dùng.
 * Nhận `files` từ bất kỳ nguồn nào — import tĩnh hay Firestore đều cùng hình dạng.
 * `has()` để màn tổng quan ẩn hoạt động mà buổi đó không có.
 */
export function assemble(slug, files) {
  if (!files?.day) return null;
  const { day, ...collections } = files;

  for (const [name, file] of Object.entries(collections)) {
    if (!file) continue;
    if (file.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(
        `${slug}/${name} dùng schemaVersion ${file.schemaVersion}, code đang ở ${SCHEMA_VERSION}.`,
      );
    }
    if (file.day !== slug) {
      throw new Error(`${slug}/${name} khai báo day="${file.day}" — nhầm buổi?`);
    }
  }

  const has = (name) => day.collections?.includes(name) && !!collections[name];
  const items = (name) => (has(name) ? collections[name].items : []);

  return {
    ...day,
    has,
    grammar: items('grammar'),
    theory: items('theory'),
    vocabulary: items('vocabulary'),
    translation: items('translation'),
    listening: items('listening'),
    pictures: items('pictures'),
    quiz: items('quiz'),
  };
}

export const days = daysIndex.days.map((slug) => assemble(slug, REGISTRY[slug])).filter(Boolean);

export const getDay = (slug) => days.find((d) => d.slug === slug);

/** Tổng số câu nghe của một buổi — dùng ở nhiều màn nên gom lại đây. */
export const countQuestions = (day) =>
  day.listening.reduce((n, set) => n + set.questions.length, 0);

/** Tổng số ảnh trong bài từ vựng qua hình. */
export const countPictures = (day) =>
  day.pictures.reduce((n, set) => n + set.questions.length, 0);
