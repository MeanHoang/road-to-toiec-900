// Dịch mã lỗi của Firebase Auth sang câu người học đọc được, và nói luôn phải
// làm gì. Tách riêng vì đây là dữ liệu thuần, không dính React.

export function messageFor(e) {
  switch (e.code) {
    case 'auth/operation-not-allowed':
      return 'Chưa bật đăng nhập Google trong Firebase Console → Authentication → Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'Tên miền này chưa được cho phép trong Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/popup-blocked':
      return 'Trình duyệt chặn popup. Cho phép popup cho trang này rồi thử lại.';
    case 'auth/network-request-failed':
      return 'Mất mạng. Tiến độ vẫn đang lưu ở máy, đăng nhập lại sau cũng được.';
    default:
      return e.message || 'Đăng nhập không thành công.';
  }
}

/** Người dùng tự đóng popup thì không phải lỗi, đừng hiện gì cả. */
export const isCancelled = (e) =>
  e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request';
