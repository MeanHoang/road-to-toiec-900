'use client';

import { useTranslation } from '@/features/language/LanguageProvider';
// Cho người học biết tiến độ đang nằm ở đâu, và đổi được chỗ đó.
//
// Ẩn danh không phải là "chưa đăng nhập" — nó vẫn học và vẫn lưu bình thường,
// chỉ là gắn với đúng trình duyệt này. Câu chữ ở đây phải nói rõ chuyện đó,
// không thì người dùng tưởng mất dữ liệu.
//
// Vì sao nằm ở features/auth chứ không phải shared/ui/organisms: nó đọc trạng
// thái đăng nhập và gọi signIn/signOut — đó là logic domain, không phải UI suông.

import { Button } from '@/shared/ui/atoms/Button';
import { ButtonGroup } from '@/shared/ui/atoms/ButtonGroup';
import { Notice } from '@/shared/ui/atoms/Notice';
import { Skeleton } from '@/shared/ui/atoms/Skeleton';
import { useAuth } from './AuthProvider';

/**
 * `trailing` là một khe trống bên phải, cạnh nút đăng nhập/đăng xuất.
 *
 * Để màn gọi nhét thêm nút vào đây — hiện là nút phòng thi và bảng xếp hạng. Làm thành khe thay vì import thẳng, để AccountBar không phải biết bảng
 * xếp hạng là cái gì; nó vẫn chỉ lo mỗi chuyện ai đang học.
 */
export function AccountBar({ trailing }) {
  const t = useTranslation();
  const { cloud, ready, user, anonymous, busy, error, signIn, signOut } = useAuth();

  if (!cloud) {
    return (
      <div className="account">
        <span className="account-mark" aria-hidden="true">
          ⌂
        </span>
        <div className="account-who">
          <b>{t('Saved on this device')}</b>
          <span>{t('Cloud sync is unavailable. Your progress is saved in this browser.')}</span>
        </div>
        {/* Không có Firebase vẫn phải có lối vào những thứ trong khe, như phòng
            thi — nó chạy được hoàn toàn từ nội dung trong repo. */}
        {trailing && (
          <div className="account-action">
            <ButtonGroup align="end">{trailing}</ButtonGroup>
          </div>
        )}
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
          <span className="visually-hidden">{t('Checking your account')}</span>
          <Skeleton width={140} height={16} />
          <Skeleton width="70%" height={13} style={{ marginTop: 'var(--space-2)' }} />
        </div>
      </div>
    );
  }

  const label = busy === 'merge' ? 'Merging progress…' : busy === 'in' ? 'Opening Google…' : null;

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
              <b>{t('Studying as a guest')}</b>
              <span>
                {t('Your progress is saved in this browser. Sign in with Google to continue on another device. Your existing progress will carry over.')}
              </span>
            </>
          ) : (
            <>
              <b>{user.displayName || user.email}</b>
              <span>{t('Your progress syncs to your account across devices.')}</span>
            </>
          )}
        </div>

        <div className="account-action">
          <ButtonGroup align="end">
            {trailing}
            {anonymous ? (
              <Button variant="primary" size="sm" onClick={signIn} disabled={Boolean(busy)}>
                {t(label || 'Sign in with Google')}
              </Button>
            ) : (
              <Button variant="quiet" size="sm" onClick={signOut} disabled={Boolean(busy)}>
                {busy === 'out' ? t('Signing out…') : t('Sign out')}
              </Button>
            )}
          </ButtonGroup>
        </div>
      </div>

      {error && <Notice style={{ marginTop: 'var(--space-3)' }}>{t(error)}</Notice>}
    </>
  );
}
