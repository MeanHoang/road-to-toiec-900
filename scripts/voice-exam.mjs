#!/usr/bin/env node
// Sinh audio phần Nghe cho một đề thi, từ script có sẵn trong đề.
//
//   npm run voice-exam                       đề ets-full-1
//   npm run voice-exam -- ets-full-2         đề khác
//   npm run voice-exam -- --force            đọc lại cả file đã có
//
// Đề ETS miễn phí có script mà không có băng, nên máy đọc lại script bằng giọng
// có sẵn của macOS (`say`) — cùng cách với voice-vocab.mjs. Mỗi người nói trong
// script có nhãn giọng (`M-Au` nam Úc, `W-Br` nữ Anh…) và được gán một giọng
// riêng, để nghe ra ai đang nói như băng thật.
//
// Khoảng nghỉ của băng thật (`[8 seconds]` sau mỗi câu hỏi Part 3-4, 5 giây
// sau mỗi câu Part 1-2) được giữ NGUYÊN trong file. Nhờ vậy đồng hồ phần Nghe
// chỉ cần cộng độ dài các file là ra đúng nhịp đề thật.
//
// Ghi lại đường dẫn và độ dài từng file vào chính file đề (`audio`,
// `audioSeconds`), rồi commit cả hai. Máy khác chỉ việc phát.

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);

// --- cấu hình -----------------------------------------------------------------
const FORM_ID = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'ets-full-1';
const FORCE = process.argv.includes('--force');
const FORM_FILE = `content/exam/${FORM_ID}.json`;
const AUDIO_DIR = `public/assets/exam/${FORM_ID}/audio`;
const AUDIO_URL = `/assets/exam/${FORM_ID}/audio`;
const TMP_DIR = `.cache/voice-${FORM_ID}`;

// Nhãn giọng trong script ETS → giọng macOS.
//
// CHỈ dùng nhóm giọng Samantha / Daniel / Karen / Moira. Nhóm "Eloquence"
// (Reed, Eddy, Shelley…) đọc rời từng chữ, nghe như máy đời cũ — bản đầu dùng
// chúng cho 2/3 số chữ của đề và bị chê "tách nhau, không rõ ràng".
//
// Máy chỉ có MỘT giọng nam dùng được (Daniel), nên nam Úc và nam Canada đọc
// chung. Không lẫn người nói: trong đề không bài nào có cả hai giọng nam này.
//
// Tải giọng "Premium" trong System Settings → Accessibility → Spoken Content
// rồi sửa tên ở đây là nghe tự nhiên hơn hẳn; chạy lại với --force.
const VOICES = {
  N: 'Karen', // người dẫn — khác hẳn giọng hai người nữ trong hội thoại
  'M-Am': 'Daniel',
  'M-Cn': 'Daniel',
  'M-Au': 'Daniel',
  'M-Br': 'Daniel',
  'W-Am': 'Samantha',
  'W-Cn': 'Samantha',
  'W-Br': 'Moira',
  'W-Au': 'Karen',
};
// Tốc độ đọc mục tiêu (từ/phút), ĐO từ audio thật của khoá học —
// chỉ tính thời gian có tiếng, bỏ khoảng lặng:
//   Part 2 (d5-ex1, 26 câu, có transcript):          155 từ/phút
//   Part 3 (32-34, 35-37 của day-4, chép bằng whisper): 189 và 164 từ/phút
// Để mặc định thì máy đọc Part 2 ở 193 từ/phút — nhanh hơn băng thật ~25%.
// Part 3-4 lấy bài chậm nhất đo được.
//
// Làm chậm bằng `atempo` của ffmpeg (giữ cao độ), KHÔNG bằng cờ `-r` của
// `say`: cờ đó nhảy theo nấc — đo được `-r 164` ra file dài đúng bằng khi để
// mặc định, nên Part 3-4 không chậm đi chút nào.
const WORDS_PER_MINUTE = { 1: 155, 2: 155, 3: 164, 4: 164 };
const GAP_SECONDS = 0.5; // khoảng lặng giữa hai lượt nói
const SAMPLE_RATE = 22050; // tần số gốc `say` xuất ra — nâng lên không thêm chi tiết nào
// Độ to chuẩn cho giọng nói phát trên mạng (−16 LUFS, đỉnh −1,5 dBTP). Mỗi
// giọng macOS to nhỏ khác nhau; không cân thì đoạn này nhỏ, đoạn kia gắt.
const LOUDNESS = 'loudnorm=I=-16:TP=-1.5:LRA=11';
const CONCURRENCY = 4;

