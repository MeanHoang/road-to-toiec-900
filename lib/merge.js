// LUẬT GỘP hai bản tiến độ. Không import gì cả — cố ý, để `node` chạy thẳng
// được file này trong scripts/test-merge.mjs mà không phải dựng cả bundler.
//
// Đây là chỗ dễ mất dữ liệu nhất trong app, nên nó có test riêng:
//   npm run test:merge

export const EMPTY = { vocab: {}, star: {}, listen: {}, trans: {}, picture: {}, dictation: {} };
const BUCKETS = ['vocab', 'star', 'listen', 'trans', 'picture', 'dictation'];

/**
 * Gộp hai bản tiến độ của CÙNG một buổi học.
 *
 * Trước đây chỗ này là "bản nào updatedAt mới hơn thì thắng cả document", nên
 * học day-1 ở laptop rồi mở desktop (bản cũ hơn) là desktop đè mất laptop. Giờ
 * gộp theo từng id:
 *
 *   - id chỉ có ở một bên              → giữ
 *   - id có ở cả hai bên               → lấy của bản updatedAt mới hơn
 *   - riêng cái ĐÃ ĐẠT thì dính luôn   → listen.correct, trans.done/correct
 *     không bao giờ bị một bản cũ hơn gỡ xuống, và listen.tries lấy max
 *
 * `star` cố ý KHÔNG dính: nó là công tắc do người học tự bật tắt, gỡ sao ở máy
 * này thì máy kia cũng phải mất sao, nên bản mới hơn thắng là đúng.
 *
 * `null` là bia mộ (xem resetVocab): nó là một giá trị hợp lệ, bản mới hơn ghi
 * `null` đè lên là xóa thật, nhờ vậy bấm "học lại từ đầu" mới đồng bộ được.
 *
 * Hàm này ĐỐI XỨNG: mergeDay(a, b) cho kết quả y hệt mergeDay(b, a).
 */
export function mergeDay(a = EMPTY, b = EMPTY) {
  const win = (b.updatedAt || '') > (a.updatedAt || '') ? b : a;
  const lose = win === a ? b : a;

  const out = {};
  for (const bucket of BUCKETS) {
    const merged = { ...(lose[bucket] || {}), ...(win[bucket] || {}) };

    if (bucket === 'listen' || bucket === 'trans') {
      for (const id of Object.keys(merged)) {
        const x = a[bucket]?.[id];
        const y = b[bucket]?.[id];
        if (!x || !y || !merged[id]) continue;

        merged[id] =
          bucket === 'listen'
            ? {
                ...merged[id],
                correct: Boolean(x.correct || y.correct),
                tries: Math.max(x.tries || 0, y.tries || 0),
              }
            : {
                ...merged[id],
                done: Boolean(x.done || y.done),
                correct: Boolean(x.correct || y.correct),
              };
      }
    }

    out[bucket] = merged;
  }

  out.updatedAt = win.updatedAt || lose.updatedAt || new Date().toISOString();
  return out;
}
