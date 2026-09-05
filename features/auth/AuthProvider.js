'use client';

// Ai đang học — một chỗ duy nhất cho cả app.
//
// Vì sao phải là provider chứ không để mỗi useProgress tự lo: việc gộp tiến độ
// lúc đăng nhập phải xảy ra ĐÚNG MỘT LẦN cho mọi buổi học. Trang chủ render một
// useProgress cho mỗi buổi, để chúng tự gộp là chạy đua với nhau.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { isConfigured, signInWithGoogle, signOutUser, watchUser } from '@/lib/firebase';
import { clearLocal, readOwner, writeOwner } from '@/features/progress/localStore';
import { mergeLocalIntoAccount } from '@/features/progress/accountMerge';
import { isCancelled, messageFor } from './authErrors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!isConfigured);
  const [busy, setBusy] = useState(null); // 'in' | 'merge' | 'out'
  const [error, setError] = useState(null);

  // Đang tự tay đổi tài khoản: khóa cái effect canh chủ sở hữu bên dưới lại,
  // không thì nó xóa mất bản ở máy ngay giữa lúc đang gộp.
  const claiming = useRef(false);

  useEffect(() => {
    if (!isConfigured) return undefined;
    return watchUser((u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  // uid đổi mà không đi qua signIn() ở tab này — ví dụ đăng nhập ở tab khác, hay
  // phiên ẩn danh cũ hết hạn. Bản ở máy khi đó là của người khác: xóa đi.
  // Thà tải lại từ cloud còn hơn để tiến độ của tài khoản trước rò sang.
  useEffect(() => {
    if (!user || claiming.current) return;
    const owner = readOwner();
    if (owner === user.uid) return;
    if (owner) clearLocal();
    writeOwner(user.uid);
  }, [user]);

  const signIn = useCallback(async () => {
    setBusy('in');
    setError(null);
    claiming.current = true;
    try {
      const res = await signInWithGoogle();

      if (res.kind === 'switched') {
        // uid đổi → tiến độ đang có ở máy phải được gộp vào tài khoản mới.
        setBusy('merge');
        await mergeLocalIntoAccount(res.uid);
      } else {
        // 'linked': uid giữ nguyên, doc progress/<uid> vẫn là doc cũ.
        writeOwner(res.uid);
      }
    } catch (e) {
      if (!isCancelled(e)) setError(messageFor(e));
    } finally {
      claiming.current = false;
      setBusy(null);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusy('out');
    setError(null);
    claiming.current = true;
    try {
      // Xóa trước rồi mới đăng xuất: phiên ẩn danh mới dựng lên ngay sau đó
      // không được thừa hưởng tiến độ của tài khoản vừa thoát.
      clearLocal();
      await signOutUser();
    } catch (e) {
      setError(messageFor(e));
    } finally {
      claiming.current = false;
      setBusy(null);
    }
  }, []);

  const value = {
    user,
    uid: user?.uid || null,
    anonymous: !user || user.isAnonymous,
    ready,
    busy,
    error,
    cloud: isConfigured,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>');
  return ctx;
}
