import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { lessonPhases, phaseOf } from '../features/lesson/phases.js';
import { hasPhoto } from '../features/listening/rules.js';

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const days = read('content/days.json').days.map((slug) => read(`content/${slug}/day.json`));
const before = JSON.stringify(days);
const phases = lessonPhases([...days].reverse());
assert.deepEqual(phases.map((group) => group.phase), [1, 2]);
assert.deepEqual(phases[0].days.map((day) => day.no), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.deepEqual(phases[1].days.map((day) => day.no), [10]);
assert.equal(JSON.stringify(days), before, 'Grouping must preserve lesson records and IDs');
assert.equal(phaseOf({ no: 1 }), 1, 'Older Firestore lessons default to Phase 1');
assert.deepEqual(lessonPhases([]), []);
assert.equal(hasPhoto({ part: 1, showPhoto: false }), false);
assert.equal(hasPhoto({ part: 1 }), true);
assert.equal(hasPhoto({ part: 2 }), false);

const vocab = read('content/day-10/vocabulary.json').items;
const listening = read('content/day-10/listening.json').items;
const exercises = read('content/day-10/exercises.json').items;
assert.equal(vocab.length, 24);
assert.equal(listening.flatMap((set) => set.questions).length, 48);
assert.equal(exercises.flatMap((set) => set.questions).length, 11);
const assets = new Set();
for (const word of vocab) assets.add(word.image);
for (const set of listening) {
  if (set.fullAudio) assets.add(set.fullAudio);
  for (const question of set.questions) {
    assert.ok(question.transcript, `${question.id}: missing dictation answer`);
    assets.add(question.audio);
    if (hasPhoto(set)) {
      assert.ok(question.image, `${question.id}: missing photograph`);
      assets.add(question.image);
    }
  }
}
for (const asset of assets) assert.ok(existsSync(`public${asset}`), `Missing asset ${asset}`);
assert.equal([...assets].filter((asset) => asset.endsWith('.mp3')).length, 50);
assert.equal([...assets].filter((asset) => asset.endsWith('.jpg')).length, 54);
for (const question of exercises.flatMap((set) => set.questions)) {
  assert.ok(question.passage?.text, `${question.id}: missing reading passage`);
  assert.ok(question.options[question.answer], `${question.id}: invalid answer`);
  assert.equal(question.source.answer, 'ai', 'Derived answers must not be labeled official');
}
console.log('✓ Phase 1/2, older cloud metadata, Day 10 content, all 104 assets and answer sources');
