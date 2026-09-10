#!/usr/bin/env node
// MỘT LẦN: chuyển tiến độ bài chép từ dạng cũ (mỗi câu ba ô, mỗi ô chép phần
// nối sau chủ ngữ cho sẵn) sang dạng mới (mỗi câu MỘT ô, chép cả câu).
//
//   node scripts/migrate-dictation.mjs           xem trước, KHÔNG ghi
//   node scripts/migrate-dictation.mjs --write   ghi thật
//
// Ví dụ một câu được chuyển:
//   cũ  ["typing on the keyboard", "sitting at his desk", "wearing gloves"]
//        + prompts ["He's", "He's", "He's"]
//   mới ["He's typing on the keyboard. He's sitting at his desk. He's wearing gloves."]
//
// Chỉ sửa trên Firestore, không đụng tới localStorage — và không cần đụng: luật
// gộp (features/progress/merge.js) lấy bản updatedAt mới hơn cho từng id, nên
// bản vừa migrate sẽ thắng bản cũ còn nằm trong trình duyệt ngay lần mở sau.
//
// AN TOÀN: hàm chuyển là idempotent (chạy lại không hỏng thêm), và luôn ghi một
// bản sao lưu ra .cache/ trước khi sửa bất cứ thứ gì.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { checkLine, spokenText } from '../features/listening/dictation.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const KEY_PATH = path.join(ROOT, '.cache', 'firebase-admin.json');
const write = process.argv.includes('--write');

const readJson = async (p) => JSON.parse(await readFile(p, 'utf8'));
const norm = (s) => (s || '').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

/**
 * Ghép các ô cũ của một câu thành một chuỗi.
 *
 * Trả về null khi KHÔNG cần đụng vào — đã là dạng mới, hoặc rỗng. Trả về null
 * chứ không trả chuỗi cũ, để bên gọi phân biệt được "đã chuyển" và "khỏi chuyển".
 */
export function toSingleLine(lines, prompts) {
  if (!Array.isArray(lines) || !lines.length) return null;
  if (!lines.some((l) => norm(l))) return null;

  // Một ô duy nhất và nó đã mở đầu bằng chủ ngữ cho sẵn → coi như đã là dạng
  // mới, để yên. Nhờ nhánh này mà chạy lại script lần hai không ghép chồng lên.
  if (lines.length === 1 && prompts[0]?.prefix) {
    const only = norm(lines[0]);
    if (only.toLowerCase().startsWith(norm(prompts[0].prefix).toLowerCase())) return null;
  }

  const parts = [];
  lines.forEach((raw, i) => {
    const body = norm(raw);
    if (!body) return; // ô bỏ trống thì bỏ hẳn, đừng đẻ ra "He's ."

    const prefix = norm(prompts[i]?.prefix || '');
    const suffix = norm(prompts[i]?.suffix || '');

    // Người học có thể đã tự gõ cả chủ ngữ vào ô — đừng nhân đôi nó.
    const hasPrefix = prefix && body.toLowerCase().startsWith(prefix.toLowerCase());

    // Chủ ngữ cho sẵn đã nuốt sẵn động từ ("He's" = "He is"), mà nhiều ô lại
    // được gõ như thể chủ ngữ chỉ là "He" — nối thẳng thì ra "He's is typing".
    // Bỏ động từ thừa ở đầu phần gõ tay.
    let tail = body;
    if (!hasPrefix) {
      if (/'s$/i.test(prefix)) tail = tail.replace(/^is\s+/i, '');
      else if (/'re$/i.test(prefix)) tail = tail.replace(/^are\s+/i, '');
    }

    let sentence = hasPrefix || !prefix ? body : `${prefix} ${tail}`;
    if (suffix && !sentence.toLowerCase().endsWith(suffix.toLowerCase())) {
      sentence = `${sentence} ${suffix}`;
    }
    if (!/[.!?]$/.test(sentence)) sentence += '.';
    parts.push(sentence);
  });

  return parts.length ? parts.join(' ') : null;
}

/**
 * Bóc ghi chú trên lớp thành bài chép.
 *
 * Bộ trắc nghiệm không có đáp án chính thức trước đây là một ô ghi chú tự do,
 * người học tự gõ theo khuôn "A. câu / B. câu / …" kèm một dòng chỉ có chữ cái
 * là phương án mình chọn. Giờ ô đó là ô CHÉP và được chấm, nên phải bỏ ký hiệu
 * phương án đi — để lại thì từ nào cũng lệch và câu nào cũng báo sai.
 *
 * Trả về { text, boLai } — `boLai` là chữ cái đã chọn, cố ý in ra cho người
 * dùng thấy vì chấm không dùng tới nó nữa mà nó vẫn là bài của họ.
 */
export function cleanNote(lines) {
  const raw = (lines || []).join('\n');
  if (!raw.trim()) return null;

  const rows = raw.split('\n').map(norm).filter(Boolean);
  // Đã bóc rồi thì thôi: một dòng, không còn ký hiệu "A." nào ở đầu.
  if (rows.length === 1 && !/^[A-D][.)]\s/i.test(rows[0])) return null;

  const boLai = [];
  const parts = [];

  for (const row of rows) {
    if (/^[A-D]$/i.test(row)) {
      boLai.push(row.toUpperCase()); // dòng chỉ có chữ cái = phương án đã chọn
      continue;
    }
    const body = norm(row.replace(/^[A-D][.)]\s*/i, ''));
    if (!body) continue;
    parts.push(/[.!?]$/.test(body) ? body : `${body}.`);
  }

  return parts.length ? { text: parts.join(' '), boLai } : null;
}

