#!/usr/bin/env node
// Test phòng thi: luật (features/exam/rules.js + buildExam.js) và chính các đề
// trong content/exam/.
//   npm run test:exam

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { PARTS, READING_SECONDS_PER_QUESTION, isCompleteForm } from '../features/exam/rules.js';
import { buildPaper, formQuestions, newAttempt, paperSummary, tapeOf } from '../features/exam/buildExam.js';

const forms = readdirSync('content/exam')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`content/exam/${f}`, 'utf8')));
const onDisk = (url) => existsSync(`public${url}`);

// --- 1. Cấu trúc đề thật: 200 câu, 7 Part, Listening 100 + Reading 100 -------
{
  assert.deepEqual(PARTS.map((p) => p.questions), [6, 25, 39, 30, 30, 16, 54]);
  const sum = (kind) => PARTS.filter((p) => p.section === kind).reduce((n, p) => n + p.questions, 0);
  assert.equal(sum('listening'), 100);
  assert.equal(sum('reading'), 100);
  // 75 phút cho 100 câu đọc
  assert.equal(READING_SECONDS_PER_QUESTION * 100, 75 * 60);
  console.log('✓ cấu trúc đề: 7 Part, 100 câu nghe + 100 câu đọc');
}

// --- 2. Từng đề trong content/exam là một đề trọn vẹn ------------------------
assert.ok(forms.length > 0, 'content/exam chưa có đề nào');
for (const form of forms) {
  const qs = formQuestions(form);
  const tag = `${form.form}`;

  assert.ok(isCompleteForm(form), `${tag}: có câu thiếu đáp án`);
  assert.equal(qs.length, 200, `${tag}: ${qs.length} câu`);
  assert.deepEqual(qs.map((q) => q.no), Array.from({ length: 200 }, (_, i) => i + 1), `${tag}: số câu không liền 1-200`);
  for (const p of PARTS) {
    assert.equal(qs.filter((q) => q.part === p.part).length, p.questions, `${tag}: Part ${p.part} sai số câu`);
  }

  for (const q of qs) {
    assert.ok(q.choices.includes(q.answer), `${tag} câu ${q.no}: đáp án ${q.answer} không nằm trong ${q.choices}`);
    if (q.part === 2) assert.deepEqual(q.choices, ['A', 'B', 'C'], `${tag} câu ${q.no}: Part 2 chỉ có A-C`);
    if (q.part >= 3) {
      assert.equal(Object.keys(q.options || {}).length, 4, `${tag} câu ${q.no}: thiếu phương án`);
      for (const v of Object.values(q.options)) assert.ok(v && v.length < 150, `${tag} câu ${q.no}: phương án lạ "${v}"`);
    }
    if (q.part <= 4) {
      assert.ok(q.audio && onDisk(q.audio), `${tag} câu ${q.no}: thiếu file audio ${q.audio}`);
      assert.ok(q.audioSeconds > 0, `${tag} câu ${q.no}: chưa đo độ dài audio`);
    }
    if (q.part === 1) assert.ok(q.image && onDisk(q.image), `${tag} câu ${q.no}: thiếu tranh`);
    if (q.graphic) assert.ok(onDisk(q.graphic), `${tag} câu ${q.no}: thiếu hình minh hoạ`);
    if (q.part >= 6) {
      assert.ok(q.passage?.images?.length, `${tag} câu ${q.no}: thiếu đoạn văn`);
      for (const img of q.passage.images) assert.ok(onDisk(img), `${tag}: thiếu ảnh ${img}`);
    }
    if (q.part === 5) assert.ok(q.stem?.includes('___'), `${tag} câu ${q.no}: Part 5 phải có chỗ trống`);
  }

  // Part 3 có 13 bài, Part 4 có 10 bài, mỗi bài 3 câu chung một audio.
  for (const [part, talks] of [[3, 13], [4, 10]]) {
    const units = tapeOf(qs.filter((q) => q.part === part));
    assert.equal(units.length, talks, `${tag}: Part ${part} có ${units.length} bài`);
    assert.ok(units.every((u) => u.to - u.from === 2), `${tag}: Part ${part} có bài không đủ 3 câu`);
  }
  console.log(`✓ ${tag}: 200 câu, đủ 7 Part, đủ audio / tranh / đoạn văn trên đĩa`);
}

// --- 3. Hai đề không bao giờ chung câu --------------------------------------
{
  const ids = forms.flatMap((f) => formQuestions(f).map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length, 'có câu trùng id giữa các đề');
  const nos = forms.map((f) => f.no);
  assert.equal(new Set(nos).size, nos.length, 'hai đề trùng số đề');
  console.log(`✓ ${forms.length} đề, không đề nào chung câu, không trùng số đề`);
}

// --- 4. Dựng lượt thi cả đề: Listening rồi Reading --------------------------
{
  const form = forms[0];
  const paper = buildPaper(form);
  assert.deepEqual(paper.sections.map((s) => s.kind), ['listening', 'reading']);
  assert.deepEqual(paper.sections.map((s) => s.questions.length), [100, 100]);
  assert.equal(paper.total, 200);
  assert.equal(paper.sections[1].seconds, 75 * 60);

  // Giờ Listening = đúng độ dài băng
  const tape = tapeOf(paper.sections[0].questions);
  assert.equal(tape.length, 31 + 13 + 10, 'băng: 31 câu Part 1-2 + 23 bài Part 3-4');
  assert.equal(paper.sections[0].seconds, Math.ceil(tape.reduce((n, u) => n + u.seconds, 0)));

  // Tóm tắt cho màn chọn đề khớp với lượt thi thật
  const sum = paperSummary(form);
  assert.equal(sum.total, 200);
  assert.equal(sum.seconds, paper.seconds);
  assert.deepEqual(sum.parts.map((p) => p.count), [6, 25, 39, 30, 30, 16, 54]);
  console.log(`✓ thi cả đề: Listening ${paper.sections[0].seconds}s theo băng, Reading 75 phút`);
}

// --- 5. Thi riêng một Part ----------------------------------------------------
{
  const form = forms[0];
  const p3 = buildPaper(form, 3);
  assert.equal(p3.sections.length, 1);
  assert.equal(p3.sections[0].kind, 'listening');
  assert.equal(p3.sections[0].questions.length, 39);
  assert.ok(p3.sections[0].questions.every((q) => q.part === 3));

  const p7 = buildPaper(form, 7);
  assert.equal(p7.sections[0].kind, 'reading');
  assert.equal(p7.sections[0].seconds, 54 * READING_SECONDS_PER_QUESTION);

  assert.equal(buildPaper(form, 8), null, 'Part không tồn tại thì không dựng');
  console.log('✓ thi riêng Part: đúng câu, đúng luật của Part');
}

// --- 6. Lượt thi lưu đủ để "Thi lại" và chấm theo Part -----------------------
{
  const form = forms[0];
  const a = newAttempt(buildPaper(form, 5), 'Test');
  assert.equal(a.paperId, form.form);
  assert.equal(a.only, 5);
  assert.equal(a.total, 30);
  assert.ok(a.answers.every((x) => x.part === 5 && x.no >= 101 && x.picked === null));
  console.log('✓ lượt thi ghi đề, Part và số câu');
}
