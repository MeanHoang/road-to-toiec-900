import assert from 'node:assert/strict';
import { mergeVocabularyAudio } from '../features/lesson/recordings.js';
import { readFileSync } from 'node:fs';
import { makeMatchBoard, matchPair, normalizeAnswer, spellingDiff, makeMask, fillMask, practiceWords, selectWords, makeRound } from '../features/game/practice.js';

assert.equal(normalizeAnswer('  RÉSUMÉ  '), 'resume');
assert.equal(normalizeAnswer(' Health   insurance '), 'health insurance');
assert.equal(normalizeAnswer('long‑sleeved'), 'long-sleeved');
const omission = spellingDiff('qualfication', 'qualification');
assert.deepEqual(omission.filter(p => p.kind !== 'same'), [{typed:'',answer:'i',kind:'missing'}]);
assert.equal(spellingDiff('efffort', 'effort').filter(p => p.kind === 'extra').length, 1);
assert.equal(spellingDiff('wark', 'work').filter(p => p.kind === 'replace').length, 1);
assert.equal(spellingDiff('', 'word').filter(p => p.kind === 'missing').length, 4);
assert.equal(spellingDiff('sale', 'sale').every(p => p.kind === 'same'), true);
for (const answer of ['qualification','health insurance','résumé','long-sleeved']) {
  const mask = makeMask(answer);
  const missing = [...answer].filter((char,i) => mask[i] === '_').join('');
  assert.ok(mask.includes('_'));
  assert.equal(fillMask(mask, missing), answer);
  assert.notEqual(fillMask(mask, missing + 'x'), answer, 'Extra letters must not silently pass');
}
const vocab = JSON.parse(readFileSync('content/day-10/vocabulary.json')).items;
const eligible = practiceWords(vocab);
assert.equal(eligible.length, vocab.length);
assert.ok(practiceWords(vocab,'phrases').length > 5);
assert.ok(practiceWords(vocab,'phrases').every(w => w.word.includes(' ')));
assert.deepEqual(practiceWords([{id:'x',word:'word'}]), [], 'No silent or browser-TTS listening questions');
for (const word of ['lab = laboratory','several + Np','hang - hung - hung','word (n)']) {
  assert.equal(practiceWords([{word,voice:{us:'/sound.mp3'}}]).length,0);
}
const snapshot = JSON.stringify(vocab);
for (const mode of ['spell','meaning','gaps','phrases','sprint']) {
  const round = makeRound(vocab,mode);
  assert.equal(new Set(round.map(q => q.word.id)).size, round.length);
  assert.ok(round.length <= (mode === 'sprint' ? vocab.length : 10));
  for (const q of round) {
    assert.ok(q.options.some(o=>o.id===q.word.id));
    assert.equal(new Set(q.options.map(o=>normalizeAnswer(o.meaningVi))).size,q.options.length);
    assert.ok(q.options.every(o=>vocab.some(w=>w.id===o.id)));
  }
}
assert.equal(JSON.stringify(vocab),snapshot);
assert.equal(makeRound([vocab[0]],'spell').length,1);
assert.equal(makeRound([],'spell').length,0);
assert.deepEqual(selectWords(vocab,{star:{[vocab[0].id]:true}},'starred'),[vocab[0]]);
assert.deepEqual(selectWords(vocab,{vocab:{[vocab[1].id]:'unknown'}},'review'),[vocab[1]]);
assert.deepEqual(selectWords(vocab,{},'starred'),[]);
console.log('✓ Listening pools, audio eligibility, phrase filtering, spelling edits, missing-letter grading, filters, and immutable rounds');

const remote = [{id:'a',word:'word',voice:{us:'/old.mp3'},meaningVi:'nghĩa'}];
const neural = [{id:'a',word:'word',voice:{us:'/assets/day-1/voice-neural/a-us.mp3',uk:'/new-uk.mp3'}}];
assert.equal(mergeVocabularyAudio(remote, neural)[0].voice.us, neural[0].voice.us);
assert.equal(mergeVocabularyAudio(remote, [{...neural[0],word:'other'}])[0].voice.us, '/old.mp3');
assert.equal(remote[0].voice.us, '/old.mp3', 'Merging audio never mutates cloud content');

const board = makeMatchBoard(vocab);
assert.equal(board.length, 12);
assert.equal(new Set(board.map(card=>card.id)).size, 12);
for (const card of board) {
  const pair = board.find(other=>other.word.id===card.word.id && other.side!==card.side);
  assert.ok(matchPair(card,pair));
  assert.equal(matchPair(card,card),false);
}
assert.equal(makeMatchBoard([]).length,0);
assert.equal(makeMatchBoard([vocab[0]]).length,2);
assert.equal(makeMatchBoard([vocab[0],{...vocab[1],meaningVi:vocab[0].meaningVi}]).length,2);
console.log('✓ Matching board has six unambiguous pairs and no duplicate terms or meanings');
