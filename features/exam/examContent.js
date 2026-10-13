'use client';

// Nguồn nội dung của PHÒNG THI. Tách hẳn khỏi features/lesson/api.js.
//
// Vì sao tách chứ không nhét vào tầng bài học đang có:
//   - Đề thi không thuộc buổi nào. Tầng kia xoay quanh `slug` của một buổi,
//     nhét đề vào đó là phải bịa ra một buổi giả.
//   - Nhánh bài học (bundled.js, api.js) đang có người sửa để nhập buổi mới.
//     Hai việc không đụng nhau thì không nên dùng chung file.
//
// Giống api.js ở một điểm: ưu tiên Firestore, không có thì rơi về JSON bundle
// trong repo — chưa cấu hình Firebase vẫn thi được, mất mạng vẫn thi được.

import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import etsSample from '@/content/exam/ets-sample.json';
import paperList from '@/content/exam/papers.json';

const SCHEMA_VERSION = 1;

/** Các đề bundle sẵn trong repo. Thêm đề mẫu mới thì thêm một dòng ở đây. */
const BUNDLED = [etsSample];

function check(form) {
  if (form?.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`đề ${form?.form} dùng schemaVersion ${form?.schemaVersion}, code ở ${SCHEMA_VERSION}`);
  }
  return form;
}

/**
 * Mọi đề đọc đang có.
 *
 * Firestore lưu mỗi đề là một document trong `exam/` — ngang hàng với `days/`,
 * không nằm trong nó, vì đề không thuộc buổi nào.
 */
export async function fetchExamForms() {
  const store = db();

  if (store) {
    try {
      const snap = await getDocs(collection(store, 'exam'));
      if (!snap.empty) return snap.docs.map((d) => check(d.data()));
    } catch (e) {
      console.warn('[exam] không đọc được đề từ Firestore:', e.message);
    }
  }

  return BUNDLED.map(check);
}

/** Bản bundle, dùng được ngay không cần chờ mạng. */
export const bundledForms = BUNDLED.map(check);

/**
 * Danh sách ĐỀ: đề nào gồm những bộ nào.
 *
 * Là DỮ LIỆU chứ không phải thứ tính lúc chạy. "Đề số 1" phải là cùng một bộ
 * câu với mọi người học thì mới so điểm được, và nhập thêm buổi mới cũng không
 * được làm đề cũ đổi nội dung. Sinh bằng `npm run build-papers`.
 */
export const bundledPapers = check(paperList).papers;

/** Danh sách đề trên Firestore, không có thì dùng bản bundle. */
export async function fetchPapers() {
  const store = db();

  if (store) {
    try {
      const snap = await getDoc(doc(store, 'exam-papers', 'list'));
      if (snap.exists()) return check(snap.data()).papers;
    } catch (e) {
      console.warn('[exam] không đọc được danh sách đề từ Firestore:', e.message);
    }
  }

  return bundledPapers;
}
