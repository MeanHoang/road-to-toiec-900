'use client';

// Kho tiến độ ở máy, cộng với việc đẩy bản ở máy vào một tài khoản.
//
// Tách riêng khỏi progress.js vì AuthProvider cũng cần dùng, mà progress.js lại
// đi ngược lại đọc AuthProvider — để chung một file là import vòng.
//
// Bản ở máy có ghi thêm CHỦ SỞ HỮU (uid). Không có nó thì hai tài khoản Google
// dùng chung một trình duyệt sẽ nuốt tiến độ của nhau.
//
// Luật gộp nằm ở lib/merge.js, tách hẳn ra để test bằng node được.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { EMPTY, mergeDay } from './merge';

export { EMPTY, mergeDay };

export const KEY = 'toeic900';
export const OWNER_KEY = 'toeic900:owner';

// --- localStorage -----------------------------------------------------------

export function readAll() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function writeAll(all) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function readDay(slug) {
  return { ...EMPTY, ...(readAll()[slug] || {}) };
}

export function writeDay(slug, day) {
  const all = readAll();
  all[slug] = day;
  writeAll(all);
}

export function readOwner() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(OWNER_KEY);
}

export function writeOwner(uid) {
  if (typeof window === 'undefined') return;
  if (uid) window.localStorage.setItem(OWNER_KEY, uid);
  else window.localStorage.removeItem(OWNER_KEY);
}

export function clearLocal() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(OWNER_KEY);
}

// --- đẩy lên tài khoản ------------------------------------------------------

/**
 * Đẩy toàn bộ tiến độ đang có ở máy vào tài khoản `uid`, gộp với những gì tài
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
      console.warn(`[store] không đọc được progress/${uid}/days/${slug}:`, e.message);
      continue; // đọc hỏng thì bỏ qua buổi này, đừng ghi đè lên bản trên cloud
    }

    const merged = mergeDay(local, remote);
    all[slug] = merged;
    try {
      await setDoc(ref, merged);
      done += 1;
    } catch (e) {
      console.warn(`[store] không ghi được progress/${uid}/days/${slug}:`, e.message);
    }
  }

  writeAll(all);
  writeOwner(uid);
  return { days: done };
}
