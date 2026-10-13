// Dịch mã lỗi của Firebase Auth sang câu người học đọc được, và nói luôn phải
// làm gì. Tách riêng vì đây là dữ liệu thuần, không dính React.

export function messageFor(e) {
  switch (e.code) {
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the popup. Allow popups for this site and try again.';
    case 'auth/network-request-failed':
      return 'You are offline. Your progress is still saved on this device. Try signing in again later.';
    default:
      return e.message || 'Sign-in failed.';
  }
}

/** Người dùng tự đóng popup thì không phải lỗi, đừng hiện gì cả. */
export const isCancelled = (e) =>
  e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request';
