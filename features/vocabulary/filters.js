// Lọc và tìm trong bảng từ vựng. Thuần hàm nên đổi luật lọc không phải mở màn hình ra.

import { includesNorm, norm } from '@/shared/lib/text';

// 'star' nằm ngoài trục chưa học / đã biết, cố ý: từ gắn sao thường CHÍNH LÀ từ
// đã đánh dấu "đã biết" — nhớ nghĩa rồi nhưng nhìn mặt chữ vẫn ngờ ngợ.
export const FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unknown', label: 'Chưa học' },
  { key: 'known', label: 'Đã biết' },
  { key: 'star', label: '★ Gắn sao' },
];

export const isKnown = (vocabState, id) => vocabState[id] === 'known';

/** Những từ còn phải học — bộ thẻ, và danh sách chép sang skill sinh câu hỏi. */
export const notKnownYet = (vocabulary, vocabState) =>
  vocabulary.filter((v) => !isKnown(vocabState, v.id));

/** Tìm theo từ, nghĩa, hoặc phiên âm — gõ "keyboard" hay "kiː" đều ra. */
function matchesQuery(word, query) {
  if (!norm(query)) return true;
  return (
    includesNorm(word.word, query) ||
    includesNorm(word.meaningVi, query) ||
    includesNorm(word.ipa.uk || '', query) ||
    includesNorm(word.ipa.us || '', query)
  );
}

function matchesFilter(word, filter, vocabState, starState) {
  if (filter === 'all') return true;
  if (filter === 'star') return Boolean(starState[word.id]);
  return filter === (isKnown(vocabState, word.id) ? 'known' : 'unknown');
}

export function filterVocabulary(vocabulary, { vocabState, starState, query, filter }) {
  return vocabulary.filter(
    (v) => matchesFilter(v, filter, vocabState, starState) && matchesQuery(v, query),
  );
}

export const countStarred = (vocabulary, starState) =>
  vocabulary.filter((v) => starState[v.id]).length;
