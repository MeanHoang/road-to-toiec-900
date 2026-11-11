import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { assemble } from '../features/lesson/schema.js';
import { translate } from '../features/language/translate.js';

const read = (name) => JSON.parse(readFileSync(`content/day-20/${name}.json`, 'utf8'));
const day = assemble('day-20', { day: read('day'), theory: read('theory'), vocabulary: read('vocabulary'), listening: read('listening'), exercises: read('exercises') });

assert.equal(day.no, 20); assert.equal(day.phase, 2); assert.equal(day.sourceDay, 11);
assert.deepEqual(day.collections, ['theory', 'vocabulary', 'listening', 'exercises']);

assert.deepEqual(day.listening.map((s) => s.questions.length), [6, 25, 20, 30, 7, 5]);
const ids = day.listening.flatMap((s) => s.questions.map((q) => q.id));
assert.equal(new Set(ids).size, ids.length);
for (const set of day.listening) {
  for (const q of set.questions) {
    assert.ok(existsSync(`public${q.audio}`), q.audio);
    if (set.mode === 'choice') {
      assert.ok(set.choices.includes(q.answer), q.id);
      assert.equal(q.source.answer, 'ai');
      if (set.part === 1) assert.ok(existsSync(`public${q.image}`));
      if (set.part === 2) assert.ok(q.transcript.Q, q.id);
      if (set.part === 3) for (const letter of set.choices) assert.ok(q.options[letter], q.id);
      else for (const letter of set.choices) assert.ok(q.transcript[letter], q.id);
    } else {
      assert.equal(typeof q.transcript, 'string');
    }
  }
}
// Lecture ETS clips use the class key, not whisper; clip 6 (questions 16–18) is not on Drive.
const ets = day.listening.find((s) => s.code === 'ets');
assert.deepEqual(ets.questions.map((q) => q.no), [1, 2, 3, 4, 5, 7, 8]);
assert.ok(ets.questions.every((q) => q.source.transcript === 'drive'));

assert.deepEqual(day.exercises.map((s) => s.questions.length), [2, 3, 3, 3, 4, 4]);
for (const q of day.exercises.flatMap((s) => s.questions)) {
  assert.ok(['A', 'B', 'C', 'D'].includes(q.answer)); assert.equal(q.source.answer, 'ai'); assert.ok(q.passage.text && q.vi && q.explain);
}

assert.equal(day.vocabulary.length, 24);
assert.equal(new Set(day.vocabulary.map((v) => v.word)).size, 24);
for (const v of day.vocabulary) for (const accent of ['uk', 'us']) assert.ok(existsSync(`public${v.voice[accent]}`));
assert.ok(existsSync('public/assets/day-20/flashcard.pdf'));

for (const label of [day.subtitle, ...day.theory.map((b) => b.title), ...day.theory.flatMap((b) => Object.keys(b.groups || {})),
  ...day.listening.map((s) => s.title), ...day.vocabulary.map((v) => v.group), ...day.exercises.map((s) => s.title)]) {
  for (const locale of ['vi', 'zh', 'ko']) assert.notEqual(translate(locale, label), label, `Missing ${locale}: ${label}`);
}
console.log('✓ Day 20: 93 listening questions (81 AI keys from Drive audio, 12 dictation clips), 19 Part 7 questions, 24 contract-law words with both voices');
