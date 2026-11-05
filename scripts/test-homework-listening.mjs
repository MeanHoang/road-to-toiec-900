import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { choicesOf, hasPhoto, usesDictation, countCorrect } from '../features/listening/rules.js';
import { assemble } from '../features/lesson/schema.js';

const read = (name) => JSON.parse(readFileSync(`content/day-17/${name}.json`, 'utf8'));
const day = assemble('day-17', { day: read('day'), listening: read('listening') });
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
