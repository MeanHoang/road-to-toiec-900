'use client';

// Nguồn nội dung bài học.
//
// Ưu tiên Firestore; không có thì rơi về bộ JSON bundle sẵn trong repo.
// Có fallback nên: chưa cấu hình Firebase vẫn chạy, mất mạng vẫn chạy,
// và Firestore hỏng thì app không trắng màn hình.
//
// Ảnh và audio KHÔNG nằm ở đây — chúng ở public/assets, đi theo repo.

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db, isConfigured } from '@/lib/firebase';
import { assemble } from './schema';
import { mergeVocabularyAudio } from './recordings';
import { bundledDays, getBundledDay } from './bundled';
import { englishMetadata } from '@/shared/lib/englishLabels';

const COLLECTIONS = [
  'grammar',
  'theory',
  'vocabulary',
  'translation',
  'listening',
  'pictures',
  'quiz',
  'exercises',
];

/** Danh sách slug các buổi học. */
export async function fetchDayList() {
  const store = db();
  if (store) {
    try {
      const snap = await getDoc(doc(store, 'meta', 'days'));
      if (snap.exists()) return [...new Set([...(snap.data().days || []), ...bundledDays.map((day) => day.slug)])];
    } catch (e) {
      console.warn('[lesson] không đọc được danh sách buổi từ Firestore:', e.message);
    }
  }
  return bundledDays.map((d) => d.slug);
}

/**
 * Một buổi học đầy đủ.
 * Firestore lưu mỗi collection là một document trong `days/<slug>/collections/`,
 * đúng cấu trúc file trong repo — nhìn ở console là hiểu ngay đang có gì.
 */
export async function fetchDay(slug) {
  const store = db();

  if (store) {
    try {
      const daySnap = await getDoc(doc(store, 'days', slug));
      if (daySnap.exists()) {
        const files = { day: daySnap.data() };

        const colSnap = await getDocs(collection(store, 'days', slug, 'collections'));
        colSnap.forEach((d) => {
          if (COLLECTIONS.includes(d.id)) files[d.id] = d.data();
        });

        const lesson = assemble(slug, files);
        return { ...lesson, vocabulary: mergeVocabularyAudio(lesson.vocabulary, getBundledDay(slug)?.vocabulary || []) };
      }
    } catch (e) {
      console.warn(`[lesson] không đọc được ${slug} từ Firestore:`, e.message);
    }
  }

  return getBundledDay(slug) || null;
}

export const usingFirestore = () => isConfigured;

/**
 * Danh sách buổi RÚT GỌN cho drawer: slug, số, tiêu đề, và buổi đó có những
 * collection nào — đủ để dựng cây điều hướng.
 *
 * Cố ý KHÔNG tải nội dung: drawer nằm ở mọi trang, mà fetchDay kéo về cả từ
 * vựng lẫn bài nghe của từng buổi. Mười buổi là mười lần tải thừa mỗi lần mở
 * trang, chỉ để vẽ mấy dòng chữ.
 */
export async function fetchDayIndex() {
  const store = db();

  if (store) {
    try {
      const snap = await getDocs(collection(store, 'days'));
      if (!snap.empty) {
        const merged = new Map(bundledDays.map(({ slug, no, title, subtitle, phase, exerciseLabel, collections }) =>
          [slug, { slug, no, title, subtitle, phase, exerciseLabel, collections }]));
        snap.docs.forEach((doc) => {
          const day = englishMetadata(doc.data());
          merged.set(day.slug, { ...merged.get(day.slug), ...day });
        });
        return [...merged.values()].sort((a, b) => (a.no || 0) - (b.no || 0));
      }
    } catch (e) {
      console.warn('[lesson] không đọc được danh sách buổi rút gọn:', e.message);
    }
  }

  return bundledDays.map(({ slug, no, title, subtitle, phase, exerciseLabel, collections }) => ({
    slug,
    no,
    title,
    subtitle,
    phase,
    exerciseLabel,
    collections,
  }));
}
