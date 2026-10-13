#!/usr/bin/env node
// Soát file content/<day>/*.json trước khi tin dùng.
//
//   node scripts/validate-content.mjs           soát mọi buổi trong days.json
//   node scripts/validate-content.mjs day-1     soát một buổi
//
// LỖI  = sai cấu trúc, app sẽ vỡ. Phải sửa.
// CẢNH BÁO = còn dữ liệu do máy sinh chưa ai soát, hoặc còn chỗ trống.

import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SCHEMA_VERSION = 1;

const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);

const readJson = async (p) => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));

/** Đường dẫn asset trong JSON phải trỏ tới file có thật trong public/. */
async function assetExists(url) {
  if (!url) return true;
  try {
    await access(path.join(ROOT, 'public', url.replace(/^\//, '')));
    return true;
  } catch {
    return false;
  }
}

function checkEnvelope(file, data, slug, expectedCollection) {
  if (data.schemaVersion !== SCHEMA_VERSION)
    err(file, `schemaVersion ${data.schemaVersion}, code đang ở ${SCHEMA_VERSION}`);
  if (data.day !== slug) err(file, `khai báo day="${data.day}" nhưng nằm trong folder ${slug}`);
  if (data.collection !== expectedCollection)
    err(file, `collection="${data.collection}", đáng lẽ "${expectedCollection}"`);
  if (!Array.isArray(data.items)) err(file, 'thiếu mảng items');
}

/** `id` phải duy nhất toàn cục — tiến độ học neo vào đây. */
function checkIds(file, items, seen, depth = 'id') {
  for (const it of items) {
    if (!it.id) {
      err(file, `có item thiếu ${depth}`);
      continue;
    }
    if (seen.has(it.id)) err(file, `${depth} trùng: ${it.id}`);
    seen.add(it.id);
  }
}

/** Đếm field còn mang source 'ai'/'whisper' — những chỗ bắt buộc phải soát tay. */
function countUnreviewed(items) {
  let n = 0;
  for (const it of items) {
    const s = it.source;
    if (!s) continue;
    if (typeof s === 'string') {
      if (s === 'ai' || s === 'whisper') n += 1;
    } else {
      n += Object.values(s).filter((v) => v === 'ai' || v === 'whisper').length;
    }
  }
  return n;
}

async function validateDay(slug) {
  const dir = `content/${slug}`;
  const seen = new Set();

  let day;
  try {
    day = await readJson(`${dir}/day.json`);
  } catch {
    err(dir, 'không đọc được day.json');
    return;
  }

  if (day.slug !== slug) err(`${dir}/day.json`, `slug="${day.slug}" khác tên folder`);
  if (!Array.isArray(day.collections)) {
    err(`${dir}/day.json`, 'thiếu mảng collections');
    return;
  }

  for (const name of day.collections) {
    const file = `${dir}/${name}.json`;
    let data;
    try {
      data = await readJson(file);
    } catch {
      err(file, 'day.json khai có collection này nhưng không đọc được file');
      continue;
    }

    checkEnvelope(file, data, slug, name);
    if (!Array.isArray(data.items)) continue;
    checkIds(file, data.items, seen);

    const unreviewed = countUnreviewed(data.items);
    if (unreviewed) warn(file, `${unreviewed} field còn là bản nháp của máy (source ai/whisper)`);

    // --- kiểm tra riêng từng loại ---
    if (name === 'vocabulary') {
      for (const v of data.items) {
        if (!v.word) err(file, `${v.id} thiếu word`);
        if (!v.meaningVi) err(file, `${v.id} thiếu meaningVi`);
        if (!(await assetExists(v.image))) err(file, `${v.id} ảnh không tồn tại: ${v.image}`);
      }
      const noImage = data.items.filter((v) => !v.image).length;
      if (noImage) warn(file, `${noImage} từ chưa có ảnh cho mặt sau thẻ`);
    }

    if (name === 'translation') {
      for (const t of data.items) {
        if (t.tokens?.length !== t.key?.length)
          err(file, `${t.id} tokens (${t.tokens?.length}) lệch key (${t.key?.length})`);
        if (!t.key?.some((k) => k === 'S')) warn(file, `${t.id} không có cụm nào gán S`);
        if (!t.vi) err(file, `${t.id} thiếu bản dịch mẫu`);
      }
    }

    if (name === 'listening') {
      for (const set of data.items) {
        if (!set.code) err(file, `${set.id} thiếu code (dùng làm URL)`);
        if (!(await assetExists(set.fullAudio)))
          err(file, `${set.id} fullAudio không tồn tại: ${set.fullAudio}`);
        if (!Array.isArray(set.questions)) {
          err(file, `${set.id} thiếu mảng questions`);
          continue;
        }
        checkIds(file, set.questions, seen, 'question id');

        const letters = set.choices || ['A', 'B', 'C', 'D'];
        if (set.part !== undefined && ![1, 2, 3].includes(set.part))
          err(file, `${set.id} part=${set.part}, chỉ nhận 1, 2 hoặc 3`);
        if (set.part === 2 && letters.length !== 3)
          err(file, `${set.id} là Part 2 nhưng choices có ${letters.length} phương án, đáng lẽ 3`);

        for (const q of set.questions) {
          if (q.answer && !letters.includes(q.answer))
            err(file, `${q.id} answer="${q.answer}" không nằm trong ${letters.join('/')}`);
          if (q.options && Object.keys(q.options).join('') !== letters.join(''))
            err(file, `${q.id} options có ${Object.keys(q.options).join('/')}, bộ khai ${letters.join('/')}`);
          if (!(await assetExists(q.audio))) err(file, `${q.id} audio không tồn tại: ${q.audio}`);
          if (!(await assetExists(q.image))) err(file, `${q.id} ảnh không tồn tại: ${q.image}`);
          if (set.hasKey && !q.answer) err(file, `${q.id} bộ có hasKey nhưng thiếu answer`);
          if (!set.hasKey && q.answer)
            err(file, `${q.id} có answer nhưng bộ khai hasKey=false — sửa hasKey thành true`);
        }

        // Chỉ Part 1 có tranh đề bài; Part 2/3 không có tranh là đúng.
        const noImage = set.questions.filter((q) => !q.image).length;
        if (noImage && (set.part || 1) === 1)
          warn(file, `${set.title}: ${noImage} câu chưa gán ảnh đề bài`);
        // Transcript giờ vừa là lời thoại vừa là ĐÁP ÁN để chấm bài chép —
        // thiếu nó thì bộ nào cũng không chấm được, không riêng bộ trắc nghiệm.
        const noScript = set.questions.filter((q) => !q.transcript).length;
        const unsplit = set.questions.filter((q) => q.transcript?.raw).length;
        if (unsplit) warn(file, `${set.title}: ${unsplit} câu transcript còn dạng { raw }, chưa tách phương án`);
        // Bộ câu hỏi Part 3 có phương án in sẵn, không cần transcript.
        if (noScript && !(set.part === 3 && set.mode === 'choice'))
          warn(file, `${set.title}: ${noScript} câu chưa có transcript (chưa chạy whisper)`);
      }
    }

    if (name === 'theory') {
      for (const b of data.items) {
        if (b.type !== 'table') continue;
        for (const [i, row] of (b.rows || []).entries()) {
          // Mảng trong mảng thì Firestore từ chối ghi — dòng phải là { cells }.
          if (!Array.isArray(row?.cells)) err(file, `${b.id} dòng ${i + 1} phải có dạng { cells: [...] }`);
          else if (row.cells.length !== b.columns.length)
            err(file, `${b.id} dòng ${i + 1} có ${row.cells.length} ô, bảng có ${b.columns.length} cột`);
        }
      }
    }

    if (name === 'exercises') {
      for (const set of data.items) {
        if (!set.code) err(file, `${set.id} thiếu code (dùng làm URL)`);
        if (!['choice', 'rewrite'].includes(set.kind))
          err(file, `${set.id} kind="${set.kind}", chỉ nhận choice hoặc rewrite`);
        if (!Array.isArray(set.questions)) {
          err(file, `${set.id} thiếu mảng questions`);
          continue;
        }
        checkIds(file, set.questions, seen, 'question id');
        for (const q of set.questions) {
          if (!q.text) err(file, `${q.id} thiếu text`);
          if (!q.answer) err(file, `${q.id} thiếu answer`);
          if (set.kind === 'choice' && !q.options?.[q.answer])
            err(file, `${q.id} answer="${q.answer}" không có trong options`);
        }
        const unreviewedQ = countUnreviewed(set.questions);
        if (unreviewedQ) warn(file, `${set.title}: ${unreviewedQ} field còn là bản nháp của máy (source ai/whisper)`);
      }
    }

    if (name === 'pictures') {
      for (const set of data.items) {
        if (!Array.isArray(set.questions)) continue;
        checkIds(file, set.questions, seen, 'question id');
        for (const q of set.questions) {
          if (!(await assetExists(q.image))) err(file, `${q.id} ảnh không tồn tại: ${q.image}`);
        }
        const noAnswer = set.questions.filter((q) => !q.answer).length;
        if (noAnswer) warn(file, `${set.title}: ${noAnswer}/${set.questions.length} ảnh chưa gán đáp án`);
      }
    }
  }
}

const index = await readJson('content/days.json');
const targets = process.argv[2] ? [process.argv[2]] : index.days;

for (const slug of targets) {
  if (!index.days.includes(slug))
    warn('content/days.json', `${slug} chưa được khai trong days.json — app sẽ không thấy buổi này`);
  await validateDay(slug);
}

for (const w of warns) console.log(`⚠  ${w}`);
for (const e of errors) console.log(`✖  ${e}`);

console.log(
  `\n${errors.length ? '✖' : '✓'} ${targets.join(', ')} — ${errors.length} lỗi, ${warns.length} cảnh báo`,
);
process.exit(errors.length ? 1 : 0);
