'use client';

// Cảnh 20/10 — Ngày Phụ nữ Việt Nam: nhiều mảnh Lottie xếp lớp, không phải một
// file trọn gói.
//
// Xếp lớp chứ không dùng một cảnh dựng sẵn vì mỗi mảnh khi đó có vị trí, kích
// thước, tốc độ riêng — và thay một mảnh không phải làm lại cả bức. Ảnh do hoạ
// sĩ vẽ, tải ở lottiefiles.com, đã qua `node scripts/prep-lottie.mjs women-day`
// để đổi màu về tông thiệp kem + hoa hồng.
//
// MỘT tầng duy nhất, ở z-index -1, nằm SAU mọi nội dung. Không có mảnh nào
// chạy trước nội dung: thứ duy nhất từng ở đó là một con bướm bay ngang, và
// mảnh nằm trước nội dung thì bay ở độ cao nào cũng che chữ ở độ cao đó.
//
// Trang trí thuần: không đọc tiến độ, không fetch nội dung bài học, không biết
// TOEIC là gì — nên nó ở `shared/`.

import { LottiePiece } from '@/shared/ui/molecules/LottiePiece';

const A = '/assets/event/women-day';

/**
 * Cánh hoa rơi kín màn.
 *
 * [x%, rộng px, thời lượng s, độ trễ s, độ mờ, có chạy Lottie không]
 *
 * Vì sao PHẦN LỚN không chạy Lottie: mỗi player đang chạy là một vòng vẽ lại
 * theo từng khung hình. Hai mươi hai cái cùng chạy thì máy yếu quay như chong
 * chóng, mà mắt cũng không phân biệt nổi cánh nào đang tự động đậy. Cánh bị
 * `goToAndStop` thì Lottie thôi vẽ hẳn — coi như một bức tranh SVG tĩnh — còn
 * việc rơi và xoay giao cho CSS, thứ chạy thẳng trên compositor. Kết quả: 22
 * cánh hoa nhưng chỉ 3 vòng vẽ, cộng 3 cho bó hoa, hồng và bướm.
 *
 * `--delay` ÂM là điểm mấu chốt: ở khung hình ĐẦU TIÊN hoa đã rơi kín màn ở đủ
 * mọi độ cao, không phải chờ chúng lần lượt rơi xuống từ mép trên.
 *
 * Cánh nhỏ + mờ đọc ra là "ở xa", cánh to + rõ là "ở gần" — đó là cách duy nhất
 * tạo được chiều sâu khi tất cả đều nằm trên một mặt phẳng.
 */
const PETALS = [
  [1, 64, 41, -14, 0.8],
  [6, 38, 58, -33, 0.5],
  [10, 86, 34, -22, 0.95, true],
  [15, 30, 66, -7, 0.42],
  [19, 54, 47, -40, 0.68],
  [24, 42, 61, -18, 0.5],
  [28, 28, 70, -51, 0.38],
  [33, 72, 38, -27, 0.86],
  [37, 34, 63, -5, 0.44],
  [42, 48, 52, -29, 0.6],
  [46, 26, 72, -46, 0.36],
  [51, 68, 40, -16, 0.78],
  [55, 36, 59, -21, 0.48],
  [60, 30, 67, -38, 0.4],
  [64, 60, 44, -36, 0.72],
  [69, 90, 33, -30, 1, true],
  [73, 44, 55, -12, 0.58],
  [78, 32, 65, -45, 0.42],
  [82, 76, 37, -19, 0.88],
  [87, 38, 60, -32, 0.5],
  [91, 80, 36, -25, 0.92, true],
  [96, 50, 50, -3, 0.62],
];

export function WomenDayScene() {
  return (
    <>
      <div className="event-overlay" aria-hidden="true">
        {PETALS.map(([x, w, dur, delay, op, live], i) => (
          <LottiePiece
            key={i}
            src={`${A}/petal.json`}
            className="ev-wd-petal"
            style={{
              '--x': `${x}%`,
              '--w': `${w}px`,
              '--dur': `${dur}s`,
              '--delay': `${delay}s`,
              '--op': op,
            }}
            still={!live}
            // Khung nghỉ lệch nhau theo vị trí: 22 cánh cùng đỗ ở một khung thì
            // chúng thành 22 bản sao y hệt, nhìn ra ngay là máy rải.
            rest={0.2 + (i % 5) * 0.15}
            speed={0.5}
          />
        ))}


        {/* Màn đặt NGAY SAU cánh hoa, không phải ở cuối: phần tử sau vẽ đè lên
            phần tử trước, nên màn ở cuối sẽ rửa trắng luôn cả bó hoa và bông
            hồng ở đáy. Ở đây nó chỉ làm mờ thứ duy nhất đi ngang qua chữ là
            cánh hoa, còn mấy mảnh nằm ngoài cột chữ thì giữ nguyên màu. */}
        <div className="ev-veil" />

        {/* Bó hoa và bông hồng ĐỨNG YÊN ở một khung: file gốc là hoạt cảnh "nở
            ra rồi biến mất", chạy vòng lặp thì hai góc màn hình cứ chớp tắt
            suốt buổi học. Lottie chỉ đóng vai bức vẽ, việc đung đưa nhè nhẹ
            giao cho CSS. */}
        <LottiePiece src={`${A}/bouquet.json`} className="ev-wd-bouquet" still rest={0.45} />
        <LottiePiece src={`${A}/rose.json`} className="ev-wd-rose" still rest={0.8} />

        {/* Hộp quà cũng ĐỨNG YÊN, cùng lý do như bó hoa: file gốc là hoạt
            cảnh nảy lên theo vòng lặp, để chạy thì hai góc màn hình nhún nhảy
            suốt buổi học. */}
        <LottiePiece src={`${A}/gift.json`} className="ev-wd-gift-1" still rest={0.5} />
        <LottiePiece src={`${A}/gift.json`} className="ev-wd-gift-2" still rest={0.5} />
      </div>
    </>
  );
}
