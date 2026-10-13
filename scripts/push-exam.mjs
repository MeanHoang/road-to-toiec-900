#!/usr/bin/env node
// Đẩy đề thi từ content/exam/*.json lên Firestore.
//
//   npm run push-exam              đẩy mọi đề
//   npm run push-exam -- --dry     chỉ in ra sẽ ghi gì, không ghi thật
//
// TÁCH khỏi push-content.mjs vì đề thi không thuộc buổi học nào. Trên Firestore
// nó nằm ở collection riêng, NGANG HÀNG với days/ chứ không nằm trong:
//
//   exam/<form>          nội dung một đề mẫu, ví dụ exam/ets1
//   exam-papers/list     danh sách ĐỀ: đề nào gồm bộ nào
//
// Cần service account key, giống push-content:
//   .cache/firebase-admin.json      (đã gitignore, TUYỆT ĐỐI không commit)

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path, { join } from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ROOT = path.resolve(import.meta.dirname, '..');
const KEY_PATH = path.join(ROOT, '.cache', 'firebase-admin.json');
const EXAM_DIR = path.join(ROOT, 'content', 'exam');
const MAX_BYTES = 900_000; // Firestore chặn ở 1 MB mỗi document

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

async function main() {
  // Bước 1: kiểm tra đầu vào trước khi đụng tới mạng.
  const dry = process.argv.includes('--dry');

  if (!existsSync(EXAM_DIR)) {
    console.error('Chưa có content/exam — chạy `npm run import-exam` trước.');
    process.exit(1);
  }
  if (!dry && !existsSync(KEY_PATH)) {
    console.error(
      `Thiếu service account key: ${path.relative(ROOT, KEY_PATH)}\n\n` +
        'Lấy ở Firebase Console → Project settings → Service accounts →\n' +
        'Generate new private key, rồi lưu file JSON vào đúng đường dẫn trên.',
    );
    process.exit(1);
  }

  // Bước 2: mở kết nối, trừ khi chạy thử.
  if (!dry) initializeApp({ credential: cert(await readJson(KEY_PATH)) });
  const store = dry ? null : getFirestore();

  // Bước 3: mỗi file một đề, khoá là trường `form` trong file chứ không phải
  // tên file — để đổi tên file không làm sinh ra một đề trùng trên Firestore.
  const files = (await readdir(EXAM_DIR)).filter((f) => f.endsWith('.json') && f !== 'papers.json');
  if (!files.length) {
    console.error('content/exam không có file .json nào.');
    process.exit(1);
  }

  for (const f of files) {
    const form = await readJson(path.join(EXAM_DIR, f));
    if (!form.form) {
      console.error(`  ✖ ${f} thiếu trường "form" — không biết ghi vào đâu`);
      process.exitCode = 1;
      continue;
    }

    const bytes = Buffer.byteLength(JSON.stringify(form));
    if (bytes > MAX_BYTES) {
      console.error(`  ✖ ${f} nặng ${(bytes / 1024).toFixed(0)} KB — sát giới hạn 1 MB của Firestore`);
      process.exitCode = 1;
      continue;
    }

    const questions = (form.sets || []).reduce((n, s) => n + (s.questions?.length || 0), 0);
    console.log(
      `  exam/${form.form}  ← ${f}  (${questions} câu, ${(bytes / 1024).toFixed(0)} KB)`,
    );
    if (store) await store.doc(`exam/${form.form}`).set(form);
  }

  // Danh sách đề đi riêng: nó không phải một đề mẫu, nó là bảng khai đề nào
  // gồm bộ nào. Thiếu nó thì mỗi máy tự suy ra đề, và "Đề số 1" mỗi nơi một kiểu.
  const listPath = join(EXAM_DIR, 'papers.json');
  if (existsSync(listPath)) {
    const list = await readJson(listPath);
    console.log(`  exam-papers/list  ← papers.json  (${list.papers?.length || 0} đề)`);
    if (store) await store.doc('exam-papers/list').set(list);
  } else {
    console.log('  ⚠ chưa có papers.json — chạy `npm run build-papers` trước');
  }

  console.log(dry ? '\n(--dry: chưa ghi gì cả)' : '\n✓ đã đẩy đề lên Firestore');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