/**
 * questionId → { prompts, transcript, kieu }.
 *   kieu "chep"   bộ mode="dictation", cần ghép ba ô thành một
 *   kieu "ghichu" bộ trắc nghiệm không có key, cần bóc ký hiệu A–D
 */
async function dictationQuestions() {
  const index = await readJson(path.join(ROOT, 'content', 'days.json'));
  const map = new Map();

  for (const slug of index.days) {
    const file = path.join(ROOT, 'content', slug, 'listening.json');
    if (!existsSync(file)) continue;
    const data = await readJson(file);
    for (const set of data.items) {
      const kieu = set.mode === 'dictation' ? 'chep' : set.hasKey ? null : 'ghichu';
      if (!kieu) continue;
      for (const q of set.questions)
        map.set(q.id, { prompts: q.prompts || [], transcript: q.transcript, kieu });
    }
  }
  return map;
}

if (!existsSync(KEY_PATH)) {
  console.error(`✖  Thiếu ${path.relative(ROOT, KEY_PATH)} — xem README mục "Getting started".`);
  process.exit(1);
}

const questions = await dictationQuestions();
console.log(`Nắm được prompts của ${questions.size} câu chép.\n`);

initializeApp({ credential: cert(await readJson(KEY_PATH)) });
const db = getFirestore();

const backup = {};
const plan = [];

for (const user of await db.collection('progress').listDocuments()) {
  for (const daySnap of (await user.collection('days').get()).docs) {
    const data = daySnap.data();
    backup[`${user.id}/${daySnap.id}`] = data;

    const dict = data.dictation || {};
    const changes = {};
    const graded = {};
    const boLai = {};

    for (const [qid, lines] of Object.entries(dict)) {
      // Bộ trắc nghiệm CÓ đáp án chính thức không nằm trong map — ô của nó là
      // ô chép mới tinh, chưa ai gõ gì theo khuôn cũ, không có gì để chuyển.
      if (!questions.has(qid)) continue;
      const q = questions.get(qid);

      let merged = null;
      if (q.kieu === 'chep') {
        merged = toSingleLine(lines, q.prompts);
      } else {
        const done = cleanNote(lines);
        if (done) {
          merged = done.text;
          if (done.boLai.length) boLai[qid] = done.boLai;
        }
      }

      if (merged !== null) {
        changes[qid] = [merged];
        // Bài đã chép đúng thì sau khi chuyển phải chấm ra "đúng" — nếu không,
        // migration đã bẻ mất công của người học.
        graded[qid] = checkLine(merged, spokenText(q.transcript)).status;
      }
    }

    if (Object.keys(changes).length) {
      plan.push({ ref: daySnap.ref, uid: user.id, day: daySnap.id, changes, graded, boLai, before: dict });
    }
  }
}

if (!plan.length) {
  console.log('✓ Không có gì để chuyển — mọi tiến độ đã ở dạng mới.');
  process.exit(0);
}

for (const p of plan) {
  console.log(`${p.uid.slice(0, 8)}… / ${p.day} — ${Object.keys(p.changes).length} câu`);
  for (const [qid, [after]] of Object.entries(p.changes)) {
    console.log(`   ${qid}  ${p.graded[qid] === 'correct' ? '✓ chấm ra ĐÚNG' : '· vốn đã sai từ trước'}`);
    console.log(`     cũ  ${JSON.stringify(p.before[qid])}`);
    console.log(`     mới "${after}"`);
    // In ra chứ không nuốt: chấm không dùng tới nữa nhưng nó vẫn là bài họ làm.
    if (p.boLai?.[qid]) console.log(`     ⚠ bỏ lại phương án đã chọn: ${p.boLai[qid].join(', ')}`);
  }
  console.log('');
}

const total = plan.reduce((n, p) => n + Object.keys(p.changes).length, 0);
const ok = plan.reduce(
  (n, p) => n + Object.values(p.graded).filter((s) => s === 'correct').length,
  0,
);
console.log(`Trong ${total} câu, ${ok} câu sau khi chuyển sẽ chấm ra ĐÚNG.\n`);

if (!write) {
  console.log(`Xem trước: sẽ đổi ${total} câu ở ${plan.length} document.`);
  console.log('Chạy lại với --write để ghi thật.');
  process.exit(0);
}

await mkdir(path.join(ROOT, '.cache'), { recursive: true });
const backupPath = path.join(ROOT, '.cache', `progress-backup-${Date.now()}.json`);
await writeFile(backupPath, `${JSON.stringify(backup, null, 2)}\n`);
console.log(`Sao lưu nguyên trạng: ${path.relative(ROOT, backupPath)}`);

// updatedAt mới là thứ khiến bản này thắng bản cũ còn trong localStorage.
const stamp = new Date().toISOString();

for (const p of plan) {
  await p.ref.set(
    { dictation: { ...p.before, ...p.changes }, updatedAt: stamp },
    { merge: true },
  );
  console.log(`✓ ${p.uid.slice(0, 8)}… / ${p.day}`);
}

console.log(`\n✓ Đã chuyển ${total} câu ở ${plan.length} document.`);
process.exit(0);
