#!/usr/bin/env node
// Dựng bảng xếp hạng từ tiến độ đã có.
//
//   node scripts/backfill-leaderboard.mjs           xem trước, KHÔNG ghi
//   node scripts/backfill-leaderboard.mjs --write   ghi thật
//
// Vì sao cần: doc `leaderboard/<uid>` chỉ sinh ra khi người học mở trang chủ
// sau khi tính năng này lên. Không backfill thì bảng trống trơn cho tới khi
// từng người quay lại, kể cả người đã học cả tháng.
//
// Chỉ chạy được bằng Admin SDK, và đó chính là lý do phải có doc riêng: client
// KHÔNG liệt kê được uid (doc `progress/<uid>` chỉ là vỏ chứa subcollection nên
// truy vấn thường trả rỗng) và cũng KHÔNG liệt kê được user của Firebase Auth,
// nơi duy nhất có tên người dùng.

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { totalScore, displayNameOf } from '../features/leaderboard/score.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const KEY_PATH = path.join(ROOT, '.cache', 'firebase-admin.json');
const write = process.argv.includes('--write');

if (!existsSync(KEY_PATH)) {
  console.error(`✖  Thiếu ${path.relative(ROOT, KEY_PATH)} — xem README mục "Getting started".`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(await readFile(KEY_PATH, 'utf8'))) });
const db = getFirestore();
const auth = getAuth();

/** Hồ sơ Google nằm ở providerData, KHÔNG ở cấp tài khoản — app đăng nhập bằng
 *  linkWithPopup nên Firebase không tự chép hồ sơ lên. Nhìn nhầm chỗ sẽ tưởng
 *  Google không trả tên về. */
function profileOf(user) {
  const p = user.providerData?.find((x) => x.displayName || x.email) || {};
  return {
    name: user.displayName || p.displayName || null,
    photo: user.photoURL || p.photoURL || null,
    email: user.email || p.email || null,
    anonymous: !user.providerData?.length,
  };
}

const plan = [];
const skipped = [];

for (const userRef of await db.collection('progress').listDocuments()) {
  const uid = userRef.id;

  let user;
  try {
    user = await auth.getUser(uid);
  } catch {
    skipped.push(`${uid.slice(0, 8)}… — không còn tài khoản`);
    continue;
  }

  const p = profileOf(user);
  if (p.anonymous) {
    skipped.push(`${uid.slice(0, 8)}… — ẩn danh, không lên bảng`);
    continue;
  }

  // Gom mọi buổi về đúng hình dạng mà totalScore() nhận: { "day-1": {...} }
  const days = {};
  for (const d of (await userRef.collection('days').get()).docs) days[d.id] = d.data();

  plan.push({
    uid,
    name: displayNameOf(p),
    photo: p.photo || null,
    score: totalScore(days),
    soBuoi: Object.keys(days).length,
  });
}

plan.sort((a, b) => b.score - a.score);

for (const s of skipped) console.log(`·  ${s}`);
console.log();

if (!plan.length) {
  console.log('Không có tài khoản nào đủ điều kiện lên bảng.');
  process.exit(0);
}

plan.forEach((r, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${r.name.padEnd(22)} ${String(r.score).padStart(4)} điểm   (${r.soBuoi} buổi, ảnh: ${r.photo ? 'có' : 'không'})`);
});

if (!write) {
  console.log(`\nXem trước: sẽ ghi ${plan.length} doc vào leaderboard/. Chạy lại với --write để ghi thật.`);
  process.exit(0);
}

const stamp = new Date().toISOString();
for (const r of plan) {
  await db.collection('leaderboard').doc(r.uid).set({
    name: r.name,
    photo: r.photo,
    score: r.score,
    updatedAt: stamp,
  });
}

console.log(`\n✓ Đã ghi ${plan.length} doc vào leaderboard/.`);
process.exit(0);
