'use client';

// Nguồn nội dung của PHÒNG THI. Tách hẳn khỏi features/lesson/api.js vì đề thi
// không thuộc buổi nào — tầng kia xoay quanh `slug` của một buổi.
//
// Ưu tiên Firestore, không có thì rơi về JSON bundle trong repo — chưa cấu hình
// Firebase vẫn thi được, mất mạng vẫn thi được.
//
// Mỗi document trong `exam/` là MỘT đề trọn vẹn, sắp theo số đề (`no`). Không
// có bảng khai đề riêng: đề nào gồm câu nào thì nằm ngay trong đề.

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import etsFull1 from '@/content/exam/ets-full-1.json';
import { isCompleteForm } from './rules';

const SCHEMA_VERSION = 2;

/** Các đề bundle sẵn trong repo. Thêm đề mới thì thêm một dòng ở đây. */
const BUNDLED = [etsFull1];

/**
 * Bản cũ trên Firestore (đề rút từ bài tập buổi học, schemaVersion 1) bị BỎ
 * QUA chứ không làm hỏng cả phòng thi: còn sót một document cũ thì các đề mới
 * vẫn hiện.
 */
const usable = (forms) =>
  forms
    .filter((f) => f?.schemaVersion === SCHEMA_VERSION && isCompleteForm(f))
    .sort((a, b) => a.no - b.no);

/** Mọi đề đang có, theo thứ tự "Đề số 1, 2, 3…". */
export async function fetchExamForms() {
  const store = db();
  if (store) {
    try {
      const snap = await getDocs(collection(store, 'exam'));
      const forms = usable(snap.docs.map((d) => d.data()));
      if (forms.length) return forms;
    } catch (e) {
      console.warn('[exam] không đọc được đề từ Firestore:', e.message);
    }
  }
  return usable(BUNDLED);
}

/** Bản bundle, dùng được ngay không cần chờ mạng. */
export const bundledForms = usable(BUNDLED);
