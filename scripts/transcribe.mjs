#!/usr/bin/env node
// Chép lời audio bằng whisper.cpp chạy hoàn toàn ở máy — không gọi API, không tốn tiền.
//
//   node scripts/transcribe.mjs day-1              chép mọi bộ bài chưa có transcript
//   node scripts/transcribe.mjs day-1 --set hw1    chỉ một bộ
//   node scripts/transcribe.mjs day-1 --force      chép lại cả những câu đã có
//
// Kết quả ghi thẳng vào content/<day>/listening.json:
//   dictation → question.transcript = "cả câu nghe được"
//   choice    → question.transcript = { A: "…", B: "…", C: "…", D: "…" }
//
// LƯU Ý: whisper SẼ SAI ở từ hiếm và giọng nhanh. Mọi field ghi ra đều mang
// source 'whisper' = bản nháp chờ người soát, KHÔNG phải đáp án chính thức.

import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');

// Đặt mặc định ngay trong script: npm script không đặt được biến môi trường theo
// kiểu `VAR=x lệnh` trên Windows (cmd.exe không hiểu cú pháp đó).
const MODEL_ENV = process.env.WHISPER_MODEL || '.cache/models/ggml-small.en.bin';

/** whisper-cpp cài qua brew có tên binary khác nhau tuỳ bản. */
async function findWhisper() {
  for (const bin of ['whisper-cli', 'whisper-cpp', 'main']) {
    try {
      // Gọi thẳng binary thay vì hỏi `which` — Windows không có `which`.
      await run(bin, ['--help']);
      return bin;
    } catch (e) {
      if (e.code !== 'ENOENT') return bin; // chạy được nhưng --help trả mã khác 0
    }
  }
  throw new Error(
    'Không tìm thấy whisper. macOS: brew install whisper-cpp ffmpeg. ' +
      'Windows: tải whisper-bin-x64.zip của whisper.cpp rồi thêm thư mục chứa whisper-cli.exe vào PATH.',
  );
}

