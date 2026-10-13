#!/usr/bin/env node
// Test luật phòng thi (features/exam/rules.js + buildExam.js).
//   npm run test:exam

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  PARTS,
  partSpec,
  partOfSet,
  isExamReady,
  examPool,
  poolByPart,
  partStatus,
  countCorrect,
} from '../features/exam/rules.js';
import {
  buildExam,
  buildReadingExam,
  buildPaper,
  newAttempt,
  partSets,
} from '../features/exam/buildExam.js';

const q = (id, extra = {}) => ({ id, answer: 'A', audio: `/a/${id}.mp3`, ...extra });
const set = (id, extra = {}) => ({
  id,
  mode: 'choice',
  hasKey: true,
  questions: [q(`${id}-1`), q(`${id}-2`)],
  ...extra,
});
const day = (slug, sets) => ({ slug, listening: sets });

// --- 1. Cấu trúc đề phải khớp đề thi thật -----------------------------------
{
  assert.equal(PARTS.reduce((n, p) => n + p.questions, 0), 100);
  assert.deepEqual(
    PARTS.map((p) => p.questions),
    [6, 25, 39, 30],
  );
  // Tổng thời gian phải xấp xỉ 45 phút của đề thật. Lệch quá là có Part nào
  // đó đặt giây sai — đúng cái bug làm Part 1 chỉ còn 30 giây cho cả bài.
  const total = PARTS.reduce((n, p) => n + p.questions * p.seconds, 0);
  assert.ok(total > 2400 && total < 3000, `tổng ${total}s, đề thật là 2700s (45 phút)`);
  console.log(`✓ bốn Part nghe: 100 câu, tổng ${Math.round(total / 60)} phút (đề thật 45 phút)`);
}

// Part 5-7 là phần Đọc, cố ý không khai — khai ra là hứa một thứ chưa có.
{
  assert.equal(partSpec(5), null);
  assert.equal(partStatus([], 5).ready, false);
  console.log('✓ không nhận Part 5-7 (phần Đọc, khoá học chưa dạy)');
}

// --- 2. Bộ cũ không khai `part` thì là Part 1 -------------------------------
{
  assert.equal(partOfSet({ id: 'x' }), 1);
  assert.equal(partOfSet({ id: 'x', part: 2 }), 2);
  console.log('✓ bộ chưa khai part được hiểu là Part 1, giống listening/rules.js');
}

// --- 3. Bốn điều kiện loại câu ----------------------------------------------
{
  const ok = set('s');
  assert.equal(isExamReady(ok, q('a')), true);

  assert.equal(isExamReady({ ...ok, mode: 'dictation' }, q('a')), false, 'chép chính tả');
  assert.equal(isExamReady({ ...ok, hasKey: false }, q('a')), false, 'bộ không có đáp án');
  assert.equal(isExamReady(ok, { ...q('a'), answer: null }), false, 'câu bỏ trống đáp án');
  assert.equal(isExamReady(ok, { ...q('a'), audio: null }), false, 'không có audio');
  console.log('✓ loại: chép chính tả, bộ thiếu đáp án, câu thiếu đáp án, câu không audio');
}

// --- 4. Gom kho từ nhiều buổi, giữ đúng Part --------------------------------
{
  const days = [
    day('day-1', [set('d1a'), set('d1b', { mode: 'dictation' })]),
    day('day-2', [set('d2a', { part: 2 })]),
  ];
  const pool = examPool(days);
  assert.equal(pool.length, 4, 'hai bộ trắc nghiệm × 2 câu');
  assert.deepEqual(poolByPart(days), { 1: 2, 2: 2, 3: 0, 4: 0 });
  assert.equal(pool.find((x) => x.id === 'd2a-1').part, 2);
  assert.equal(pool.find((x) => x.id === 'd1a-1').daySlug, 'day-1');
  console.log('✓ gom câu từ mọi buổi, giữ Part và buổi gốc của từng câu');
}

