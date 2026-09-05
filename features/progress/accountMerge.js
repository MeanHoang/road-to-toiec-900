'use client';

// Đẩy tiến độ đang có ở máy vào một tài khoản.
//
// Tách khỏi useProgress.js vì features/auth cũng gọi, mà useProgress lại đi
// ngược lại đọc useAuth — để chung một file là import vòng.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EMPTY, mergeDay } from './merge';
import { readAll, writeAll, writeOwner } from './localStore';

/**
 * Gộp toàn bộ tiến độ đang có ở máy vào tài khoản `uid`, cộng với những gì tài
 * khoản đó đã có sẵn trên Firestore.
 *
 * Dùng khi đăng nhập Google mà uid ĐỔI ('switched'): tiến độ ẩn danh nằm ở
 * progress/<uid-ẩn-danh>, mà rules không cho đọc doc của uid khác, nên nguồn
 * để gộp là bản localStorage — thứ duy nhất còn cầm được sau khi đổi tài khoản.
 */
export async function mergeLocalIntoAccount(uid) {
  const store = db();
  const all = readAll();
  const slugs = Object.keys(all);
  if (!store || !uid || !slugs.length) {
    writeOwner(uid);
    return { days: 0 };
  }

  let done = 0;
  for (const slug of slugs) {
    const local = { ...EMPTY, ...all[slug] };
    const ref = doc(store, 'progress', uid, 'days', slug);

    let remote = EMPTY;
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) remote = { ...EMPTY, ...snap.data() };
    } catch (e) {
      console.warn(`[progress] không đọc được progress/${uid}/days/${slug}:`, e.message);
      continue; // đọc hỏng thì bỏ qua buổi này, đừng ghi đè lên bản trên cloud
    }

    const merged = mergeDay(local, remote);
    all[slug] = merged;
    try {
      await setDoc(ref, merged);
      done += 1;
    } catch (e) {
      console.warn(`[progress] không ghi được progress/${uid}/days/${slug}:`, e.message);
    }
  }

  writeAll(all);
  writeOwner(uid);
  return { days: done };
}
