import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assemble } from '../features/lesson/schema.js';
import { translate } from '../features/language/translate.js';
import { mediaChecker } from './lib/media.mjs';

const hasMedia = await mediaChecker();

const read = (name) => JSON.parse(readFileSync(`content/day-23/${name}.json`, 'utf8'));
const day = assemble('day-23', { day: read('day'), theory: read('theory'), vocabulary: read('vocabulary'), listening: read('listening'), exercises: read('exercises') });

assert.equal(day.no, 23); assert.equal(day.phase, 2); assert.equal(day.sourceDay, 14);
assert.deepEqual(day.collections, ['theory', 'vocabulary', 'listening', 'exercises']);

// Class web homework first (2023 Test 7 Part 1/2, 2023 Test 6 and 2020 Test 1 Part 3, WORD - DAY 7 dictation),
// then Drive's Test 4 Part 1/2, Test 3/4 Part 3 homework and the lecture audio.
assert.deepEqual(day.listening.map((s) => [s.code, s.questions.length]),
  [['hw-2023-test-7-p1', 6], ['hw-2023-test-7-p2', 25], ['hw-2023-test-6-p3', 39], ['hw-2020-test-1-p3', 39], ['words', 50],
    ['t4-p1', 6], ['t4-p2', 25], ['t3-p3', 39], ['t4-p3', 39], ['ets', 8], ['class', 4]]);
const EXAMS = { 'hw-2023-test-7-p1': 'e8700c88-dc25-4fa6-b860-058de6cd170f', 'hw-2023-test-7-p2': 'e8700c88-dc25-4fa6-b860-058de6cd170f',
  'hw-2023-test-6-p3': '7d8c2a08-4724-4975-b665-7eb652001346', 'hw-2020-test-1-p3': '80f893b8-1f32-4682-93d1-675a2de0c8e5' };
for (const set of day.listening.slice(0, 5)) {
  assert.equal(set.source, 'thaylong'); assert.equal(set.sourceExamId, EXAMS[set.code]);
  for (const q of set.questions) assert.equal(q.source.audio, 'thaylong', q.id);
}
const ids = day.listening.flatMap((s) => s.questions.map((q) => q.id));
assert.equal(new Set(ids).size, ids.length);
const audio = day.listening.filter((s) => s.part === 3 && s.mode === 'choice').flatMap((s) => s.questions.map((q) => q.audio));
for (const set of day.listening.filter((s) => s.part === 3 && s.mode === 'choice')) {
  // Each 3-question conversation has its own clip (2020 Test 1 numbers its groups 0 on the site).
  assert.equal(new Set(set.questions.map((q) => q.audio)).size, 13, set.code);
}
assert.equal(new Set(audio).size, 52);
for (const set of day.listening) {
  for (const q of set.questions) {
    assert.ok(hasMedia(q.audio), q.audio);
    if (q.image) assert.ok(hasMedia(q.image), q.image);
    if (set.mode === 'dictation') { assert.ok(q.transcript, q.id); continue; }
    assert.ok(set.choices.includes(q.answer), q.id); assert.equal(q.source.answer, 'ai', q.id);
    if (set.part === 1) assert.ok(q.image, q.id);
    if (set.part === 2) assert.ok(q.transcript.Q, q.id);
    if (set.part === 3) {
      for (const letter of set.choices) assert.ok(q.options[letter], q.id);
      assert.equal(Boolean(q.image), /graphic/i.test(q.question), q.id);
    } else for (const letter of set.choices) assert.ok(q.transcript[letter], q.id);
  }
}
const answers = (code) => day.listening.find((s) => s.code === code).questions.map((q) => q.answer).join('');
assert.equal(answers('t4-p2'), 'ACBCACABAACCABAABCBBACACB');
assert.equal(answers('hw-2020-test-1-p3').slice(30), 'CDACBDABD');
const words = day.listening.find((s) => s.code === 'words').questions;
assert.equal(words[17].transcript, 'hire'); assert.ok(words.every((q) => q.transcriptVi), 'dictation meanings');
for (const code of ['ets', 'class']) {
  for (const q of day.listening.find((s) => s.code === code).questions) {
    assert.equal(q.source.transcript, 'drive'); assert.ok(/^(W|M): /m.test(q.transcript), q.id);
  }
}

assert.deepEqual(day.exercises.map((s) => s.questions.length), [3, 3, 4, 3, 4, 4]);
assert.equal(day.exercises.flatMap((s) => s.questions).map((q) => q.answer).join(''), 'ABAABCDCBBBDABDCCDDBC');
for (const q of day.exercises.flatMap((s) => s.questions)) {
  assert.ok(['A', 'B', 'C', 'D'].includes(q.answer), q.id); assert.ok(q.vi && q.explain && q.passage.text, q.id);
}

assert.equal(day.vocabulary.length, 26);
assert.equal(new Set(day.vocabulary.map((v) => v.word)).size, 26);
for (const v of day.vocabulary) for (const accent of ['uk', 'us']) assert.ok(hasMedia(v.voice[accent]));
assert.ok(hasMedia('/assets/day-23/flashcard.pdf'));

for (const label of [day.subtitle, day.exerciseLabel, ...day.theory.map((b) => b.title), ...day.theory.flatMap((b) => Object.keys(b.groups || {})),
  ...day.listening.flatMap((s) => [s.title, s.subtitle]), ...day.vocabulary.map((v) => v.group), ...day.exercises.flatMap((s) => [s.title, s.subtitle]),
  ...day.theory.flatMap((b) => (b.links || []).map((l) => l.label))]) {
  for (const locale of ['vi', 'zh', 'ko']) assert.notEqual(translate(locale, label), label, `Missing ${locale}: ${label}`);
}
console.log('✓ Day 23: 280 listening questions (159 web homework incl. 50 dictation words, 109 Drive homework, 12 lecture clips), 21 Part 7 questions, 26 shopping words with both voices');
