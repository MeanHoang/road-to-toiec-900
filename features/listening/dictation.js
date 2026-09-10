// Chấm bài chép chính tả, theo từng TỪ. Thuần hàm — màn hình chỉ việc hỏi.
//
// Vì sao chấm từng từ chứ không so cả dòng: chép sai một chữ mà bị báo "sai"
// gọn lỏn thì không học được gì. Người học cần biết sai CHỖ NÀO.
//
// Và vì sao đáp án lộ DẦN chứ không lộ hết: xem hết là mất luôn cơ hội tự nghe
// ra. Mỗi lần bấm chấm chỉ mở thêm đúng một từ — từ đầu tiên bị sai. Gõ đúng
// từ đó rồi chấm lại thì mở tiếp từ sau. Bí tới đâu gỡ tới đó, không mất cả câu.

// Đuôi .js là BẮT BUỘC, không phải thừa: file này còn được `node` chạy thẳng
// trong scripts/test-dictation.mjs, mà Node ESM không tự đoán đuôi như webpack.
import { CHOICES } from './rules.js';

/** Bỏ dấu câu ở hai đầu và chuẩn hoá nháy đơn. "keyboard." và "keyboard" là một. */
const clean = (w) =>
  w
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');

const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean);

/** Che một từ bằng dấu sao, giữ nguyên độ dài để lộ ra từ đó dài mấy chữ. */
const mask = (w) => '*'.repeat(w.length);

/**
 * Chấm một dòng.
 *
 * Trả về:
 *   status  'empty' chưa gõ gì | 'correct' đúng cả dòng | 'wrong'
 *   typed   từng từ người học gõ, kèm cờ ok — để gạch chân từ sai ngay trong ô
 *   reveal  đáp án lộ dần: các từ đã đúng + từ sai đầu tiên hiện chữ thật,
 *           phần còn lại che bằng sao
 *   firstWrong  vị trí từ sai đầu tiên, -1 nếu không có
 */
export function checkLine(typed, answer) {
  const got = words(typed);
  const want = words(answer);

  if (!want.length) return { status: 'empty', typed: [], reveal: [], firstWrong: -1 };
  if (!got.length) return { status: 'empty', typed: [], reveal: [], firstWrong: -1 };

  const marked = got.map((w, i) => ({ text: w, ok: clean(w) === clean(want[i] || '') }));

  // Thiếu từ cũng là sai, không chỉ gõ nhầm: gõ đúng 3/5 từ không phải là xong.
  let firstWrong = marked.findIndex((w) => !w.ok);
  if (firstWrong === -1 && got.length < want.length) firstWrong = got.length;
  if (firstWrong === -1 && got.length > want.length) firstWrong = want.length;

  const correct = firstWrong === -1;

  const reveal = want.map((w, i) => ({
    text: correct || i <= firstWrong ? w : mask(w),
    shown: correct || i <= firstWrong,
  }));

  return { status: correct ? 'correct' : 'wrong', typed: marked, reveal, firstWrong };
}

/** Đáp án đầy đủ của một dòng, cho nút "chịu thua". */
export const fullLine = (answer) => words(answer).map((w) => ({ text: w, shown: true }));

/**
 * Đáp án để chấm bài chép CHÍNH LÀ transcript — chép là chép lại đúng cái nghe
 * được, không phải điền vào chỗ trống.
 *
 * Transcript có hai dạng, cùng quy về một chuỗi:
 *   chuỗi        bài chép ba câu tả tranh
 *   {A,B,C,D}    bài trắc nghiệm, audio đọc liền cả bốn phương án
 *
 * Bỏ "Unit 3." ở đầu vì đó là số hiệu bài đọc lên trong audio — không ai đi
 * chép lại số hiệu, mà để đó thì gõ đúng cả câu vẫn bị báo sai. Cũng KHÔNG
 * chèn "(A)", "(B)" vào giữa: bắt gõ cả ký hiệu phương án là bắt chép thứ
 * không phải tiếng Anh.
 */
export function spokenText(transcript) {
  if (!transcript) return '';
  if (typeof transcript === 'string') return transcript.replace(/^\s*Unit\s*\d+\.?\s*/i, '').trim();
  return CHOICES.map((letter) => transcript[letter])
    .filter(Boolean)
    .join(' ')
    .trim();
}

/** Có transcript thì chấm được. Chưa chạy whisper thì chịu. */
export const canGrade = (item) => Boolean(item.transcript);