// --- 5. Thiếu câu thì KHÔNG cho thi -----------------------------------------
// Thi "Part 2 với 8 câu" rồi gọi là Part 2 thì không tái hiện được gì — nhịp
// 25 câu liên tục chính là cái khó của Part 2.
{
  const thin = [day('day-1', [set('a', { part: 2 })])];
  const st = partStatus(thin, 2);
  assert.equal(st.ready, false);
  assert.equal(st.have, 2);
  assert.equal(st.need, 25);
  assert.match(st.reason, /2\/25/);

  assert.equal(partStatus([], 1).reason, 'Chưa có câu nào');
  assert.equal(buildExam(thin, 2), null, 'kho thiếu thì không rút được đề');
  console.log('✓ kho thiếu câu thì không cho thi, và nói rõ thiếu bao nhiêu');
}

// --- 6. Rút đủ số câu, không trùng nhau -------------------------------------
{
  const many = day(
    'day-1',
    [{ ...set('big'), questions: Array.from({ length: 40 }, (_, i) => q(`b${i}`)) }],
  );
  const exam = buildExam([many], 1);
  assert.equal(exam.questions.length, 6);
  assert.equal(exam.part, 1);
  // `seconds` là TỔNG thời gian cả bài, không phải giây mỗi câu.
  assert.equal(exam.seconds, 6 * 30);
  assert.equal(new Set(exam.questions.map((x) => x.id)).size, 6, 'không câu nào lặp trong một đề');
  console.log('✓ rút đúng 6 câu cho Part 1, không câu nào lặp trong cùng một đề');
}

// --- 7. GIỮ NGUYÊN thứ tự câu trong bộ --------------------------------------
// Audio gốc đọc số thứ tự ("Number ten. Look at the picture marked number
// ten"), nên trộn câu xong thì loa đọc số 10 trong khi màn hình ghi Câu 1.
{
  const many = day(
    'day-1',
    [{ ...set('big'), questions: Array.from({ length: 10 }, (_, i) => q(`b${i}`)) }],
  );
  const ids = buildExam([many], 1).questions.map((x) => x.id);
  assert.deepEqual(ids, ['b0', 'b1', 'b2', 'b3', 'b4', 'b5'], 'phải là 6 câu ĐẦU, đúng thứ tự');
  console.log('✓ lấy nguyên bộ từ câu đầu, đúng thứ tự — số loa đọc khớp số trên màn');
}

// --- 8. ĐỀ CỐ ĐỊNH, không ngẫu nhiên ---------------------------------------
// Gọi là "Đề số 1" thì lần nào vào cũng phải đúng bộ câu đó, không thì hai lần
// thi không so được điểm. Trước đây bốc ngẫu nhiên mỗi lần vào — tên một đằng,
// nội dung một nẻo.
{
  const three = day('day-1', [
    { ...set('s3'), questions: Array.from({ length: 6 }, (_, i) => q(`c${i}`)) },
    { ...set('s1'), questions: Array.from({ length: 6 }, (_, i) => q(`a${i}`)) },
    { ...set('s2'), questions: Array.from({ length: 6 }, (_, i) => q(`b${i}`)) },
  ]);

  const first = buildExam([three], 1, 0).questions.map((x) => x.id);
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(buildExam([three], 1, 0).questions.map((x) => x.id), first, 'đề 1 phải bất biến');
  }
  // Thứ tự bộ theo id, không theo thứ tự xuất hiện trong file — để thêm bộ mới
  // vào giữa không làm đổi nội dung của những đề đã đánh số.
  assert.deepEqual(first, ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'], 'đề 1 là bộ có id nhỏ nhất');
  assert.deepEqual(buildExam([three], 1, 1).questions.map((x) => x.id)[0], 'b0', 'đề 2 là bộ kế tiếp');

  // Bộ không đủ câu thì không thành đề riêng, và không bị ghép vào đề nào.
  const lech = day('day-1', [
    { ...set('nho'), questions: [q('n1'), q('n2')] },
    { ...set('du'), questions: Array.from({ length: 8 }, (_, i) => q(`d${i}`)) },
  ]);
  assert.equal(partSets([lech], 1).length, 1, 'chỉ bộ một mình đủ câu mới tính là một đề');
  assert.equal(
    buildExam([lech], 1).questions.every((x) => x.id.startsWith('d')),
    true,
    'không ghép bộ nhỏ vào',
  );
  console.log('✓ đề cố định và đánh số ổn định; bộ thiếu câu không bị ghép vào');
}

