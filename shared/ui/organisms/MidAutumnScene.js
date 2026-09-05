'use client';

// Cảnh Tết Trung Thu: nhiều mảnh Lottie xếp lớp, không phải một file trọn gói.
//
// Xếp lớp chứ không dùng một cảnh dựng sẵn vì mỗi mảnh khi đó có vị trí, kích
// thước, tốc độ riêng — và thay một mảnh không phải làm lại cả bức. Ảnh do hoạ
// sĩ vẽ, tải ở lottiefiles.com, đã qua scripts/prep-lottie.mjs để bỏ lớp thừa
// và đổi màu về tông lễ hội.
//
// HAI tầng, cố ý tách:
//   .event-overlay  z-index -1  — trời, mây, đèn lồng: nằm SAU mọi nội dung
//   .ev-front       z-index 20  — thỏ trượt ván: nằm TRƯỚC nội dung
//
// Trang trí thuần: không đọc tiến độ, không fetch nội dung bài học, không biết
// TOEIC là gì — nên nó ở `shared/`.

import { LottiePiece } from '@/shared/ui/molecules/LottiePiece';

const A = '/assets/event/mid-autumn';

/**
 * Đèn lồng thả kín trời.
 *
 * [x%, rộng px, thời lượng s, độ trễ s, độ mờ, có chạy Lottie không]
 *
 * Vì sao PHẦN LỚN không chạy Lottie: mỗi player đang chạy là một vòng vẽ lại
 * theo từng khung hình. Hai mươi hai cái cùng chạy thì máy yếu quay như chong
 * chóng, mà mắt cũng không phân biệt nổi cái nào đang tự đung đưa. Đèn bị
 * `goToAndStop` thì Lottie thôi vẽ hẳn — coi như một bức tranh SVG tĩnh — còn
 * việc bay lên và nghiêng qua nghiêng lại giao cho CSS, thứ chạy thẳng trên
 * compositor. Kết quả: 22 chiếc đèn nhưng chỉ 4 vòng vẽ.
 *
 * `--delay` ÂM là điểm mấu chốt: ở khung hình ĐẦU TIÊN trời đã đầy đèn ở đủ mọi
 * độ cao, không phải chờ chúng lần lượt bò lên từ đáy màn hình.
 *
 * Đèn nhỏ + mờ đọc ra là "ở xa", đèn to + rõ là "ở gần" — đó là cách duy nhất
 * tạo được chiều sâu khi tất cả đều nằm trên một mặt phẳng.
 */
const LAMPS = [
  [2, 104, 44, -12, 0.95, true],
  [7, 58, 62, -38, 0.6],
  [11, 132, 39, -25, 1, true],
  [16, 46, 71, -8, 0.5],
  [21, 84, 52, -44, 0.8],
  [25, 62, 66, -19, 0.58],
  [30, 44, 74, -55, 0.46],
  [34, 96, 47, -30, 0.85],
  [39, 50, 68, -6, 0.48],
  [43, 70, 58, -31, 0.62],
  [48, 40, 76, -50, 0.42],
  [52, 88, 51, -17, 0.72],
  [57, 54, 64, -22, 0.56],
  [61, 46, 72, -41, 0.44],
  [66, 92, 49, -40, 0.8],
  [70, 120, 42, -33, 1, true],
  [75, 64, 60, -14, 0.66],
  [79, 48, 70, -49, 0.48],
  [84, 108, 45, -21, 0.9],
  [88, 56, 66, -36, 0.58],
  [92, 110, 46, -27, 1, true],
  [97, 72, 56, -3, 0.7],
];

export function MidAutumnScene({ calm = false }) {
  return (
    <>
      <div className={`event-overlay${calm ? ' is-calm' : ''}`} aria-hidden="true">
        <LottiePiece src={`${A}/moon-girl.json`} className="ev-moon" still={calm} speed={0.55} />

        {/* Mây GIỮ NGUYÊN một khung hình: file gốc phóng to thu nhỏ theo vòng
            lặp, nhìn như đang thở. Mây thật thì trôi chứ không phập phồng — nên
            để CSS lo việc trôi, còn Lottie chỉ đóng vai bức vẽ. */}
        {[
          ['ev-cloud-1', 0.55],
          ['ev-cloud-2', 0.7],
          ['ev-cloud-3', 0.4],
        ].map(([cls, hold]) => (
          <LottiePiece
            key={cls}
            src={`${A}/cloud.json`}
            className={`ev-cloud ${cls}`}
            still
            rest={hold}
          />
        ))}

        {LAMPS.map(([x, w, dur, delay, op, live], i) => (
          <LottiePiece
            key={i}
            // Xen kẽ hai kiểu đèn cho đỡ lặp mặt.
            src={`${A}/${i % 3 === 1 ? 'lantern-small' : 'lantern'}.json`}
            className={`ev-lamp${live ? '' : ' is-held'}`}
            style={{
              '--x': `${x}%`,
              '--w': `${w}px`,
              '--dur': `${dur}s`,
              '--delay': `${delay}s`,
              '--op': op,
            }}
            still={calm || !live}
            rest={0.45}
            speed={0.6}
          />
        ))}

        <LottiePiece src={`${A}/rabbit.json`} className="ev-bunny" still={calm} speed={0.5} />
        <LottiePiece src={`${A}/rabbit-wave.json`} className="ev-bunny-wave" still={calm} speed={0.5} />

        {/* Cảnh sống ở nửa trên; nửa dưới tan vào đúng --bg phẳng, nơi có danh
            sách buổi, bảng từ vựng và ô nhập chính tả. */}
        <div className="ev-veil" />
      </div>

      {/* Tầng TRƯỚC nội dung. Tách hẳn khỏi lớp phủ vì lớp phủ ở z-index âm.
          z-index 20 là có tính toán: trên mọi nội dung trang, nhưng DƯỚI ngăn
          kéo (40) và hộp thoại (60) — một con thỏ chạy ngang qua đáp án bài
          nghe đang mở thì hết đường đọc. `pointer-events: none` để nó không
          nuốt mất cú bấm nào. */}
      <div className="ev-front" aria-hidden="true">
        <LottiePiece src={`${A}/rabbit-scooter.json`} className="ev-scooter" still={calm} />
      </div>
    </>
  );
}
