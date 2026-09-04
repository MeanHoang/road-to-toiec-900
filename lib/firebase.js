'use client';

// Khởi tạo Firebase phía client.
//
// Config này là PUBLIC, để lộ không sao — bảo mật nằm ở Firestore security rules
// chứ không nằm ở apiKey. Xem firestore.rules.
//
// App vẫn chạy được khi CHƯA cấu hình Firebase: mọi thứ rơi về localStorage và
// nội dung JSON bundle sẵn trong repo. Nhờ vậy `npm run dev` không cần env.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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

/**
 * Đăng nhập ẩn danh — không cần email, không cần mật khẩu.
 * Firebase tự sinh một uid và nhớ trong trình duyệt, nên mở lại vẫn là "cùng người".
 * Trả về uid, hoặc null nếu chưa cấu hình Firebase.
 */
export function currentUid() {
  if (!ensureApp()) return Promise.resolve(null);
  const auth = getAuth(app);

  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (user) => {
      stop();
      if (user) return resolve(user.uid);
      signInAnonymously(auth)
        .then((cred) => resolve(cred.user.uid))
        .catch((e) => {
          console.warn('[firebase] đăng nhập ẩn danh lỗi:', e.message);
          resolve(null);
        });
    });
  });
}