async function main() {
  // Bước 1: đọc đề, gom mọi đoạn cần đọc (câu Part 1-2, bài Part 3-4).
  const form = JSON.parse(readFileSync(FORM_FILE, 'utf8'));
  const units = audioUnits(form);
  const missing = Object.keys(Object.fromEntries(units.flatMap((u) => u.owner.script.map((l) => [l.voice])))).filter(
    (v) => !VOICES[v],
  );
  if (missing.length) throw new Error(`chưa gán giọng cho nhãn: ${missing.join(', ')}`);

  mkdirSync(AUDIO_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });

  // Bước 2: đọc từng đoạn ra mp3 (bỏ qua file đã có, trừ khi --force).
  let made = 0;
  await pool(units, CONCURRENCY, async (u) => {
    if (FORCE || !existsSync(u.file)) {
      await speak(u.owner.script, u.file, u.name, WORDS_PER_MINUTE[u.part]);
      made++;
    }
    u.owner.audio = `${AUDIO_URL}/${u.name}.mp3`;
    u.owner.audioSeconds = await duration(u.file);
  });

  // Bước 3: ghi đường dẫn + độ dài vào đề.
  writeFileSync(FORM_FILE, `${JSON.stringify(form, null, 2)}\n`);
  rmSync(TMP_DIR, { recursive: true, force: true });

  const total = units.reduce((n, u) => n + u.owner.audioSeconds, 0);
  console.log(`✓ ${units.length} file (${made} file mới) → ${AUDIO_DIR}`);
  console.log(`  tổng phần Nghe: ${Math.floor(total / 60)} phút ${Math.round(total % 60)} giây`);
}

/** Câu Part 1-2 mỗi câu một file; bài Part 3-4 mỗi bài một file cho cả ba câu. */
function audioUnits(form) {
  const units = [];
  for (const set of form.sets) {
    if (set.script) units.push({ owner: set, part: set.part, name: `p${set.part}-${set.questions[0].no}` });
    for (const q of set.questions) if (q.script) units.push({ owner: q, part: q.part, name: `q${q.no}` });
  }
  return units.map((u) => ({ ...u, file: join(AUDIO_DIR, `${u.name}.mp3`) }));
}

/**
 * Đọc từng lượt nói ra PCM, nối lại kèm khoảng lặng, rồi nén một lần ra mp3.
 * Nối ở dạng PCM thô chứ không qua bộ lọc concat của ffmpeg: khoảng lặng chỉ
 * là một đoạn byte 0, đúng tới từng mẫu, không lệch nhịp.
 */
async function speak(lines, file, name, rate) {
  // Đọc ở tốc độ gốc, đo xem đoạn này đang nói bao nhiêu từ/phút, rồi giãn
  // đúng phần có tiếng về `rate`. Khoảng nghỉ của đề không bị giãn theo.
  const aiffs = [];
  let spoken = 0;
  for (const [i, l] of lines.entries()) {
    const aiff = join(TMP_DIR, `${name}-${i}.aiff`);
    await run('say', ['-v', VOICES[l.voice], '-o', aiff, l.text]);
    aiffs.push(aiff);
    spoken += await duration(aiff);
  }
  const words = lines.reduce((n, l) => n + (l.text.match(/[A-Za-z0-9’'-]+/g) || []).length, 0);
  // Chỉ làm CHẬM, không bao giờ tăng tốc một đoạn vốn đã chậm hơn mục tiêu.
  const tempo = Math.min(1, rate / ((words / spoken) * 60));

  const chunks = [];
  for (const [i, l] of lines.entries()) {
    const { stdout } = await run(
      'ffmpeg',
      ['-loglevel', 'error', '-i', aiffs[i], '-af', `atempo=${tempo.toFixed(4)}`,
        '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE), '-'],
      { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 },
    );
    chunks.push(stdout, silence(GAP_SECONDS + (l.pause || 0)));
  }
  const pcm = join(TMP_DIR, `${name}.pcm`);
  writeFileSync(pcm, Buffer.concat(chunks));
  await run('ffmpeg', [
    '-loglevel', 'error', '-y',
    '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE), '-i', pcm,
    '-af', LOUDNESS, '-ar', String(SAMPLE_RATE),
    '-codec:a', 'libmp3lame', '-b:a', '64k', file,
  ]);
}

async function duration(file) {
  const { stdout } = await run('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', file,
  ]);
  return Math.round(Number(stdout) * 10) / 10;
}

const silence = (seconds) => Buffer.alloc(Math.round(seconds * SAMPLE_RATE) * 2);

/** Chạy `fn` cho mọi phần tử, tối đa `n` việc cùng lúc. */
async function pool(items, n, fn) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: n }, worker));
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
