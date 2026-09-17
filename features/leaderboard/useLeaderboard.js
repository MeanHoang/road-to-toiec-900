'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { readAll } from '@/features/progress/localStore';
import { fetchTop, publishEntry } from './api';
import { totalScore } from './score';

// Chờ tiến độ lắng xuống rồi mới ghi điểm.
//
// Điểm tính từ localStorage, mà localStorage chỉ ĐẦY ĐỦ sau khi mỗi useProgress
// đã gộp xong bản trên Firestore về. Ghi ngay lúc mở trang là ghi điểm hụt của
// người vừa đổi máy — họ sẽ thấy mình tụt hạng không hiểu vì sao. Đợi lâu hơn
// tổng của debounce ghi (1200ms) cộng một vòng mạng.
const SETTLE = 3000;

/**
 * Bảng xếp hạng cho trang chủ.
 *
 * Trả về cả bảng lẫn điểm của chính mình, và tự ghi điểm mình lên bảng khi đã
 * đăng nhập thật. Người đang ẩn danh vẫn ĐỌC được bảng, chỉ không lên bảng —
 * họ không có tên, và mỗi trình duyệt lại đẻ một uid ẩn danh mới.
 */
export function useLeaderboard({ enabled = true } = {}) {
  const { uid, anonymous, name, email, photo, cloud } = useAuth();

  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myScore, setMyScore] = useState(0);

  const load = useCallback(async () => {
    const { rows: got, error: err } = await fetchTop();
    setRows(got);
    setError(err);
    setLoading(false);
  }, []);

  // `enabled` đọc qua ref chứ không qua dependency: nó được dùng bên trong một
  // setTimeout, mà cho nó vào deps thì mỗi lần đóng/mở modal lại reset đồng hồ
  // chờ-lắng, đẩy lùi việc ghi điểm. Ref cho closure thấy giá trị mới nhất mà
  // không phải dựng lại effect.
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // 1) Chỉ ĐỌC bảng khi thật sự cần nhìn (modal mở).
  // Bảng nằm sau một nút bấm, nên đọc sẵn cho mọi lượt mở trang chủ là trả tiền
  // đọc Firestore cho phần lớn người chẳng bao giờ bấm vào.
  useEffect(() => {
    if (!cloud) {
      setLoading(false); // không có Firestore thì không có gì để chờ
      return;
    }
    if (!enabled) return;
    load();
  }, [cloud, enabled, load]);

  // 2) Đợi lắng rồi ghi điểm của mình, xong tải lại bảng để thấy hạng mới.
  useEffect(() => {
    if (!cloud || !uid || anonymous) return undefined;

    let alive = true;
    const t = setTimeout(async () => {
      const score = totalScore(readAll());
      if (!alive) return;
      setMyScore(score);

      const label = (name || '').trim() || (email || '').split('@')[0];
      if (!label) return;

      // Ghi xong chỉ tải lại khi bảng ĐANG mở — đóng thì chẳng ai nhìn, mà lần
      // mở sau vẫn tải mới.
      if (await publishEntry({ uid, name: label, photo, score })) {
        if (alive && enabledRef.current) load();
      }
    }, SETTLE);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [cloud, uid, anonymous, name, email, photo, load]);

  return { rows, error, loading, myScore, me: uid };
}
