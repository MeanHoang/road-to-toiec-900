#!/usr/bin/env node
// Đẩy đề thi từ content/exam/*.json lên Firestore.
//
//   npm run push-exam              đẩy mọi đề
//   npm run push-exam -- --dry     chỉ in ra sẽ ghi / xoá gì, không đụng thật
//
// TÁCH khỏi push-content.mjs vì đề thi không thuộc buổi học nào. Trên Firestore
// nó nằm ở collection riêng, NGANG HÀNG với days/:
//
//   exam/<form>    một đề trọn vẹn 200 câu, ví dụ exam/ets-full-1
//
// Firestore phải KHỚP repo: document nào trong exam/ không còn file tương ứng
// thì bị xoá, cùng với exam-papers/ của cấu trúc cũ (đề rút từ bài tập buổi
// học). Để sót thì app đọc lẫn đề cũ vào danh sách.
//
// Cần service account key, giống push-content:
//   .cache/firebase-admin.json      (đã gitignore, TUYỆT ĐỐI không commit)

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ROOT = path.resolve(import.meta.dirname, '..');
const KEY_PATH = path.join(ROOT, '.cache', 'firebase-admin.json');
const EXAM_DIR = path.join(ROOT, 'content', 'exam');
const MAX_BYTES = 900_000; // Firestore chặn ở 1 MB mỗi document
const LEGACY_COLLECTIONS = ['exam-papers']; // cấu trúc cũ, không còn ai đọc

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

async function main() {
  // Bước 1: kiểm tra đầu vào trước khi đụng tới mạng.
  const dry = process.argv.includes('--dry');
  if (!existsSync(EXAM_DIR)) fail('Chưa có content/exam — chạy `npm run import-exam` trước.');
  if (!existsSync(KEY_PATH)) {
    fail(
      `Thiếu service account key: ${path.relative(ROOT, KEY_PATH)}\n\n` +
        'Lấy ở Firebase Console → Project settings → Service accounts →\n' +
        'Generate new private key, rồi lưu file JSON vào đúng đường dẫn trên.',
    );
  }

  // Bước 2: đọc mọi đề trong repo. Khoá là trường `form` chứ không phải tên
  // file — đổi tên file không sinh ra một đề trùng trên Firestore.
  const forms = [];
  for (const f of (await readdir(EXAM_DIR)).filter((x) => x.endsWith('.json'))) {
    const form = await readJson(path.join(EXAM_DIR, f));
    if (!form.form) fail(`${f} thiếu trường "form" — không biết ghi vào đâu`);
    const bytes = Buffer.byteLength(JSON.stringify(form));
    if (bytes > MAX_BYTES) fail(`${f} nặng ${(bytes / 1024).toFixed(0)} KB — sát giới hạn 1 MB của Firestore`);
    // Đề vừa import xong chưa có audio: đẩy lên lúc đó là phần Listening câm.
    const missingAudio = form.sets.flatMap((s) => s.questions.filter((q) => q.part <= 4 && !(q.audio || s.audio)));
    if (missingAudio.length) fail(`${f}: ${missingAudio.length} câu nghe chưa có audio — chạy \`npm run voice-exam -- ${form.form}\` trước`);
    forms.push({ file: f, form, bytes });
  }
  if (!forms.length) fail('content/exam không có đề nào.');

  // Bước 3: mở kết nối (cả khi --dry: cần đọc Firestore để biết sẽ xoá gì).
  initializeApp({ credential: cert(await readJson(KEY_PATH)) });
  const store = getFirestore();

  // Bước 4: ghi từng đề.
  for (const { file, form, bytes } of forms) {
    const n = form.sets.reduce((k, s) => k + s.questions.length, 0);
    console.log(`  ghi  exam/${form.form}  ← ${file}  (${form.title}, ${n} câu, ${(bytes / 1024).toFixed(0)} KB)`);
    if (!dry) await store.doc(`exam/${form.form}`).set(form);
  }

  // Bước 5: xoá đề trên Firestore không còn trong repo, và collection cũ.
  const keep = new Set(forms.map((f) => f.form.form));
  const stale = (await store.collection('exam').get()).docs.filter((d) => !keep.has(d.id));
  for (const name of LEGACY_COLLECTIONS) stale.push(...(await store.collection(name).get()).docs);
  for (const d of stale) {
    console.log(`  xoá  ${d.ref.path}`);
    if (!dry) await d.ref.delete();
  }

  console.log(dry ? '\n(--dry: chưa ghi, chưa xoá gì cả)' : '\n✓ Firestore đã khớp content/exam');
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

main().catch((e) => fail(e.message));
