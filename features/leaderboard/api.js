'use client';

// Đọc/ghi bảng xếp hạng. Một collection PHẲNG `leaderboard/<uid>`, mỗi người
// một doc, cố ý tách khỏi `progress/`.
//
// Vì sao không tính điểm thẳng từ `progress`:
//
//   1. TÊN không nằm trong Firestore mà nằm ở Firebase Auth, và client không
//      liệt kê được user của Auth — chỉ Admin SDK làm được. Nên dù có gom được
//      điểm theo uid thì bảng vẫn chỉ hiện "qwtmfPf4…". Muốn có tên thì mỗi
//      người phải tự ghi tên mình vào Firestore, tức là đúng cái doc này.
//   2. Client KHÔNG liệt kê nổi ai đang có tài khoản: doc `progress/<uid>` chỉ
//      là vỏ chứa subcollection, truy vấn thường trả về rỗng.
//   3. Mở `progress` cho đọc chéo là phơi cả tiến độ thô, và mỗi lần mở trang
//      chủ phải đọc mọi doc của mọi người.

import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COL = 'leaderboard';

/**
 * Ghi điểm của chính mình lên bảng.
 * Im lặng bỏ qua nếu chưa cấu hình Firebase hoặc chưa đăng nhập thật —
 * bảng xếp hạng hỏng thì không được phép làm hỏng việc học.
 */
export async function publishEntry({ uid, name, photo, score }) {
  const store = db();
  if (!store || !uid || !name) return false;

  try {
    await setDoc(doc(store, COL, uid), {
      name: name.slice(0, 60),
      photo: photo || null,
      score,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (e) {
    console.warn('[leaderboard] không ghi được điểm:', e.message);
    return false;
  }
}

/**
 * Bảng xếp hạng, điểm cao xuống thấp.
 *
 * Trả về `{ rows, error }` chứ không phải mảng trơn. Nuốt lỗi rồi trả mảng rỗng
 * thì màn hình nói "chưa có ai trên bảng" trong khi sự thật là "không đọc được"
 * — hai chuyện khác hẳn nhau, và cái sai kia khiến người ta đi tìm nhầm chỗ.
 * Đây đúng là lỗi đã xảy ra: rules chưa publish, Firestore trả 403, giao diện
 * báo bảng trống.
 */
export async function fetchTop(max = 20) {
  const store = db();
  if (!store) return { rows: [], error: null };

  try {
    const snap = await getDocs(query(collection(store, COL), orderBy('score', 'desc'), limit(max)));
    return { rows: snap.docs.map((d) => ({ uid: d.id, ...d.data() })), error: null };
  } catch (e) {
    console.warn('[leaderboard] không đọc được bảng:', e.message);
    const denied = e.code === 'permission-denied';
    return {
      rows: [],
      error: denied
        ? 'Chưa mở quyền đọc bảng xếp hạng. Cần dán firestore.rules lên Firebase Console rồi Publish.'
        : 'Không đọc được bảng xếp hạng. Kiểm tra kết nối mạng.',
    };
  }
}

/** Tự rút khỏi bảng. */
export async function removeEntry(uid) {
  const store = db();
  if (!store || !uid) return;
  try {
    await deleteDoc(doc(store, COL, uid));
  } catch (e) {
    console.warn('[leaderboard] không xoá được:', e.message);
  }
}
