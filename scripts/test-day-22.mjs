import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { assemble } from '../features/lesson/schema.js';
import { translate } from '../features/language/translate.js';

const read = (name) => JSON.parse(readFileSync(`content/day-22/${name}.json`, 'utf8'));
const day = assemble('day-22', { day: read('day'), theory: read('theory'), vocabulary: read('vocabulary'), listening: read('listening'), exercises: read('exercises') });

assert.equal(day.no, 22); assert.equal(day.phase, 2); assert.equal(day.sourceDay, 13);
assert.deepEqual(day.collections, ['theory', 'vocabulary', 'listening', 'exercises']);

// Test 2 Part 1/2, Test 4/5 Part 3 homework, then the Chapter 4 lecture audio.
assert.deepEqual(day.listening.map((s) => [s.code, s.questions.length]),
  [['t2-p1', 6], ['t2-p2', 25], ['t4-p3', 30], ['t5-p3', 27], ['ets', 24], ['class', 6]]);
const ids = day.listening.flatMap((s) => s.questions.map((q) => q.id));
assert.equal(new Set(ids).size, ids.length);
for (const set of day.listening) {
  for (const q of set.questions) {
    assert.ok(existsSync(`public${q.audio}`), q.audio);
    assert.ok(set.choices.includes(q.answer), q.id);
    if (q.image) assert.ok(existsSync(`public${q.image}`), q.image);
    if (set.part === 1) assert.ok(q.image, q.id);
    if (set.part === 2) assert.ok(q.transcript.Q, q.id);
    if (set.part === 3) for (const letter of set.choices) assert.ok(q.options[letter], q.id);
    else for (const letter of set.choices) assert.ok(q.transcript[letter], q.id);
  }
}
// Only the lecture ETS test has an official key; its conversations come from the class transcript.
const ets = day.listening.find((s) => s.code === 'ets');
assert.equal(ets.questions.map((q) => q.answer).join(''), 'ACABCAACCCADCABDCBDCBCBC');
for (const set of day.listening) for (const q of set.questions) assert.equal(q.source.answer, set.code === 'ets' ? 'drive' : 'ai', q.id);
for (const code of ['ets', 'class']) {
  for (const q of day.listening.find((s) => s.code === code).questions) {
    assert.equal(q.source.transcript, 'drive'); assert.ok(/^(W|M\d?): /m.test(q.transcript), q.id);
  }
}

assert.deepEqual(day.exercises.map((s) => s.questions.length), [2, 4, 3, 4, 3, 4]);
for (const q of day.exercises.flatMap((s) => s.questions)) {
  assert.ok(['A', 'B', 'C', 'D'].includes(q.answer), q.id); assert.ok(q.vi && q.explain && q.passage.text, q.id);
  assert.equal(q.source.answer, 'ai');
}

assert.equal(day.vocabulary.length, 24);
assert.equal(new Set(day.vocabulary.map((v) => v.word)).size, 24);
for (const v of day.vocabulary) for (const accent of ['uk', 'us']) assert.ok(existsSync(`public${v.voice[accent]}`));
assert.ok(existsSync('public/assets/day-22/flashcard.pdf'));

for (const label of [day.subtitle, day.exerciseLabel, ...day.theory.map((b) => b.title), ...day.theory.flatMap((b) => Object.keys(b.groups || {})),
  ...day.listening.flatMap((s) => [s.title, s.subtitle]), ...day.vocabulary.map((v) => v.group), ...day.exercises.flatMap((s) => [s.title, s.subtitle]),
  ...day.theory.flatMap((b) => (b.links || []).map((l) => l.label))]) {
  for (const locale of ['vi', 'zh', 'ko']) assert.notEqual(translate(locale, label), label, `Missing ${locale}: ${label}`);
}
console.log('✓ Day 22: 118 listening questions (31 Test 2, 57 Part 3 homework, 30 lecture), 20 Part 7 questions, 24 shopping words with both voices');
