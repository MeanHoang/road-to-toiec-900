import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assemble } from '../features/lesson/schema.js';
import { translate } from '../features/language/translate.js';
import { mediaChecker } from './lib/media.mjs';

const hasMedia = await mediaChecker();

const read = (name) => JSON.parse(readFileSync(`content/day-25/${name}.json`, 'utf8'));
const day = assemble('day-25', { day: read('day'), theory: read('theory'), vocabulary: read('vocabulary'), listening: read('listening'), exercises: read('exercises') });

assert.equal(day.no, 25); assert.equal(day.phase, 2); assert.equal(day.sourceDay, 16);
assert.deepEqual(day.collections, ['theory', 'vocabulary', 'listening', 'exercises']);

// Class web homework first (2024 Test 6 Part 1/2/3, 2020 Test 4 Part 3, WORD - DAY 3 dictation),
// then Drive's Test 5 Part 1/2, YBM Test 1/2 Part 3 and the Chapter 6 lecture audio.
assert.deepEqual(day.listening.map((s) => [s.code, s.questions.length]),
  [['hw-2024-test-6-p1', 6], ['hw-2024-test-6-p2', 25], ['hw-2024-test-6-p3', 39], ['hw-2020-test-4-p3', 39], ['words', 49],
    ['t5-p1', 6], ['t5-p2', 25], ['ybm1-p3', 39], ['ybm2-p3', 39], ['ets', 8], ['class', 9]]);
const EXAMS = { 'hw-2024-test-6-p1': 'ce736b28-62b6-4877-b761-335528119987', 'hw-2024-test-6-p2': 'ce736b28-62b6-4877-b761-335528119987',
  'hw-2024-test-6-p3': 'ce736b28-62b6-4877-b761-335528119987', 'hw-2020-test-4-p3': '58cebf4a-9172-4a2f-ab84-43d858f26240' };
for (const set of day.listening.slice(0, 5)) {
  assert.equal(set.source, 'thaylong'); assert.equal(set.sourceExamId, EXAMS[set.code]);
  for (const q of set.questions) assert.equal(q.source.audio, 'thaylong', q.id);
}
const ids = day.listening.flatMap((s) => s.questions.map((q) => q.id));
assert.equal(new Set(ids).size, ids.length);
for (const set of day.listening.filter((s) => s.part === 3 && s.mode === 'choice')) {
  assert.equal(new Set(set.questions.map((q) => q.audio)).size, 13, set.code);
}
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
assert.equal(answers('hw-2024-test-6-p3').slice(30), 'ADBADCCBB');
assert.equal(answers('hw-2020-test-4-p3').slice(30), 'BACCBDADC');
const words = day.listening.find((s) => s.code === 'words').questions;
assert.equal(words[41].transcript, 'ship'); assert.ok(words.every((q) => q.transcriptVi || q.no === 19), 'dictation meanings');
for (const code of ['ets', 'class']) {
  for (const q of day.listening.find((s) => s.code === code).questions) {
    assert.equal(q.source.transcript, 'drive'); assert.ok(/^(W|M): /m.test(q.transcript), q.id);
  }
}

assert.deepEqual(day.exercises.map((s) => s.questions.length), [2, 5, 5, 5, 5, 5]);
assert.equal(day.exercises.flatMap((s) => s.questions).map((q) => q.answer).join(''), 'BABCDDBBDACCBDCADCABDCBDCBA');
for (const q of day.exercises.flatMap((s) => s.questions)) {
  assert.ok(Object.keys(q.options).includes(q.answer), q.id); assert.ok(q.vi && q.explain && q.passage.text, q.id);
}

assert.equal(day.vocabulary.length, 26);
assert.equal(new Set(day.vocabulary.map((v) => v.word)).size, 26);
for (const v of day.vocabulary) for (const accent of ['uk', 'us']) assert.ok(hasMedia(v.voice[accent]));
assert.ok(hasMedia('/assets/day-25/flashcard.pdf'));

for (const label of [day.subtitle, day.exerciseLabel, ...day.theory.map((b) => b.title), ...day.theory.flatMap((b) => Object.keys(b.groups || {})),
  ...day.listening.flatMap((s) => [s.title, s.subtitle]), ...day.vocabulary.map((v) => v.group), ...day.exercises.flatMap((s) => [s.title, s.subtitle]),
  ...day.theory.flatMap((b) => (b.links || []).map((l) => l.label))]) {
  for (const locale of ['vi', 'zh', 'ko']) assert.notEqual(translate(locale, label), label, `Missing ${locale}: ${label}`);
}
console.log('✓ Day 25: 284 listening questions (158 web homework incl. 49 dictation words, 109 Drive homework, 17 lecture clips), 27 Part 7 questions, 26 travel words with both voices');
