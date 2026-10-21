// Listening/spelling rules, independent of React and storage.
import { shuffle } from '../../shared/lib/shuffle.js';

export const MODES = [
  { id: 'spell', title: 'Listen & type', description: 'Let your ears lead. Write what you hear.', tag: 'Start here', tone: 'forest' },
  { id: 'match', title: 'Match the cards', description: 'Find the word. Match its meaning. Clear the board.', tag: 'Memory', tone: 'sky' },
  { id: 'meaning', title: 'Hear the meaning', description: 'Listen to a word. Find its meaning.', tag: 'Listening', tone: 'lilac' },
  { id: 'gaps', title: 'Missing letters', description: 'A little help with the tricky letters.', tag: 'Spelling', tone: 'mint' },
  { id: 'phrases', title: 'Phrase practice', description: 'Remember the words that belong together.', tag: 'Word pairs', tone: 'peach' },
  { id: 'sprint', title: '60-second sprint', description: 'Find your rhythm. Beat your own score.', tag: 'Challenge', tone: 'lemon' },
];

export function normalizeAnswer(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’‘]/g, "'").replace(/[‐‑–—]/g, '-').trim().replace(/\s+/g, ' ');
}

// Labels containing alternatives, grammar notation or verb tables aren't a single
// unambiguous listening prompt. Keep them in the original quiz/flashcards.
export function practiceWords(vocab, mode = 'spell') {
  return vocab.filter((word) => {
    const text = word.word?.trim();
    return text && /^[a-zà-ž]+(?:[ '-][a-zà-ž]+)*$/i.test(text)
      && Boolean(word.voice?.us || word.voice?.uk)
      && (mode !== 'phrases' || text.includes(' '));
  });
}

export function selectWords(vocab, progress, filter) {
  if (filter === 'starred') return vocab.filter((w) => progress.star?.[w.id]);
  if (filter === 'review') return vocab.filter((w) => progress.vocab?.[w.id] === 'unknown');
  return vocab;
}

export function makeRound(vocab, mode, limit = 10) {
  const eligible = practiceWords(vocab, mode);
  return shuffle(eligible).slice(0, mode === 'sprint' ? eligible.length : limit).map((word) => {
    // Don't show two identical meanings as different answers.
    const seen = new Set([normalizeAnswer(word.meaningVi)]);
    const others = shuffle(eligible.filter((w) => w.id !== word.id)).filter((w) => {
      const key = normalizeAnswer(w.meaningVi);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 3);
    return { word, options: shuffle([word, ...others]), mask: makeMask(word.word) };
  });
}

export function makeMask(text) {
  let letter = 0;
  return [...text].map((char) => {
    if (!/[a-zà-ž]/i.test(char)) return char;
    const index = letter++;
    return index % 3 === 1 || index % 3 === 2 ? '_' : char;
  }).join('');
}

export function fillMask(mask, typed) {
  const letters = [...typed];
  const filled = [...mask].map((char) => char === '_' ? (letters.shift() || '') : char).join('');
  return filled + letters.join('');
}

// Levenshtein alignment shows omissions, insertions and replacements separately.
// Typing "qualfication" highlights just the missing i, not the whole suffix.
export function spellingDiff(typed, answer) {
  const a = [...normalizeAnswer(typed)], b = [...normalizeAnswer(answer)];
  const table = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => i ? (j ? 0 : i) : j));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    table[i][j] = Math.min(table[i - 1][j] + 1, table[i][j - 1] + 1, table[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  const diff = [];
  let i = a.length, j = b.length;
  while (i || j) {
    if (i && j && table[i][j] === table[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      diff.unshift({ typed: a[--i], answer: b[--j], kind: a[i] === b[j] ? 'same' : 'replace' });
    } else if (j && table[i][j] === table[i][j - 1] + 1) {
      diff.unshift({ typed: '', answer: b[--j], kind: 'missing' });
    } else {
      diff.unshift({ typed: a[--i], answer: '', kind: 'extra' });
    }
  }
  return diff;
}

export function makeMatchBoard(vocabulary, count = 6) {
  const words = new Set(), meanings = new Set();
  const selected = shuffle(practiceWords(vocabulary)).filter((word) => {
    const term = normalizeAnswer(word.word), meaning = normalizeAnswer(word.meaningVi);
    if (words.has(term) || meanings.has(meaning)) return false;
    words.add(term); meanings.add(meaning); return true;
  }).slice(0, count);
  return shuffle(selected.flatMap((word) => [
    { id: `${word.id}-en`, side: 'en', word, label: word.word },
    { id: `${word.id}-vi`, side: 'vi', word, label: word.meaningVi },
  ]));
}

export const matchPair = (first, second) => Boolean(first && second && first.side !== second.side && first.word.id === second.word.id);
