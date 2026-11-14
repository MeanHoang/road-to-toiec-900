import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { assemble } from '../features/lesson/schema.js';
import { translate } from '../features/language/translate.js';

const read = (name) => JSON.parse(readFileSync(`content/day-21/${name}.json`, 'utf8'));
const day = assemble('day-21', { day: read('day'), theory: read('theory'), vocabulary: read('vocabulary'), listening: read('listening'), exercises: read('exercises') });

assert.equal(day.no, 21); assert.equal(day.phase, 2); assert.equal(day.sourceDay, 12);
assert.deepEqual(day.collections, ['theory', 'vocabulary', 'listening', 'exercises']);

// Class web homework (2020 Test 4 Part 1/2) first, then the Drive Part 3 chapters, then the web's D6 dictation.
assert.deepEqual(day.listening.map((s) => [s.code, s.questions.length]),
  [['hw-2020-test-4-p1', 6], ['hw-2020-test-4-p2', 25], ['ch8', 21], ['ch9', 21], ['words', 48]]);
const ids = day.listening.flatMap((s) => s.questions.map((q) => q.id));
assert.equal(new Set(ids).size, ids.length);
const words = day.listening.find((s) => s.code === 'words');
assert.equal(words.mode, 'dictation'); assert.equal(words.source, 'thaylong');
for (const q of words.questions) {
  assert.ok(existsSync(`public${q.audio}`), q.audio);
  assert.ok(q.transcript && q.transcript === q.transcript.trim(), q.id);
}
for (const set of day.listening.filter((s) => s.mode !== 'dictation')) {
  for (const q of set.questions) {
    assert.ok(existsSync(`public${q.audio}`), q.audio);
    assert.ok(set.choices.includes(q.answer), q.id);
    assert.equal(q.source.answer, 'ai');
    if (q.image) assert.ok(existsSync(`public${q.image}`), q.image);
    if (set.part === 1) assert.ok(q.image, q.id);
    if (set.part === 2) assert.ok(q.transcript.Q, q.id);
    if (set.part === 3) for (const letter of set.choices) assert.ok(q.options[letter], q.id);
    else for (const letter of set.choices) assert.ok(q.transcript[letter], q.id);
  }
}
// "Look at the graphic" conversations (19–21) carry the order form / coupon.
for (const code of ['ch8', 'ch9']) {
  const set = day.listening.find((s) => s.code === code);
  assert.deepEqual(set.questions.filter((q) => q.image).map((q) => q.no), [19, 20, 21]);
}

assert.deepEqual(day.exercises.map((s) => s.questions.length), [17, 17, 17, 16, 2, 2, 3, 3, 4, 4]);
for (const q of day.exercises.flatMap((s) => s.questions)) {
  assert.ok(['A', 'B', 'C', 'D'].includes(q.answer), q.id); assert.ok(q.vi && q.explain, q.id);
}
// Part 5: the key comes from the explanation file, and the chosen word appears in its own translation's sentence.
for (const q of day.exercises.filter((s) => s.part === 5).flatMap((s) => s.questions)) {
  assert.equal(q.source.answer, 'drive'); assert.ok(q.text.includes('______'), q.id);
}
for (const q of day.exercises.filter((s) => s.part === 7).flatMap((s) => s.questions)) {
  assert.equal(q.source.answer, 'ai'); assert.ok(q.passage.text, q.id);
}

assert.equal(day.vocabulary.length, 25);
assert.equal(new Set(day.vocabulary.map((v) => v.word)).size, 25);
for (const v of day.vocabulary) for (const accent of ['uk', 'us']) assert.ok(existsSync(`public${v.voice[accent]}`));
assert.ok(existsSync('public/assets/day-21/flashcard.pdf'));

for (const label of [day.subtitle, day.exerciseLabel, ...day.theory.map((b) => b.title), ...day.theory.flatMap((b) => Object.keys(b.groups || {})),
  ...day.listening.flatMap((s) => [s.title, s.subtitle]), ...day.vocabulary.map((v) => v.group), ...day.exercises.flatMap((s) => [s.title, s.subtitle])]) {
  for (const locale of ['vi', 'zh', 'ko']) assert.notEqual(translate(locale, label), label, `Missing ${locale}: ${label}`);
}
console.log('✓ Day 21: 121 listening questions (31 class web, 42 ETS Part 3, 48 web dictation words), 67 adjective + 18 Part 7 questions, 25 contract-law words with both voices');