// --- 9. Một lượt thi: id theo thời điểm, đáp án chưa chọn -------------------
{
  const many = day(
    'day-1',
    [{ ...set('big'), questions: Array.from({ length: 10 }, (_, i) => q(`b${i}`)) }],
  );
  const a = newAttempt(buildExam([many], 1));
  assert.equal(a.total, 6);
  assert.equal(a.answers.length, 6);
  assert.equal(a.answers.every((x) => x.picked === null), true, 'chưa làm thì chưa có lựa chọn');
  assert.match(a.id, /^\d{4}-\d{2}-\d{2}T/, 'id là thời điểm ISO');
  console.log('✓ lượt thi mới: id theo thời điểm, mọi câu đều chưa chọn');
}

// --- 10. Chấm: bỏ trống là sai, không phải là chưa chấm ---------------------
{
  const attempt = {
    answers: [
      { id: '1', answer: 'A', picked: 'A' },
      { id: '2', answer: 'B', picked: 'C' },
      { id: '3', answer: 'C', picked: null },
    ],
  };
  assert.equal(countCorrect(attempt), 1);
  assert.equal(countCorrect(null), 0);
  console.log('✓ chấm đúng 1/3; câu bỏ trống tính là sai, đúng như thi thật');
}

// --- 11. Chạy trên nội dung THẬT trong repo ---------------------------------
// KHÔNG chốt cứng con số của hôm nay: nội dung các buổi đang được nhập dần,
// hôm qua Part 2 chưa có câu nào, hôm nay đã có. Một test chốt "Part 2 = 0" chỉ
// đúng trong một ngày. Thay vào đó đếm lại bằng một đường độc lập rồi đối chiếu.
{
  const days = JSON.parse(readFileSync('content/days.json', 'utf8')).days.map((slug) => ({
    slug,
    listening: JSON.parse(readFileSync(`content/${slug}/listening.json`, 'utf8')).items,
  }));

  // Đường độc lập: duyệt tay, không qua examPool.
  const byHand = {};
  for (const d of days) {
    for (const st of d.listening) {
      if (st.mode !== 'choice' || !st.hasKey) continue;
      for (const qq of st.questions) {
        if (!qq.answer || !qq.audio) continue;
        const p = st.part || 1;
        byHand[p] = (byHand[p] || 0) + 1;
      }
    }
  }
  const n = poolByPart(days);
  for (const p of PARTS) assert.equal(n[p.part], byHand[p.part] || 0, `Part ${p.part} đếm lệch`);
  console.log(`✓ nội dung thật (${days.length} buổi): examPool khớp với đếm tay — ` +
    PARTS.map((p) => `P${p.part}:${n[p.part]}`).join(' '));
}

// --- 12. Part nào đủ câu thì rút được đề thật ------------------------------
{
  const days = JSON.parse(readFileSync('content/days.json', 'utf8')).days.map((slug) => ({
    slug,
    listening: JSON.parse(readFileSync(`content/${slug}/listening.json`, 'utf8')).items,
  }));

  const ready = PARTS.filter((p) => partStatus(days, p.part).ready);
  assert.notEqual(ready.length, 0, 'phải có ít nhất một Part thi được, không thì phòng thi vô dụng');

  for (const p of ready) {
    const exam = buildExam(days, p.part);
    assert.equal(exam.questions.length, p.questions, `Part ${p.part} phải rút đủ ${p.questions} câu`);
    assert.equal(new Set(exam.questions.map((x) => x.id)).size, p.questions, 'không lặp câu');
    assert.equal(exam.questions.every((x) => x.audio && x.answer), true, 'câu nào cũng có audio + đáp án');
    assert.equal(exam.questions.every((x) => x.part === p.part), true, 'không lẫn câu của Part khác');
  }
  // Part chưa đủ câu thì phải từ chối, không được rút đề thiếu.
  for (const p of PARTS.filter((x) => !partStatus(days, x.part).ready)) {
    assert.equal(buildExam(days, p.part), null, `Part ${p.part} chưa đủ câu thì phải trả null`);
  }
  console.log(`✓ rút được đề thật cho ${ready.map((p) => 'Part ' + p.part).join(', ')}; ` +
    `Part chưa đủ câu đều bị từ chối`);
}

