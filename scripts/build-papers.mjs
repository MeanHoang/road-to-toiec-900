#!/usr/bin/env node
// Sinh DANH SÁCH ĐỀ THI ra content/exam/papers.json.
//
//   npm run build-papers
//
// Vì sao đề phải là DỮ LIỆU chứ không phải thứ tính lúc chạy:
//
//   - "Đề số 1" phải là cùng một bộ câu với mọi người học, để so điểm được.
//     Tính trong trình duyệt thì ai có nội dung khác sẽ ra đề khác.
//   - Nhập thêm một buổi là kho câu đổi, và "Đề số 1" tự đổi theo — người đã
//     thi hôm qua không thi lại được đúng đề đó nữa.
//   - Có file thì sửa tay được: muốn đề 2 dùng bộ khác, sửa một dòng.
//
// File sinh ra CÓ COMMIT, và đẩy lên Firestore bằng `npm run push-exam`.
// Chạy lại script này khi có nội dung mới, rồi xem diff trước khi commit —
// đề cũ KHÔNG được đổi, chỉ được thêm đề mới vào cuối.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'content', 'exam', 'papers.json');

// Số câu của từng Part trong đề thật. Giữ khớp với features/exam/rules.js.
const NEED = { 1: 6, 2: 25, 3: 39, 4: 30 };

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

function main() {
  // Bước 1: đọc toàn bộ bài nghe, gom theo bộ.
  const slugs = readJson(path.join(ROOT, 'content', 'days.json')).days;
  const sets = [];
  for (const slug of slugs) {
    const f = path.join(ROOT, 'content', slug, 'listening.json');
    if (!existsSync(f)) continue;
    for (const s of readJson(f).items) {
      const usable = (s.questions || []).filter((q) => q.answer && q.audio);
      if (s.mode !== 'choice' || !s.hasKey || !usable.length) continue;
      sets.push({ setId: s.id, daySlug: slug, part: s.part || 1, count: usable.length });
    }
  }

  // Bước 2: chỉ giữ bộ MỘT MÌNH đủ số câu của Part đó. Ghép hai bộ thì số thứ
  // tự gãy ở chỗ nối — loa đọc lại từ 1 trong khi màn hình đã đếm tới 5.
  const byPart = {};
  for (const s of sets) {
    if (s.count < (NEED[s.part] || Infinity)) continue;
    (byPart[s.part] ||= []).push(s);
  }
  for (const p of Object.keys(byPart)) byPart[p].sort((a, b) => a.setId.localeCompare(b.setId));

  // Bước 3: đề đọc — mỗi file đề mẫu là một phần Đọc.
  const readingForms = ['ets-sample.json']
    .filter((f) => existsSync(path.join(ROOT, 'content', 'exam', f)))
    .map((f) => readJson(path.join(ROOT, 'content', 'exam', f)))
    .map((form) => ({
      formId: form.form,
      count: (form.sets || []).reduce((n, s) => n + (s.questions?.length || 0), 0),
    }));

  // Bước 4: dựng đề. Số đề = Part nào có nhiều bộ nhất; Part thiếu bộ thì DÙNG
  // LẠI bộ của đề trước, và ghi rõ ra trong `reuses` để không ai tưởng đề 2
  // hoàn toàn mới.
  const partsInPlay = Object.keys(byPart).map(Number).sort();
  const total = Math.max(0, ...partsInPlay.map((p) => byPart[p].length), readingForms.length);

  const papers = [];
  for (let i = 0; i < total; i++) {
    const sections = [];
    const reuses = [];

    const listening = [];
    for (const p of partsInPlay) {
      const pool = byPart[p];
      const chosen = pool[i % pool.length];
      if (i >= pool.length) reuses.push(`Part ${p}`);
      listening.push({ part: p, setId: chosen.setId, daySlug: chosen.daySlug });
    }
    if (listening.length) sections.push({ kind: 'listening', sets: listening });

    if (readingForms.length) {
      const form = readingForms[i % readingForms.length];
      if (i >= readingForms.length) reuses.push('phần Đọc');
      sections.push({ kind: 'reading', formId: form.formId });
    }

    papers.push({
      id: `paper-${i + 1}`,
      no: i + 1,
      title: `Đề số ${i + 1}`,
      sections,
      // Nói thẳng đề này dùng lại phần nào của đề trước. Bày ra bốn đề mà
      // không nói gì thì người học tưởng mình vừa thi bốn bài khác nhau.
      reuses,
    });
  }

  const file = {
    collection: 'exam-papers',
    title: 'Danh sách đề thi thử',
    note:
      'Sinh bằng `npm run build-papers`. Đề đã đánh số thì KHÔNG đổi nội dung — ' +
      'có nội dung mới thì thêm đề mới vào cuối.',
    schemaVersion: 1,
    papers,
  };

  writeFileSync(OUT, `${JSON.stringify(file, null, 2)}\n`);
  report(file, byPart, readingForms);
}

function report(file, byPart, readingForms) {
  console.log(`→ ${path.relative(ROOT, OUT)}`);
  for (const p of Object.keys(byPart)) {
    console.log(`   Part ${p}: ${byPart[p].length} bộ đủ câu — ${byPart[p].map((s) => s.setId).join(', ')}`);
  }
  console.log(`   phần Đọc: ${readingForms.length} đề mẫu`);
  console.log(`\n   ${file.papers.length} đề:`);
  for (const p of file.papers) {
    const l = p.sections.find((s) => s.kind === 'listening');
    const r = p.sections.find((s) => s.kind === 'reading');
    const bits = [l && l.sets.map((x) => x.setId).join('+'), r && r.formId].filter(Boolean);
    console.log(
      `     ${p.title}: ${bits.join(' | ')}${p.reuses.length ? `   (dùng lại: ${p.reuses.join(', ')})` : ''}`,
    );
  }
}

main();
