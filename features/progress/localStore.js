'use client';

// Kho tiến độ Ở MÁY (localStorage). Không đụng tới mạng.
//
// Bản ở máy có ghi thêm CHỦ SỞ HỮU (uid). Không có nó thì hai tài khoản Google
// dùng chung một trình duyệt sẽ nuốt tiến độ của nhau.

import { EMPTY } from './merge';

export const KEY = 'toeic900';
export const OWNER_KEY = 'toeic900:owner';

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
