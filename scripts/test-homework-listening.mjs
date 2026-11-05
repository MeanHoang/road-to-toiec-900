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
  assert.equal(usesDictation(set, false), false, 'ungraded choice homework must show answer buttons');
  assert.equal(set.hasKey, false);
  assert.equal(choicesOf(set).join(''), set.part === 1 ? 'ABCD' : 'ABC');
  assert.equal(hasPhoto(set), set.part === 1);
  for (const question of set.questions) {
    assert.ok(existsSync(`public${question.audio}`));
    assert.equal(Boolean(question.image), set.part === 1);
    if (question.image) assert.ok(existsSync(`public${question.image}`));
    assert.equal(question.answer, null, 'missing source keys must never become invented answers');
    assert.equal(countCorrect(set, { [question.id]: { picked: 'A', correct: null } }), 0);
  }
}
assert.equal(usesDictation({ hasKey: false }, false), true, 'legacy keyless sets keep dictation');
assert.equal(usesDictation({ hasKey: true, mode: 'choice' }, false), false);
assert.equal(usesDictation({ hasKey: true, mode: 'choice' }, true), true);
console.log('✓ Day 17: 4 ungraded sets, 62 questions, media and choice/dictation behavior');
