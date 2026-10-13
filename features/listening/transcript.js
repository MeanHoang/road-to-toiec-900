// Lời thoại có hai dạng: một câu (bài chép chính tả), hoặc các phương án A-D
// (bài trắc nghiệm, audio đọc đúng các câu đó). Part 2 còn có thêm `Q` — câu
// hỏi audio đọc trước ba phương án. Màn hình không nên phải biết mình đang cầm
// dạng nào.

import { CHOICES } from './rules';

/** Đưa cả hai dạng về một chuỗi đọc được. */
export function transcriptText(transcript) {
  if (!transcript) return '';
  if (typeof transcript === 'string') return transcript;

  const options = CHOICES.filter((letter) => transcript[letter])
    .map((letter) => `(${letter}) ${transcript[letter]}`)
    .join('   ');
  return transcript.Q ? `${transcript.Q}   ${options}` : options;
}

/** Lời thoại của riêng một phương án, cho màn trắc nghiệm. */
export const choiceText = (transcript, letter) =>
  (typeof transcript === 'object' && transcript?.[letter]) || null;
