'use client';

// Khởi tạo Firebase phía client.
//
// Config này là PUBLIC, để lộ không sao — bảo mật nằm ở Firestore security rules
// chứ không nằm ở apiKey. Xem firestore.rules.
//
// App vẫn chạy được khi CHƯA cấu hình Firebase: mọi thứ rơi về localStorage và
// nội dung JSON bundle sẵn trong repo. Nhờ vậy `npm run dev` không cần env.

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithCredential,
  linkWithPopup,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isConfigured = Boolean(config.apiKey && config.projectId);

let app;
let dbInstance;

function ensureApp() {
  if (!isConfigured) return null;
  if (!app) app = getApps()[0] || initializeApp(config);
  return app;
}

export function db() {
  if (!ensureApp()) return null;
  if (!dbInstance) dbInstance = getFirestore(app);
  return dbInstance;
}

export function auth() {
  if (!ensureApp()) return null;
  return getAuth(app);
}

/**
 * Theo dõi người dùng hiện tại.
 *
 * Chưa ai đăng nhập thì tự đăng nhập ẩn danh — vào app là học được ngay, không
 * bắt tạo tài khoản. Tài khoản ẩn danh gắn với ĐÚNG trình duyệt này, nên muốn
 * học chung một tiến độ trên nhiều máy thì phải nâng cấp lên Google.
 *
 * Trả về hàm hủy theo dõi. Gọi `cb(null)` khi chưa cấu hình Firebase.
 */
export function watchUser(cb) {
  const a = auth();
  if (!a) {
    cb(null);
    return () => {};
  }

  return onAuthStateChanged(a, (user) => {
    if (user) return cb(user);
    // Chưa có ai: tạo phiên ẩn danh. Thành công thì onAuthStateChanged tự bắn
    // lại lần nữa với user mới, nên ở đây không cần gọi cb.
    signInAnonymously(a).catch((e) => {
      console.warn('[firebase] đăng nhập ẩn danh lỗi:', e.message);
      cb(null);
    });
  });
}

/**
 * Đăng nhập Google. Hai đường đi, khác nhau ở chỗ uid có đổi hay không:
 *
 *   'linked'   đang ẩn danh và tài khoản Google này CHƯA từng dùng app
 *              → nâng cấp phiên ẩn danh tại chỗ, uid GIỮ NGUYÊN.
 *              progress/<uid> vẫn là doc cũ, không phải chuyển gì cả.
 *
 *   'switched' tài khoản Google này đã có uid riêng từ trước (máy khác, hoặc
 *              lần đăng nhập trước) → Firebase từ chối link và bắt đăng nhập
 *              thẳng. uid ĐỔI, nên tiến độ đang có ở máy phải được gộp sang
 *              tài khoản đó — xem mergeLocalIntoAccount trong lib/store.
 *
 * Bên gọi phải xử lý 'switched', nếu không là mất tiến độ đang học.
 */
export async function signInWithGoogle() {
  const a = auth();
  if (!a) throw new Error('Chưa cấu hình Firebase');

  const provider = new GoogleAuthProvider();
  const anon = a.currentUser?.isAnonymous ? a.currentUser : null;

  if (anon) {
    try {
      const cred = await linkWithPopup(anon, provider);
      return { uid: cred.user.uid, kind: 'linked' };
    } catch (e) {
      const taken = e.code === 'auth/credential-already-in-use' || e.code === 'auth/email-already-in-use';
      if (!taken) throw e;

      // Tài khoản Google đã tồn tại. Lấy credential ra từ chính lỗi đó rồi
      // đăng nhập thẳng — không cần bật popup lần hai.
      const credential = GoogleAuthProvider.credentialFromError(e);
      if (!credential) throw e;
      const cred = await signInWithCredential(a, credential);
      return { uid: cred.user.uid, kind: 'switched' };
    }
  }

  const cred = await signInWithPopup(a, provider);
  return { uid: cred.user.uid, kind: 'switched' };
}

/** Đăng xuất. watchUser sẽ tự dựng lại một phiên ẩn danh mới ngay sau đó. */
export async function signOutUser() {
  const a = auth();
  if (a) await signOut(a);
}