// --- 13. Đề đọc: giữ nguyên thứ tự, mỗi câu mang theo đoạn văn của nó -------
{
  const form = {
    form: 'f1',
    title: 'Đề mẫu',
    sets: [
      { id: 's1', part: 5, passage: null, questions: [
        { id: 'q1', no: 101, options: { A: 1, B: 2, C: 3, D: 4 }, answer: 'A' },
        { id: 'q2', no: 102, options: { A: 1, B: 2, C: 3, D: 4 }, answer: 'B' },
      ] },
      { id: 's2', part: 7, passage: { text: 'bài báo' }, questions: [
        { id: 'q3', no: 149, options: { A: 1, B: 2, C: 3, D: 4 }, answer: 'C' },
        { id: 'q4', no: 150, options: { A: 1, B: 2 }, answer: 'D' },
      ] },
    ],
  };
  const exam = buildReadingExam(form);
  assert.equal(exam.kind, 'reading');
  assert.equal(exam.questions.length, 3, 'câu thiếu phương án bị loại');
  assert.deepEqual(exam.questions.map((q) => q.no), [101, 102, 149], 'giữ nguyên thứ tự, không trộn');
  assert.equal(exam.questions[2].passage.text, 'bài báo', 'câu mang theo đoạn văn của bộ mình');
  assert.equal(exam.questions[0].passage, null);
  assert.equal(exam.seconds, 3 * 45, 'đúng nhịp đề thật: 45 giây một câu đọc');
  assert.equal(buildReadingExam({ form: 'x', sets: [] }), null);
  console.log('✓ đề đọc giữ nguyên thứ tự, câu nào cũng kèm đoạn văn, 45 giây/câu');
}

// --- 14. Đề mẫu ETS thật trong repo ----------------------------------------
{
  const form = JSON.parse(readFileSync('content/exam/ets-sample.json', 'utf8'));
  const exam = buildReadingExam(form);
  assert.equal(exam.questions.length, 30, 'đề mẫu ETS cho đúng 30 câu Đọc');
  assert.equal(exam.questions.every((q) => /^[A-D]$/.test(q.answer)), true);
  assert.equal(exam.questions.every((q) => Object.keys(q.options).length === 4), true);
  // Đoạn văn KHÔNG được chứa phương án — lộ đáp án cho người đang thi.
  const leak = form.sets.filter((s) => /\([A-D]\)\s/.test(s.passage?.text || ''));
  assert.equal(leak.length, 0, `đoạn văn lộ phương án: ${leak.map((s) => s.id)}`);
  // Bộ Part 6/7 phải có chữ hoặc có ảnh, không thì người thi không có gì để đọc.
  const blind = form.sets.filter((s) => s.part !== 5 && !s.passage?.text && !s.passage?.image);
  assert.equal(blind.length, 0, `bộ không có cả chữ lẫn ảnh: ${blind.map((s) => s.id)}`);
  // Phương án không được dính rác của trang in. Đây là lỗi đã xảy ra thật:
  // đáp án D câu 147 từng kéo theo cả footer và phần Directions của Part sau.
  const JUNK = /Unauthorized|Directions:|GO ON TO|answer sheet|this page|time is called|Stop!/i;
  const dirty = exam.questions.filter((q) => Object.values(q.options).some((v) => JUNK.test(v)));
  assert.equal(dirty.length, 0, `phương án dính chữ của trang in: ${dirty.map((q) => q.no)}`);
  const longest = Math.max(...exam.questions.flatMap((q) => Object.values(q.options).map((v) => v.length)));
  assert.ok(longest < 150, `phương án dài ${longest} ký tự — gần như chắc chắn là rác dính vào`);
  console.log(`✓ đề mẫu ETS: 30 câu, đáp án hợp lệ, không lộ phương án, không dính rác trang in`);
}

