import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { assemble } from '../features/lesson/schema.js';
import { translate } from '../features/language/translate.js';
const read=name=>JSON.parse(readFileSync(`content/day-18/${name}.json`,'utf8'));
const day=assemble('day-18',{day:read('day'),theory:read('theory'),vocabulary:read('vocabulary'),listening:read('listening')});
assert.equal(day.no,18);assert.equal(day.phase,2);assert.equal(day.sourceDay,9);
assert.deepEqual(day.collections,['theory','vocabulary','listening'],'Web assignments are the homework source; do not add Drive exercises');
assert.deepEqual(day.listening.map(s=>s.questions.length),[6,6,25,25,47]);
const questions=day.listening.flatMap(s=>s.questions);
assert.equal(questions.length,109);assert.equal(new Set(questions.map(q=>q.id)).size,109);
for(const set of day.listening){
 assert.ok(set.sourceUrl.startsWith('https://study.thaylongtoeic.com/'));
 for(const q of set.questions){
  assert.equal(q.source.audio,'thaylong');assert.ok(existsSync(`public${q.audio}`));
  assert.ok(q.transcript && !q.transcript.raw);
  if(set.hasKey){
   assert.equal(q.source.answer,'ai');assert.ok(set.choices.includes(q.answer));
   for(const letter of set.choices)assert.ok(q.transcript[letter]);
   if(set.part===1)assert.ok(existsSync(`public${q.image}`));
   else assert.ok(q.transcript.Q);
  }
 }
}
const words=day.listening.at(-1);
assert.equal(words.mode,'dictation');assert.equal(words.sourceName,'WORD - DAY 4','Preserve the source name even though this exercise is assigned on Day 9');
assert.equal(new Set(words.questions.map(q=>q.sourceSentenceId)).size,47);
for(const q of words.questions){assert.equal(typeof q.transcript,'string');assert.ok(q.transcriptVi);assert.equal(q.source.transcript,'whisper');}
assert.equal(words.questions[0].transcript,'aisle');assert.equal(words.questions[26].transcript,'mail');assert.equal(words.questions[45].transcript,'weight');
assert.equal(day.vocabulary.length,52);assert.equal(new Set(day.vocabulary.map(q=>q.word)).size,52);
const artificial=day.vocabulary.find(q=>q.word==='artificial');assert.equal(artificial.sourceUrls.length,2,'Keep both vocabulary sources without a duplicate artificial card');
for(const v of day.vocabulary){for(const accent of ['uk','us'])assert.ok(existsSync(`public${v.voice[accent]}`));}
assert.ok(existsSync('public/assets/day-18/flashcard.pdf'));
assert.equal(day.theory.length,8);
for(const label of [day.subtitle,...day.theory.map(b=>b.title),...day.theory.flatMap(b=>Object.keys(b.groups||{})),...day.listening.flatMap(s=>[s.title,s.subtitle]),...day.vocabulary.map(v=>v.group)]){
 for(const locale of ['vi','zh','ko'])assert.notEqual(translate(locale,label),label,`Missing ${locale}: ${label}`);
}
console.log('✓ Day 18: web-only assignment scope, 109 original audio clips, 62 AI keys, 47 reviewed dictations, 52 unique words with both voices, noun guide and UI translations');
