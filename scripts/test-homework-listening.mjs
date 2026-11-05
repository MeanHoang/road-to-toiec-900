import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { choicesOf, hasPhoto, usesDictation, countCorrect } from '../features/listening/rules.js';
import { assemble } from '../features/lesson/schema.js';

const read = (name) => JSON.parse(readFileSync(`content/day-17/${name}.json`, 'utf8'));
const day = assemble('day-17', { day: read('day'), listening: read('listening'), exercises: read('exercises') });
assert.ok(day.has('listening'));
assert.equal(day.listening.length, 4);
assert.deepEqual(day.listening.map((set) => set.questions.length), [6, 25, 6, 25]);
for (const set of day.listening) {
  assert.equal(usesDictation(set, false), false, 'choice homework must show answer buttons');
  assert.equal(set.hasKey, true);
  assert.equal(choicesOf(set).join(''), set.part === 1 ? 'ABCD' : 'ABC');
  assert.equal(hasPhoto(set), set.part === 1);
  for (const question of set.questions) {
    assert.ok(existsSync(`public${question.audio}`));
    assert.equal(Boolean(question.image), set.part === 1);
    if (question.image) assert.ok(existsSync(`public${question.image}`));
    assert.ok(set.choices.includes(question.answer), `${question.id}: missing or invalid answer`);
    assert.equal(question.source.answer, 'ai', 'derived answers must be labeled AI, not official');
    assert.equal(question.source.transcript, 'whisper');
    assert.ok(question.transcript && !question.transcript.raw);
    for (const letter of set.choices) assert.ok(question.transcript[letter]);
    if (set.part === 2) assert.ok(question.transcript.Q);
    assert.equal(countCorrect(set, { [question.id]: { picked: question.answer, correct: true } }), 1);
    assert.equal(countCorrect(set, { [question.id]: { picked: 'A', correct: null } }), 0);
  }
}
assert.equal(usesDictation({ hasKey: false }, false), true, 'legacy keyless sets keep dictation');
assert.equal(usesDictation({ hasKey: false, mode: 'choice' }, false), false, 'ungraded choice homework remains usable');
assert.equal(usesDictation({ hasKey: true, mode: 'choice' }, false), false);
assert.equal(usesDictation({ hasKey: true, mode: 'choice' }, true), true);
console.log('✓ Day 17: 4 AI-keyed sets, 62 answers and transcripts, media and choice/dictation behavior');

assert.ok(day.has('exercises'));
assert.deepEqual(day.exercises.map((set) => set.questions.length), [2, 2, 3, 3, 3, 4]);
const reading = day.exercises.flatMap((set) => set.questions);
assert.deepEqual(reading.map((q) => q.no), Array.from({ length: 17 }, (_, i) => i + 1));
assert.equal(new Set(reading.map((q) => q.id)).size, 17);
for (const set of day.exercises) {
  assert.equal(set.part, 7);
  assert.equal(set.kind, 'choice');
  assert.ok(set.sourcePages.length > 0);
  for (const q of set.questions) {
    assert.deepEqual(Object.keys(q.options), ['A', 'B', 'C', 'D']);
    assert.ok(q.options[q.answer] && q.explain && q.vi && q.passage.text);
    assert.equal(q.source.answer, 'ai');
    assert.equal(q.source.passage, 'pdf');
  }
}
const bus = day.exercises.at(-1);
assert.deepEqual(bus.sourcePages, [6, 7], 'Keep the advertisement and its questions across the page break');
assert.ok(existsSync(`public${bus.questions[0].passage.image}`));
assert.ok(bus.questions[0].passage.imageAlt);
assert.ok(bus.questions[0].passage.text.includes('September 1'));
console.log('✓ Day 17: 6 Part 7 advertisements, all 17 questions, AI provenance, translations, and original map');
