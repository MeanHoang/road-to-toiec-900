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
assert.deepEqual(phases[1].days.map((day) => day.no), [10, 11]);
assert.equal(JSON.stringify(days), before, 'Grouping must preserve lesson records and IDs');
assert.equal(phaseOf({ no: 1 }), 1, 'Older Firestore lessons default to Phase 1');
assert.deepEqual(lessonPhases([]), []);
assert.equal(hasPhoto({ part: 1, showPhoto: false }), false);
assert.equal(hasPhoto({ part: 1 }), true);
assert.equal(hasPhoto({ part: 2 }), false);

const vocab = read('content/day-10/vocabulary.json').items;
const listening = read('content/day-10/listening.json').items;
const exercises = read('content/day-10/exercises.json').items;
assert.ok(vocab.length >= 24, 'Keep the 24 original words while allowing vocabulary additions');
assert.equal(new Set(vocab.map((word) => word.id)).size, vocab.length);
for (let i = 1; i <= 24; i++) assert.ok(vocab.some((word) => word.id === `d10-v${String(i).padStart(2, '0')}`), `Missing original word ${i}`);
assert.equal(listening.flatMap((set) => set.questions).length, 48);
assert.equal(exercises.flatMap((set) => set.questions).length, 11);
const assets = new Set();
for (const word of vocab) if (word.image) assets.add(word.image);
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

const nextVocab = read('content/day-11/vocabulary.json').items;
const nextListening = read('content/day-11/listening.json').items;
const nextReading = read('content/day-11/exercises.json').items;
assert.equal(nextVocab.length, 113);
assert.equal(nextVocab.filter((word) => word.source.word === 'quizlet').length, 18);
assert.equal(new Set(nextVocab.map((word) => word.word.toLowerCase())).size, nextVocab.length);
for (const word of nextVocab) {
  for (const accent of ['uk', 'us']) {
    assert.ok(word.ipa[accent], `${word.id}: missing ${accent} pronunciation`);
    assert.ok(existsSync(`public${word.voice[accent]}`), `${word.id}: missing ${accent} recording`);
  }
}
assert.equal(nextListening.flatMap((set) => set.questions).length, 47);
assert.equal(nextListening.filter(hasPhoto).flatMap((set) => set.questions).length, 30);
for (const set of nextListening) {
  assert.equal(set.hasKey, false, 'Previous homework keys must not become new official answers');
  if (set.fullAudio) assert.ok(existsSync(`public${set.fullAudio}`));
  for (const question of set.questions) {
    assert.equal(question.answer, null);
    assert.ok(question.transcript && !question.transcript.raw);
    assert.equal(question.source.transcript, 'whisper');
    assert.ok(existsSync(`public${question.audio}`));
    if (hasPhoto(set)) {
      assert.ok(existsSync(`public${question.image}`));
      assert.deepEqual(Object.keys(question.transcript), ['A', 'B', 'C', 'D']);
    }
  }
}
assert.equal(nextReading.flatMap((set) => set.questions).length, 10);
for (const question of nextReading.flatMap((set) => set.questions)) {
  assert.ok(question.passage.text && question.options[question.answer]);
  assert.equal(question.source.answer, 'ai');
}
console.log('✓ Day 11: 113 words, 226 voices, 47 dictations, 30 photos, 10 reading questions and honest draft sources');
