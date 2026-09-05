'use client';

// Một mảnh Lottie. Không biết lễ hội nào, không biết đặt ở đâu — bên gọi lo
// việc đó bằng class. Ở đây chỉ có: nạp file, chạy, dừng, dọn.
//
// Thư viện được import ĐỘNG và dùng bản `lottie_light` (chỉ renderer SVG, bỏ
// canvas với html). Nhờ vậy trang nào không dựng mảnh nào thì không tải byte
// nào của lottie.

import { useCallback, useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param src    đường dẫn file .json trong public/
 * @param still  đứng yên thay vì chạy (màn cần tập trung, hoặc mảnh cố ý bất động)
 * @param speed  hệ số tốc độ, 1 là như file gốc
 * @param rest   khung hình đứng lại khi dừng, tính theo tỉ lệ 0-1 của thời lượng
 */
export function LottiePiece({
  src,
  className = '',
  style,
  still = false,
  speed = 1,
  rest = 0.4,
}) {
  const hostRef = useRef(null);
  const animRef = useRef(null);

  // Giữ tham số mới nhất trong ref: hàm `apply` bên dưới được gọi lại từ sự kiện
  // DOMLoaded xảy ra SAU khi effect đã chạy xong, nên nó không đọc được biến
  // đóng gói của lần render cũ.
  const wantRef = useRef({ still, speed, rest });
  wantRef.current = { still, speed, rest };

  const apply = useCallback(() => {
    const anim = animRef.current;
    if (!anim) return;
    const want = wantRef.current;
    anim.setSpeed(want.speed);
    if (want.still || prefersReducedMotion()) {
      anim.goToAndStop(Math.round(anim.totalFrames * want.rest), true);
    } else {
      anim.play();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const lottie = (await import('lottie-web/build/player/lottie_light')).default;
        if (cancelled || !hostRef.current) return;

        const anim = lottie.loadAnimation({
          container: hostRef.current,
          renderer: 'svg',
          loop: true,
          // Tự quyết định chạy hay dừng, đừng để nó tự chạy rồi mới đi tắt —
          // người bật "giảm chuyển động" sẽ thấy giật một nhịp.
          autoplay: false,
          path: src,
          rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
        });
        animRef.current = anim;

        // PHẢI gọi từ đây. `totalFrames` chỉ có sau khi tải xong, mà lúc effect
        // điều khiển bên dưới chạy lần đầu thì animation còn chưa tồn tại —
        // import động vẫn đang chờ.
        anim.addEventListener('DOMLoaded', apply);
      } catch {
        // Sai đường dẫn, file hỏng, chặn mạng — bỏ qua trong im lặng.
        // Một thứ trang trí không được phép làm sập màn hình học.
      }
    })();

    return () => {
      cancelled = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [src, apply]);

  /**
   * Đổi trạng thái sau khi đã nạp — ví dụ điều hướng sang màn cần tập trung.
   *
   * CSS không với tới được: luật `prefers-reduced-motion` trong base.css chỉ tắt
   * CSS animation, còn Lottie tự vẽ từng khung bằng JS nên nó cứ thế chạy tiếp.
   *
   * Dừng thì đứng ở giữa chừng chứ không phải khung số 0: khung đầu của gần như
   * mọi file Lottie là trạng thái trước khi mọi thứ xuất hiện, tức gần như trống
   * trơn. Giảm chuyển động là bớt động, không phải xoá nội dung đi.
   */
  useEffect(() => {
    if (animRef.current?.isLoaded) apply();
  }, [still, speed, rest, apply]);

  return <div className={className} style={style} ref={hostRef} />;
}
