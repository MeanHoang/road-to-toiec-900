import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assemble } from '../features/lesson/schema.js';
import { translate } from '../features/language/translate.js';
import { mediaChecker } from './lib/media.mjs';

const hasMedia = await mediaChecker();

const read = (name) => JSON.parse(readFileSync(`content/day-20/${name}.json`, 'utf8'));
const day = assemble('day-20', { day: read('day'), theory: read('theory'), vocabulary: read('vocabulary'), listening: read('listening'), exercises: read('exercises') });

assert.equal(day.no, 20); assert.equal(day.phase, 2); assert.equal(day.sourceDay, 11);
assert.deepEqual(day.collections, ['theory', 'vocabulary', 'listening', 'exercises']);

assert.deepEqual(day.listening.map((s) => s.questions.length), [6, 25, 6, 25, 20, 30, 7, 5]);
const ids = day.listening.flatMap((s) => s.questions.map((q) => q.id));
assert.equal(new Set(ids).size, ids.length);
for (const set of day.listening) {
  for (const q of set.questions) {
    assert.ok(hasMedia(q.audio), q.audio);
    if (set.mode === 'choice') {
      assert.ok(set.choices.includes(q.answer), q.id);
      assert.equal(q.source.answer, 'ai');
      if (set.part === 1) assert.ok(hasMedia(q.image));
      if (set.part === 2) assert.ok(q.transcript.Q, q.id);
      if (set.part === 3) for (const letter of set.choices) assert.ok(q.options[letter], q.id);
      else for (const letter of set.choices) assert.ok(q.transcript[letter], q.id);
    } else {
      assert.equal(typeof q.transcript, 'string');
    }
  }
}
// Class web homework (study.thaylongtoeic.com, exam 2020 Test 3) comes first and is a different test from Drive's Test 3.
assert.deepEqual(day.listening.slice(0, 2).map((s) => s.code), ['hw-2020-test-3-p1', 'hw-2020-test-3-p2']);
assert.ok(day.listening.slice(0, 2).every((s) => s.source === 'thaylong'));
assert.notEqual(day.listening[1].questions[0].transcript.Q, day.listening[3].questions[0].transcript.Q);
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
for (const v of day.vocabulary) for (const accent of ['uk', 'us']) assert.ok(hasMedia(v.voice[accent]));
assert.ok(hasMedia('/assets/day-20/flashcard.pdf'));

for (const label of [day.subtitle, ...day.theory.map((b) => b.title), ...day.theory.flatMap((b) => Object.keys(b.groups || {})),
  ...day.listening.map((s) => s.title), ...day.vocabulary.map((v) => v.group), ...day.exercises.map((s) => s.title)]) {
  for (const locale of ['vi', 'zh', 'ko']) assert.notEqual(translate(locale, label), label, `Missing ${locale}: ${label}`);
}
console.log('✓ Day 20: 124 listening questions (31 from the class web, 81 from Drive, 12 dictation clips), 19 Part 7 questions, 24 contract-law words with both voices');
