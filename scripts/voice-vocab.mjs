#!/usr/bin/env node
// Sinh sẵn file phát âm cho từ vựng, bằng giọng có sẵn của macOS.
//
//   npm run voice-vocab            mọi buổi trong days.json
//   npm run voice-vocab day-2      một buổi
//   npm run voice-vocab -- --force sinh lại cả file đã có
//
// VÌ SAO KHÔNG ĐỂ TRÌNH DUYỆT ĐỌC LÚC CHẠY
//
// Trước đây nút loa gọi speechSynthesis của trình duyệt. Nó hỏng theo kiểu tệ
// nhất: engine đọc của Chrome kẹt ở trạng thái "đang đọc" rồi nuốt mọi lệnh sau
// đó — không tiếng, không sự kiện `start`, không cả `error`. Đã đo tận nơi: gọi
// speak() trần ba dòng cũng treo y hệt, trong khi `say` của macOS chạy bình
// thường và loa vẫn kêu. Engine nằm trong tiến trình trình duyệt nên tải lại
// trang không cứu được, và app thì không với tới.
//
// File mp3 sinh sẵn thì không có tầng nào để hỏng. Đổi lại ~1,2 MB trong repo
// cho 118 từ — nhỏ hơn một clip luyện nghe.
//
// Vẫn dùng đúng hai giọng mà trình duyệt vốn sẽ chọn, nên nghe không khác gì.
//
// Cần `ffmpeg` (README đã yêu cầu sẵn cho pipeline import) và macOS cho `say`.
// Sinh một lần rồi commit; máy khác chỉ việc phát.

import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const force = process.argv.includes('--force');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// Daniel và Samantha là hai giọng macOS cài sẵn, cũng chính là hai giọng Chrome
// hay chọn cho en-GB và en-US — nên đổi sang file sinh sẵn không đổi âm nghe.
const GIONG = {
  uk: { say: 'Daniel', lang: 'en-GB' },
  us: { say: 'Samantha', lang: 'en-US' },
};

const readJson = async (p) => JSON.parse(await readFile(path.join(ROOT, p), 'utf8'));

async function coLenh(cmd, args2) {
  try {
    await run(cmd, args2);
    return true;
  } catch {
    return false;
  }
}

/** Đọc một từ ra mp3. Trả về true nếu có sinh file mới. */
async function sinhMot(word, dich, tmp) {
  const aiff = `${tmp}.aiff`;
  await run('say', ['-v', GIONG[dich.he].say, '-o', aiff, word]);
  await run('ffmpeg', [
    '-y',
    '-i', aiff,
    '-codec:a', 'libmp3lame',
    // 48kbps mono 22kHz: thừa cho giọng nói, mà một từ chỉ còn ~4KB.
    '-b:a', '48k',
    '-ac', '1',
    '-ar', '22050',
    dich.file,
  ]);
  await unlink(aiff).catch(() => {});
  return true;
}

async function lamMotBuoi(slug) {
  const file = `content/${slug}/vocabulary.json`;
  if (!existsSync(path.join(ROOT, file))) {
    console.log(`·  ${slug} — không có vocabulary.json, bỏ qua`);
    return;
  }

  const data = await readJson(file);
  const thuMuc = path.join(ROOT, 'public', 'assets', slug, 'voice');
  await mkdir(thuMuc, { recursive: true });

  let moi = 0;
  let boQua = 0;
  const hong = [];

  for (const v of data.items) {
    if (!v.word) continue;
    v.voice = v.voice || {};

    for (const he of Object.keys(GIONG)) {
      const ten = `${v.id}-${he}.mp3`;
      const duongDan = `/assets/${slug}/voice/${ten}`;
      const tuyetDoi = path.join(thuMuc, ten);

      if (existsSync(tuyetDoi) && !force) {
        v.voice[he] = duongDan;
        boQua += 1;
        continue;
      }

      try {
        await sinhMot(v.word, { he, file: tuyetDoi }, path.join(thuMuc, `.tmp-${v.id}-${he}`));
        v.voice[he] = duongDan;
        moi += 1;
      } catch (e) {
        hong.push(`${v.id} (${v.word}) ${he}: ${e.message.split('\n')[0]}`);
      }
    }

    // `tts` KHÔNG phải bản nháp cần soát như `ai` hay `whisper`: nó chỉ là từ
    // đó đọc lên, không phải máy đoán nội dung. Nên validate không đếm nó.
    if (Object.keys(v.voice).length) v.source = { ...v.source, voice: 'tts' };
  }

  await writeFile(path.join(ROOT, file), `${JSON.stringify(data, null, 2)}\n`);

  for (const h of hong) console.log(`✖  ${h}`);
  console.log(`✓  ${slug} — ${moi} file mới, ${boQua} đã có sẵn${hong.length ? `, ${hong.length} lỗi` : ''}`);
}

if (!(await coLenh('say', ['-v', '?']))) {
  console.error('✖  Không chạy được `say` — script này cần macOS.');
  process.exit(1);
}
if (!(await coLenh('ffmpeg', ['-version']))) {
  console.error('✖  Thiếu ffmpeg. Cài bằng: brew install ffmpeg');
  process.exit(1);
}

const index = await readJson('content/days.json');
for (const slug of args.length ? args : index.days) await lamMotBuoi(slug);
