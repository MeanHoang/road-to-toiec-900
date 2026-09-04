#!/usr/bin/env node
// Đẩy nội dung từ content/<day>/*.json lên Firestore.
//
//   npm run push-content           đẩy mọi buổi trong content/days.json
//   npm run push-content day-2     đẩy một buổi
//   npm run push-content -- --dry  chỉ in ra sẽ ghi gì, không ghi thật
//
// Cấu trúc trên Firestore giữ nguyên hình dạng file trong repo, nhìn ở console
// là hiểu ngay đang có gì:
//
//   meta/days                              { days: ["day-1", ...] }
//   days/<slug>                            nội dung day.json
//   days/<slug>/collections/<tên>          nội dung <tên>.json
//
// Cần service account key. Tải ở Firebase Console → Project settings →
// Service accounts → Generate new private key, rồi lưu vào:
//   .cache/firebase-admin.json      (đã gitignore, TUYỆT ĐỐI không commit)

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ROOT = path.resolve(import.meta.dirname, '..');
const KEY_PATH = path.join(ROOT, '.cache', 'firebase-admin.json');

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const only = args.find((a) => !a.startsWith('--'));

  if (!dry && !existsSync(KEY_PATH)) {
    console.error(
      `Thiếu service account key: ${path.relative(ROOT, KEY_PATH)}\n\n` +
        'Lấy ở Firebase Console → Project settings → Service accounts →\n' +
        'Generate new private key, rồi lưu file JSON vào đúng đường dẫn trên.\n' +
        'File đó đã nằm trong .gitignore — đừng commit.',
    );
    process.exit(1);
  }

  const index = await readJson(path.join(ROOT, 'content', 'days.json'));
  const slugs = only ? [only] : index.days;

  if (!dry) {
    initializeApp({ credential: cert(await readJson(KEY_PATH)) });
  }
  const store = dry ? null : getFirestore();

  for (const slug of slugs) {
    const dir = path.join(ROOT, 'content', slug);
    if (!existsSync(dir)) {
      console.error(`✖ không thấy thư mục content/${slug}`);
      process.exitCode = 1;
      continue;
    }

    const day = await readJson(path.join(dir, 'day.json'));
    console.log(`\n${slug}`);
    console.log(`  days/${slug}  ← day.json`);
    if (store) await store.doc(`days/${slug}`).set(day);

    const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && f !== 'day.json');
    for (const f of files) {
      const name = f.replace(/\.json$/, '');
      if (!day.collections.includes(name)) {
        console.log(`  ⚠ bỏ qua ${f} — day.json không khai collection này`);
        continue;
      }
      const data = await readJson(path.join(dir, f));
      const bytes = Buffer.byteLength(JSON.stringify(data));
      // Firestore giới hạn 1 MB mỗi document. Nội dung bài học rất xa mức đó,
      // nhưng cứ cảnh báo sớm còn hơn để lỗi lúc ghi.
      if (bytes > 900_000) {
        console.error(`  ✖ ${f} nặng ${(bytes / 1024).toFixed(0)} KB — sát giới hạn 1 MB của Firestore`);
        process.exitCode = 1;
        continue;
      }
      console.log(`  days/${slug}/collections/${name}  ← ${f}  (${(bytes / 1024).toFixed(0)} KB)`);
      if (store) await store.doc(`days/${slug}/collections/${name}`).set(data);
    }
  }

  const list = only ? Array.from(new Set([...index.days, only])) : index.days;
  console.log(`\nmeta/days  ← [${list.join(', ')}]`);
  if (store) await store.doc('meta/days').set({ days: list });

  console.log(dry ? '\n(--dry: chưa ghi gì cả)' : '\n✓ đã đẩy lên Firestore');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
