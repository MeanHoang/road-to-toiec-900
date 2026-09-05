// Sinh một lượt chơi. Thuần hàm, không React — đưa vào cùng bộ từ vựng thì
// chỉ khác nhau ở chỗ ngẫu nhiên, nên soi được bằng node khi nghi ngờ.

import { pick, shuffle } from '@/shared/lib/shuffle';

export const ROUND = 20;
const DISTRACTORS = 3;

/** Ba đáp án nhiễu bốc từ chính bộ từ vựng của buổi — luôn đúng nghĩa, không bịa. */
const distractorsFor = (vocab, word) => pick(vocab.filter((v) => v.id !== word.id), DISTRACTORS);

const optionsFor = (vocab, word) => shuffle([word, ...distractorsFor(vocab, word)]);

/** Cả hai chiều của một từ: nhìn tiếng Anh đoán nghĩa, và ngược lại. */
function bothDirections(vocab, word) {
  const ipa = [word.ipa.uk, word.ipa.us !== word.ipa.uk ? word.ipa.us : null]
    .filter(Boolean)
    .join(' · ');

  return [
    {
      key: `${word.id}-en-vi`,
      word,
      dir: 'en-vi',
      prompt: word.word,
      sub: ipa,
      options: optionsFor(vocab, word),
      label: (v) => v.meaningVi,
    },
    {
      key: `${word.id}-vi-en`,
      word,
      dir: 'vi-en',
      prompt: word.meaningVi,
      sub: null,
      options: optionsFor(vocab, word),
      label: (v) => v.word,
    },
  ];
}

/** Câu từ ngân hàng quiz.json: điền từ vào chỗ trống trong câu ví dụ. */
function clozeQuestions(vocab, bank) {
  return (bank || [])
    .filter((q) => vocab.some((v) => v.id === q.wordId))
    .map((q) => {
      const word = vocab.find((v) => v.id === q.wordId);
      return {
        key: q.id,
        word,
        dir: 'cloze',
        prompt: q.sentence,
        sub: q.hintVi || null,
        options: optionsFor(vocab, word),
        label: (v) => v.word,
      };
    });
}

/**
 * Một lượt = 20 câu bốc từ kho gồm cả hai chiều Anh→Việt và Việt→Anh trộn lẫn,
 * nên không đoán trước được câu sau hỏi chiều nào.
 */
export function buildRound(vocab, bank) {
  const pool = [...vocab.flatMap((word) => bothDirections(vocab, word)), ...clozeQuestions(vocab, bank)];
  return shuffle(pool).slice(0, ROUND);
}