/** whisper.cpp chỉ nhận WAV 16kHz mono, nên phải chuyển qua ffmpeg trước. */
async function toWav(mp3, wav) {
  await run('ffmpeg', ['-y', '-i', mp3, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
}

async function transcribe(bin, wav, model) {
  const args = ['-f', wav, '-l', 'en', '-nt', '--output-txt', '-of', wav.replace(/\.wav$/, '')];
  if (model) args.push('-m', model);
  await run(bin, args, { maxBuffer: 1024 * 1024 * 32 });
  const txt = await readFile(wav.replace(/\.wav$/, '') + '.txt', 'utf8');
  return txt.replace(/\s+/g, ' ').trim();
}

/**
 * Audio của câu trắc nghiệm đọc liền các phương án: "(A) … (B) … (C) … (D) …".
 * Whisper chép ra một chuỗi dài, ở đây cắt lại theo dấu hiệu A/B/C/D.
 * Cắt không được thì trả null — thà để trống còn hơn cắt sai rồi hiện đáp án lệch.
 *
 * `letters` là phương án của bộ: A–D, hoặc A–C ở Part 2. Part 2 còn đọc câu
 * hỏi TRƯỚC phương án A — phần đứng trước dấu "A" được giữ vào `Q` (bỏ số
 * hiệu câu "Number 7." / "7." ở đầu).
 */
function splitChoices(text, letters, withQuestion) {
  const marks = [...text.matchAll(/\(?\b([A-D])[)\].:]\s+/g)];
  if (marks.length < letters.length) return null;

  const out = {};
  if (withQuestion) {
    const q = text
      .slice(0, marks[0].index)
      .replace(/^\s*(Number|No\.?|Question)?\s*\d+[.:]?\s*/i, '')
      .trim();
    if (q) out.Q = q;
  }
  for (let i = 0; i < marks.length; i++) {
    const letter = marks[i][1];
    const start = marks[i].index + marks[i][0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
    out[letter] = text.slice(start, end).trim();
  }
  const ok = letters.every((k) => out[k]) && (!withQuestion || out.Q);
  return ok ? out : null;
}

async function main() {
  const [slug, ...rest] = process.argv.slice(2);
  if (!slug) {
    console.error('Cách dùng: node scripts/transcribe.mjs <day-slug> [--set <code>] [--force]');
    process.exit(1);
  }
  const force = rest.includes('--force');
  const onlySet = rest.includes('--set') ? rest[rest.indexOf('--set') + 1] : null;

  const bin = await findWhisper();
  const file = path.join(ROOT, 'content', slug, 'listening.json');
  const data = JSON.parse(await readFile(file, 'utf8'));

  const tmp = await mkdtemp(path.join(tmpdir(), 'toeic-'));
  let done = 0;
  let failed = 0;
  const unsplit = [];

  try {
    for (const set of data.items) {
      if (onlySet && set.code !== onlySet) continue;
      // Bộ câu hỏi Part 3: phương án in sẵn trong đề, audio là cả đoạn hội
      // thoại — lời thoại đó nằm ở bộ chép hội thoại đi kèm, không chép lại ở đây.
      if (set.part === 3 && set.mode === 'choice') continue;

      for (const q of set.questions) {
        if (q.transcript && !force) continue;

        const mp3 = path.join(ROOT, 'public', q.audio.replace(/^\//, ''));
        if (!existsSync(mp3)) {
          console.log(`  ✖ ${q.id}: không thấy file ${q.audio}`);
          failed++;
          continue;
        }

        process.stdout.write(`  ${q.id} … `);
        const wav = path.join(tmp, `${q.id}.wav`);
        try {
          await toWav(mp3, wav);
          const text = await transcribe(bin, wav, MODEL_ENV);

          // Part 2 luôn là câu hỏi + ba phương án, kể cả khi bộ đó luyện bằng
          // cách chép lại — chép thì vẫn cần biết ranh giới câu hỏi/phương án.
          const isPart2 = set.part === 2;
          if (set.mode === 'choice' || isPart2) {
            const letters = set.choices || ['A', 'B', 'C', 'D'];
            const split = splitChoices(text, letters, isPart2);
            if (split) {
              q.transcript = split;
              console.log(`${isPart2 ? 'câu hỏi + ' : ''}${letters.length} phương án ✓`);
            } else if (set.mode === 'dictation') {
              // Bộ chép chấm theo cả chuỗi, không cần ranh giới phương án — và
              // nhiều bài luyện Part 2 vốn không đọc "A, B, C". Giữ nguyên chuỗi.
              q.transcript = text.replace(/^\s*(Number|No\.?|Question)?\s*\d+[.:]?\s*/i, '');
              console.log('chuỗi liền (không đọc A/B/C) ✓');
            } else {
              // Không cắt được thì giữ nguyên văn để người soát tự cắt.
              q.transcript = { raw: text };
              unsplit.push(q.id);
              console.log(`⚠ không tách được ${letters.join('/')}`);
            }
          } else {
            q.transcript = text;
            console.log(`"${text.slice(0, 60)}${text.length > 60 ? '…' : ''}"`);
          }

          q.source = { ...q.source, transcript: 'whisper' };
          done++;
        } catch (e) {
          console.log(`✖ ${e.message.split('\n')[0]}`);
          failed++;
        }
      }
    }

    await writeFile(file, JSON.stringify(data, null, 2) + '\n');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  console.log(`\n✓ chép được ${done} câu, lỗi ${failed}`);
  if (unsplit.length) {
    console.log(`⚠ ${unsplit.length} câu không tách được phương án, đang để ở dạng { raw }:`);
    console.log(`  ${unsplit.join(', ')}`);
  }
  console.log('⚠ Toàn bộ mang source "whisper" — là BẢN NHÁP, phải soát lại trước khi tin.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
