// Lời thoại có hai dạng: một câu (bài chép chính tả), hoặc bốn phương án A-D
// (bài trắc nghiệm Part 1, audio đọc đúng bốn câu đó). Màn hình không nên phải
// biết mình đang cầm dạng nào.

import { CHOICES } from './rules';

/** Đưa cả hai dạng về một chuỗi đọc được. */
export function transcriptText(transcript) {
  if (!transcript) return '';
  if (typeof transcript === 'string') return transcript;

  return CHOICES.filter((letter) => transcript[letter])
    .map((letter) => `(${letter}) ${transcript[letter]}`)
    .join('   ');
}

/** Lời thoại của riêng một phương án, cho màn trắc nghiệm. */
export const choiceText = (transcript, letter) =>
  (typeof transcript === 'object' && transcript?.[letter]) || null;
