'use client';

// Cho người học biết tiến độ đang nằm ở đâu, và đổi được chỗ đó.
//
// Ẩn danh không phải là "chưa đăng nhập" — nó vẫn học và vẫn lưu bình thường,
// chỉ là gắn với đúng trình duyệt này. Câu chữ ở đây phải nói rõ chuyện đó,
// không thì người dùng tưởng mất dữ liệu.
//
// Vì sao nằm ở features/auth chứ không phải shared/ui/organisms: nó đọc trạng
// thái đăng nhập và gọi signIn/signOut — đó là logic domain, không phải UI suông.

import { Button } from '@/shared/ui/atoms/Button';
import { Notice } from '@/shared/ui/atoms/Notice';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { useAuth } from './AuthProvider';

export function AccountBar() {
  const { cloud, ready, user, anonymous, busy, error, signIn, signOut } = useAuth();

  if (!cloud) {
    return (
      <div className="account">
        <span className="account-mark" aria-hidden="true">
          ⌂
        </span>
        <div className="account-who">
          <b>Chỉ lưu ở máy này</b>
          <span>Chưa cấu hình Firebase — tiến độ nằm trong trình duyệt, không đồng bộ.</span>
        </div>
      </div>
    );
  }

  // Chưa biết ai đang đăng nhập: giữ đúng khung thanh tài khoản, đừng viết
  // 'đang kiểm tra' rồi lát nữa đổi chiều cao khi tên thật hiện ra.
  if (!ready) {
    return (
      <div className="account" role="status" aria-busy="true">
        <Skeleton width={34} height={34} radius="var(--radius-full)" style={{ flex: 'none' }} />
        <div className="account-who">
          <span className="visually-hidden">Đang kiểm tra tài khoản</span>
          <Skeleton width={140} height={16} />
          <Skeleton width="70%" height={13} style={{ marginTop: 'var(--space-2)' }} />
        </div>
      </div>
    );
  }

  const label = busy === 'merge' ? 'Đang gộp tiến độ…' : busy === 'in' ? 'Đang mở Google…' : null;

  return (
    <>
      <div className="account">
        {anonymous ? (
          <span className="account-mark" aria-hidden="true">
            ?
          </span>
        ) : user.photoURL ? (
          <img className="account-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="account-mark is-on" aria-hidden="true">
            {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
          </span>
        )}

        <div className="account-who">
          {anonymous ? (
            <>
              <b>Đang học ẩn danh</b>
              <span>
                Tiến độ chỉ theo trình duyệt này. Đăng nhập Google để mở máy khác vẫn học tiếp — phần
                đang học sẽ được gộp sang, không mất.
              </span>
            </>
          ) : (
            <>
              <b>{user.displayName || user.email}</b>
              <span>Tiến độ đồng bộ theo tài khoản, mở máy nào cũng thấy.</span>
            </>
          )}
        </div>

        <div className="account-action">
          {anonymous ? (
            <Button variant="primary" size="sm" onClick={signIn} disabled={Boolean(busy)}>
              {label || 'Đăng nhập Google'}
            </Button>
          ) : (
            <Button variant="quiet" size="sm" onClick={signOut} disabled={Boolean(busy)}>
              {busy === 'out' ? 'Đang thoát…' : 'Đăng xuất'}
            </Button>
          )}
        </div>
      </div>

      {error && <Notice style={{ marginTop: 'var(--space-3)' }}>{error}</Notice>}
    </>
  );
}