// --- 15. Một ĐỀ gồm cả hai kỹ năng, hai chặng, hai đồng hồ ------------------
// Đề TOEIC thật là 200 câu làm liền: Nghe 45 phút rồi vào thẳng Đọc 75 phút.
// Handbook của ETS cấm làm phần này trong giờ phần kia, nên hai chặng phải
// tách bạch chứ không gộp một đồng hồ.
{
  const days = JSON.parse(readFileSync('content/days.json', 'utf8')).days.map((slug) => ({
    slug,
    listening: JSON.parse(readFileSync(`content/${slug}/listening.json`, 'utf8')).items,
  }));
  const forms = [JSON.parse(readFileSync('content/exam/ets-sample.json', 'utf8'))];
  const defs = JSON.parse(readFileSync('content/exam/papers.json', 'utf8')).papers;

  const paper = buildPaper(days, forms, defs[0]);
  assert.deepEqual(paper.sections.map((s) => s.kind), ['listening', 'reading'], 'Nghe trước, Đọc sau');
  assert.equal(paper.total, paper.sections.reduce((n, s) => n + s.questions.length, 0));
  assert.equal(paper.seconds, paper.sections.reduce((n, s) => n + s.seconds, 0));
  assert.equal(paper.full, false, 'chưa đủ 200 câu thì phải tự nhận là chưa đủ');
  assert.ok(paper.shortfall['Part 4'], 'phải nói rõ thiếu Part nào');

  const [nghe, doc] = paper.sections;
  assert.equal(nghe.questions.every((q) => q.audio), true, 'chặng Nghe: câu nào cũng có audio');
  assert.equal(doc.questions.every((q) => q.options), true, 'chặng Đọc: câu nào cũng có phương án chữ');
  console.log(`✓ một đề = Nghe (${nghe.questions.length}) → Đọc (${doc.questions.length}), hai đồng hồ riêng`);
}

// --- 16. Đề là DỮ LIỆU: cố định, giống nhau với mọi người học ---------------
// "Đề số 1" phải là cùng một bộ câu ở mọi máy và mọi lần vào, không thì không
// so điểm được. Trước đây đề được tính trong trình duyệt nên mỗi lần một khác.
{
  const days = JSON.parse(readFileSync('content/days.json', 'utf8')).days.map((slug) => ({
    slug,
    listening: JSON.parse(readFileSync(`content/${slug}/listening.json`, 'utf8')).items,
  }));
  const forms = [JSON.parse(readFileSync('content/exam/ets-sample.json', 'utf8'))];
  const file = JSON.parse(readFileSync('content/exam/papers.json', 'utf8'));
  const defs = file.papers;

  assert.ok(defs.length >= 1, 'phải có ít nhất một đề');
  assert.deepEqual(defs.map((d) => d.no), defs.map((_, i) => i + 1), 'đề đánh số liên tục từ 1');
  assert.equal(new Set(defs.map((d) => d.id)).size, defs.length, 'id đề không trùng');

  // Dựng lại nhiều lần phải ra đúng một bộ câu.
  const ids = (p) => p.sections.flatMap((s) => s.questions.map((q) => q.id));
  const first = ids(buildPaper(days, forms, defs[0]));
  for (let i = 0; i < 10; i++) {
    assert.deepEqual(ids(buildPaper(days, forms, defs[0])), first, 'Đề 1 phải bất biến');
  }

  // Các đề phải khác nhau ở phần nào CÓ nhiều bộ.
  if (defs.length > 1) {
    const second = ids(buildPaper(days, forms, defs[1]));
    assert.notDeepEqual(second, first, 'Đề 2 phải khác Đề 1');
    assert.ok(defs[1].reuses.length > 0, 'đề dùng lại bộ của đề trước thì phải khai ra');
  }

  // Thi riêng từng phần, và lượt thi ghi lại số đề để "Thi lại" đúng đề cũ.
  const onlyL = buildPaper(days, forms, defs[0], 'listening');
  const onlyR = buildPaper(days, forms, defs[0], 'reading');
  assert.deepEqual(onlyL.sections.map((s) => s.kind), ['listening']);
  assert.deepEqual(onlyR.sections.map((s) => s.kind), ['reading']);

  const a = newAttempt(buildPaper(days, forms, defs[0]), 'Minh Hoàng');
  assert.equal(a.learner, 'Minh Hoàng');
  assert.equal(a.nth, 0);
  assert.equal(a.sections.reduce((n, s) => n + s.count, 0), a.total, 'ranh giới phủ hết số câu');
  console.log(`✓ ${defs.length} đề cố định, đọc từ papers.json; đề 1 bất biến qua mọi lần dựng`);
}

console.log('\n16/16 pass');