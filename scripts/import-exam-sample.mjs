#!/usr/bin/env node
// Chuyển ĐỀ MẪU CHÍNH THỨC của ETS thành dữ liệu cho phòng thi.
//
//   npm run import-exam
//
// Nguồn: ETS phát hành công khai miễn phí tại
//   https://www.ets.org/toeic/test-takers/listening-reading/prepare.html
//   → "TOEIC Listening and Reading Sample Tests" (PDF)
// Script tự tải nếu chưa có trong .cache/.
//
// CHỈ LẤY PHẦN ĐỌC (Part 5, 6, 7). Part 1-4 trong file này có câu hỏi, có script
// và có đáp án, nhưng KHÔNG có file audio — thi nghe mà không có tiếng thì không
// còn là thi nghe, nên bỏ. Phần nghe của phòng thi lấy từ audio khoá học
// (content/day-*/listening.json), nơi có tiếng người thật.
//
// Vì sao phải cắt theo CỘT: đề in hai cột, `pdftotext -layout` đọc ngang nên
// câu 131 và câu 134 dính vào cùng một dòng. Cắt nửa trái rồi nửa phải thì mỗi
// câu về đúng một khối.
//
// Kết quả ghi vào content/exam/ — TÁCH HẲN khỏi content/day-*: đề thi không
// thuộc buổi học nào, và nhánh day đang có người khác sửa.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// --- cấu hình -----------------------------------------------------------------
const PDF_URL =
  'https://www.ets.org/content/dam/ets-org/pdfs/toeic/toeic-listening-reading-sample-test.pdf';
const PDF_PATH = '.cache/ets-sample-lr.pdf';
const OUT_DIR = 'content/exam';
const OUT_FILE = join(OUT_DIR, 'ets-sample.json');
const ASSET_DIR = 'public/assets/exam/ets-sample';

const FORM_ID = 'ets1'; // tiền tố id, để sau này thêm đề mẫu thứ hai không đụng nhau
const PAGE_WIDTH = 595; // A4 pt
const COLUMN_SPLIT = 300; // ranh giới hai cột, đo từ trang 12

// Part nào lấy, và câu số bao nhiêu tới bao nhiêu theo đánh số của đề thật.
const READING_PARTS = [
  { part: 5, from: 101, to: 130, label: 'Incomplete Sentences' },
  { part: 6, from: 131, to: 146, label: 'Text Completion' },
  { part: 7, from: 147, to: 200, label: 'Reading Comprehension' },
];

async function main() {
  // Bước 1: có file PDF chưa, chưa thì tải.
  await downloadPdfIfMissing();

  // Bước 2: bảng đáp án chính thức ở cuối file — không có nó thì không chấm được.
  const key = readAnswerKey();
  console.log(`✓ bảng đáp án: ${Object.keys(key).length} câu`);

  // Bước 3: trang nào là phần Đọc.
  const pages = readingPages();
  console.log(`✓ phần Đọc nằm ở trang ${pages[0]}–${pages[pages.length - 1]}`);

  // Bước 4: bóc HAI luồng chữ từ cùng những trang đó, vì trang trộn hai kiểu
  // dàn trang. Câu hỏi in hai cột → phải cắt cột, không thì câu trái dính câu
  // phải. Đoạn văn và dòng "Questions 176-180 refer to…" lại in TRÀN NGANG cả
  // trang → cắt cột là chúng đứt làm đôi giữa chữ ("advertisem" / "ent").
  const columns = pages.map(columnText).join('\n');
  // Giữ số trang theo từng trang: đoạn văn nào là ẢNH thì phải biết nó ở trang
  // nào mới nối được với file ảnh tách ra ở bước sau.
  const wide = pages.map((page) => ({ page, text: pdfText(page) }));

  // Bước 5: tách câu hỏi (từ luồng cột) và đoạn văn (từ luồng tràn ngang).
  const questions = parseQuestions(columns, key);
  const passages = parsePassages(wide);
  console.log(`✓ bóc được ${questions.length} câu hỏi, ${passages.length} đoạn văn`);

  // Bước 6: ảnh của Part 7 (quảng cáo, biểu mẫu) — những đoạn là ẢNH chứ không
  // phải chữ, bóc text ra là trống.
  const images = extractImages(pages);
  console.log(`✓ tách ${images.length} ảnh → ${ASSET_DIR}`);

  // Bước 7: ghép thành file nội dung và ghi ra.
  const file = buildFile(questions, passages, images);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(file, null, 2)}\n`);

  report(file);
}

/** Tải PDF nếu chưa có. Dùng lại bản trong .cache để chạy lại không tốn mạng. */
async function downloadPdfIfMissing() {
  if (existsSync(PDF_PATH)) {
    console.log(`• dùng lại ${PDF_PATH}`);
    return;
  }
  mkdirSync('.cache', { recursive: true });
  console.log(`• tải đề mẫu từ ets.org …`);
  const res = await fetch(PDF_URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`tải PDF hỏng: HTTP ${res.status}`);
  writeFileSync(PDF_PATH, Buffer.from(await res.arrayBuffer()));
  console.log(`✓ lưu ${PDF_PATH}`);
}

/**
 * Bảng "Sample Form Correct Answers" ở cuối file: hai cột
 * `Item Number  Key`, nên một dòng chứa tới hai cặp số-đáp án.
 */
function readAnswerKey() {
  const all = pdfText();
  const at = all.indexOf('Sample Form Correct Answers');
  if (at < 0) throw new Error('không thấy bảng đáp án trong PDF — ETS đổi layout?');

  const key = {};
  for (const [, no, letter] of all.slice(at).matchAll(/\b(\d{1,3})\s+([A-D])\b/g)) {
    key[Number(no)] = letter;
  }
  return key;
}

/** Những trang có câu Part 5-7. Dò theo số câu in trên trang, không chốt cứng số trang. */
function readingPages() {
  const total = Number(
    execFileSync('pdfinfo', [PDF_PATH], { encoding: 'utf8' }).match(/Pages:\s*(\d+)/)[1],
  );
  const min = READING_PARTS[0].from;
  const pages = [];

  for (let p = 1; p <= total; p++) {
    const t = pdfText(p);
    // Trang script cuối file cũng in số câu, nhưng nó đi kèm chữ "Script".
    if (/Sample Form Script|Correct Answers/.test(t)) continue;
    const nums = [...t.matchAll(/^\s*(\d{3})\./gm)].map((m) => Number(m[1]));
    if (nums.some((n) => n >= min)) pages.push(p);
  }
  if (!pages.length) throw new Error('không tìm thấy trang nào của phần Đọc');

  // Lấy CẢ DẢI từ trang đầu tới trang cuối, không chỉ những trang có đánh số
  // câu. Bộ nhiều đoạn in đoạn văn ở một trang rồi câu hỏi ở trang sau, nên
  // trang 18 và 20 không có số câu nào — bỏ chúng là mất luôn đoạn văn của câu
  // 176-180 và 196-200, tức mất 10 câu.
  const first = pages[0];
  const last = pages[pages.length - 1];
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

/** Một trang, đọc cột trái trước rồi cột phải — đúng thứ tự người đọc. */
function columnText(page) {
  const left = pdfText(page, 0, COLUMN_SPLIT);
  const right = pdfText(page, COLUMN_SPLIT, PAGE_WIDTH - COLUMN_SPLIT);
  return `${left}\n${right}`;
}

/**
 * Câu hỏi: `NNN. phần dẫn` rồi bốn dòng `(A) … (D)`.
 *
 * Duyệt theo ĐÚNG những số có trong bảng đáp án, không cắt mù theo dấu chấm.
 * Lý do: Part 6 đánh số câu NGAY TRONG đoạn văn — dưới mỗi chỗ trống có một
 * dòng `131.` — nên cắt theo `^\d{3}\.` sẽ bắt nhầm cái dấu đó và nuốt luôn
 * câu thật. Đi từ bảng đáp án thì mỗi số tìm đúng một lần, và thiếu câu nào
 * báo ngay câu đó.
 */
function parseQuestions(text, key) {
  const out = [];

  for (const no of Object.keys(key).map(Number).sort((a, b) => a - b)) {
    const part = READING_PARTS.find((p) => no >= p.from && no <= p.to);
    if (!part) continue; // câu của Part 1-4, không lấy

    const block = questionBlock(text, no);
    if (!block) continue;

    const options = {};
    for (const [, letter, body] of block.body.matchAll(
      /\(([A-D])\)\s([\s\S]*?)(?=\n\s*\([A-D]\)|$)/g,
    )) {
      options[letter] = clean(cutPageJunk(body));
    }
    if (Object.keys(options).length !== 4) continue;

    out.push({
      id: `${FORM_ID}-q${no}`,
      no,
      part: part.part,
      stem: clean(block.stem),
      options,
      answer: key[no],
      source: { stem: 'ets-sample', options: 'ets-sample', answer: 'ets-sample' },
    });
  }
  return out;
}

/**
 * Khối của MỘT câu: từ `NNN.` tới hết phương án (D).
 *
 * Một số xuất hiện nhiều lần trong trang (dấu chỗ trống của Part 6, số trang,
 * năm trong bài đọc). Chỉ lần xuất hiện nào có đủ bốn phương án ngay sau mới
 * là câu hỏi thật — đó là dấu hiệu phân biệt chắc chắn nhất.
 */
function questionBlock(text, no) {
  const re = new RegExp(`^[ \\t]*${no}\\.[ \\t]`, 'gm');

  for (const m of text.matchAll(re)) {
    const after = text.slice(m.index, m.index + 1600);
    // KHÔNG đòi phải xuống dòng trước `(A)`. Part 5 và 7 in phần dẫn rồi xuống
    // dòng mới tới phương án, nhưng Part 6 in thẳng `131. (A) interest` trên
    // cùng một dòng vì câu hỏi của nó không có phần dẫn — chỗ trống nằm trong
    // đoạn văn. Đòi xuống dòng là mất sạch Part 6.
    const firstOption = after.search(/\([A-D]\)\s/);
    if (firstOption < 0) continue;

    // Phần dẫn không được chứa một số câu khác: nếu có, cái `(A)` tìm thấy là
    // của câu sau chứ không phải của câu này.
    const stem = after.slice(after.indexOf('.') + 1, firstOption);
    if (/^\s*\d{3}\.\s/m.test(stem)) continue;

    // Hết câu khi gặp số câu kế tiếp, hoặc hết khối phương án.
    const rest = after.slice(firstOption);
    const stop = rest.search(/\n\s*\d{3}\.\s/);
    return { stem, body: stop > 0 ? rest.slice(0, stop) : rest };
  }
  return null;
}

/**
 * Đoạn văn của Part 6 và 7: khối chữ sau dòng "Questions N-M refer to …".
 *
 * Quét theo TỪNG TRANG để biết đoạn nằm ở trang nào — cần số trang để nối với
 * ảnh. Đoạn kéo dài tới tiêu đề đoạn kế tiếp, vì bộ nhiều đoạn
 * (double/triple passage) in đoạn ở trang này mà câu hỏi ở trang sau.
 */
function parsePassages(pages) {
  const joined = pages.map((p) => p.text).join('\n');
  const out = [];

  // `\n\s*Questions` chứ không phải `\nQuestions`: tiêu đề đoạn sau có khi thụt
  // vào vài khoảng trắng. Thiếu `\s*` thì đoạn này nuốt luôn đoạn sau — đo
  // được: 7 đoạn chỉ bắt ra 3, mỗi đoạn dài hơn 3000 ký tự.
  const re =
    /Questions\s+(\d{3})[–-](\d{3})\s+refer to ([^.\n]*)\.?\s*\n([\s\S]*?)(?=\n\s*Questions\s+\d{3}|$)/g;

  for (const [, from, to, what, body] of joined.matchAll(re)) {
    const head = `Questions ${from}`;
    const at = pages.find((p) => p.text.includes(head));
    out.push({
      from: Number(from),
      to: Number(to),
      page: at ? at.page : null,
      kind: clean(what).replace(/^the following\s*/i, ''),
      text: stripQuestions(body),
    });
  }
  return out;
}

/**
 * Bỏ phần câu hỏi ra khỏi đoạn văn.
 *
 * BẮT BUỘC, không phải dọn cho đẹp: đoạn nào là ẢNH (quảng cáo, biểu mẫu) thì
 * bóc chữ cả trang chỉ ra được đúng khối câu hỏi bên dưới. Để nguyên là màn
 * đọc hiểu hiện ra sẵn cả câu hỏi lẫn bốn phương án — tức lộ đề.
 *
 * Cắt ở số câu đầu tiên CÓ PHƯƠNG ÁN đi kèm, chứ không phải số đầu tiên gặp:
 * trong đoạn của Part 6, dưới mỗi chỗ trống có một dòng đánh số (`131.`) để
 * người đọc biết chỗ đó là câu mấy. Cắt ở đó là mất gần hết lá thư — đo được:
 * đoạn 1525 ký tự chỉ còn 194.
 */
function stripQuestions(body) {
  let kept = body;
  for (const m of body.matchAll(/^\s*\d{3}\.\s/gm)) {
    if (/\([A-D]\)\s/.test(body.slice(m.index, m.index + 220))) {
      kept = body.slice(0, m.index);
      break;
    }
  }

  // Quét thêm một lượt theo DÒNG. Cắt một nhát ở trên vẫn sót, vì đoạn của bộ
  // nhiều trang mang theo đuôi khối câu hỏi của trang trước: mấy dòng `(B) …`
  // nối tiếp không có số câu đứng đầu nên nhát cắt không thấy chúng.
  const text = clean(
    kept
      .split('\n')
      .filter((line) => !/^\s*(\([A-D]\)\s|\d{3}\.\s)/.test(line))
      .join('\n'),
  );

  // Còn sót `(A)` sau cả hai lượt lọc thì đây KHÔNG phải đoạn văn — đó là khối
  // câu hỏi in hai cột bị `pdftotext` kéo chung vào một dòng, lọc theo dòng
  // không tách nổi. Bỏ hẳn phần chữ và để bài đọc dựa vào ảnh: thà thiếu chữ
  // còn hơn hiện sẵn bốn phương án cho người đang thi.
  return /\([A-D]\)\s/.test(text) ? '' : text;
}

/** Ảnh nhúng của các trang phần Đọc. */
function extractImages(pages) {
  mkdirSync(ASSET_DIR, { recursive: true });
  const made = [];

  for (const p of pages) {
    const prefix = join(ASSET_DIR, `p${p}`);
    try {
      execFileSync('pdfimages', ['-png', '-f', String(p), '-l', String(p), PDF_PATH, prefix]);
    } catch {
      continue; // trang không có ảnh thì pdfimages không tạo file nào
    }
    const list = execFileSync('pdfimages', ['-list', '-f', String(p), '-l', String(p), PDF_PATH], {
      encoding: 'utf8',
    });
    const n = list.split('\n').length - 3;
    for (let i = 0; i < Math.max(n, 0); i++) {
      const f = `${prefix}-${String(i).padStart(3, '0')}.png`;
      // Bỏ tiền tố `public/`, KHÔNG thay nó bằng `assets/` — đường dẫn đã có
      // sẵn `assets/` rồi, thay vào là ra `/assets/assets/…`.
      if (existsSync(f)) made.push({ page: p, path: `/${f.replace(/^public\//, '')}` });
    }
  }
  return made;
}

/** Ghép câu hỏi + đoạn văn thành các BỘ, một bộ là một đơn vị đề. */
function buildFile(questions, passages, images) {
  const sets = [];

  // Part 5: mỗi câu đứng một mình, gom hết vào một bộ.
  const p5 = questions.filter((q) => q.part === 5);
  if (p5.length) {
    sets.push({
      id: `${FORM_ID}-p5`,
      part: 5,
      title: 'Part 5 — Incomplete Sentences',
      passage: null,
      questions: p5,
    });
  }

  // Part 6 và 7: mỗi đoạn văn là một bộ, kèm các câu hỏi về nó.
  for (const p of passages) {
    const qs = questions.filter((q) => q.no >= p.from && q.no <= p.to);
    if (!qs.length) continue;
    // Đoạn gần như không còn chữ nghĩa là nó vốn là một bức ảnh trong PDF.
    // Lấy ảnh của ĐÚNG trang đó, không bốc bừa ảnh chưa dùng — mỗi trang
    // thường có nhiều ảnh và lấy nhầm thì bài đọc hiển thị sai hẳn nội dung.
    const img = p.text.length < 120 ? images.find((i) => i.page === p.page && !i.used) : null;
    if (img) img.used = true;

    sets.push({
      id: `${FORM_ID}-p${qs[0].part}-${p.from}`,
      part: qs[0].part,
      title: `Part ${qs[0].part} — câu ${p.from}–${p.to}`,
      passage: { kind: p.kind, text: p.text || null, image: img ? img.path : null },
      questions: qs,
    });
  }

  return {
    collection: 'exam',
    form: FORM_ID,
    title: 'Đề mẫu chính thức ETS — phần Đọc',
    note:
      'Nguồn: TOEIC Listening and Reading Sample Tests, ETS phát hành miễn phí. ' +
      'Chỉ dùng để tự ôn, giữ repo ở chế độ riêng tư.',
    schemaVersion: 1,
    sets,
  };
}

/** In ra để người chạy biết đã lấy được gì, và thiếu gì. */
function report(file) {
  const byPart = {};
  for (const s of file.sets) {
    byPart[s.part] = (byPart[s.part] || 0) + s.questions.length;
  }
  console.log(`\n→ ${OUT_FILE}`);
  for (const p of READING_PARTS) {
    const have = byPart[p.part] || 0;
    const need = p.to - p.from + 1;
    console.log(`   Part ${p.part} (${p.label}): ${have} câu — đề thật cần ${need}`);
  }
  // Phương án dài bất thường gần như luôn là rác của trang in dính vào, không
  // phải một đáp án dài thật. Báo ra để lần nhập đề sau không âm thầm lọt.
  const LONGEST_REAL_OPTION = 150;
  const bloated = file.sets
    .flatMap((s) => s.questions)
    .filter((q) => Object.values(q.options).some((v) => v.length > LONGEST_REAL_OPTION));
  if (bloated.length) {
    console.log(`   ⚠ ${bloated.length} câu có phương án dài quá ${LONGEST_REAL_OPTION} ký tự, xem lại: ${bloated.map((q) => q.no).join(', ')}`);
  }

  const noAnswer = file.sets.flatMap((s) => s.questions).filter((q) => !q.answer);
  if (noAnswer.length) {
    console.log(`   ⚠ ${noAnswer.length} câu chưa khớp được đáp án: ${noAnswer.map((q) => q.no).join(', ')}`);
  }
}

// --- tiện ích nhỏ --------------------------------------------------------------
/** Chạy pdftotext; có x/W thì chỉ lấy một dải ngang của trang (một cột). */
function pdfText(page, x, w) {
  const args = ['-layout'];
  if (page) args.push('-f', String(page), '-l', String(page));
  if (x !== undefined) args.push('-x', String(x), '-y', '0', '-W', String(w), '-H', '842');
  args.push(PDF_PATH, '-');
  return execFileSync('pdftotext', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

/**
 * Cắt phần rác của trang in dính vào cuối một phương án.
 *
 * Phương án CUỐI (D) chạy tới hết khối, mà sau nó trên trang giấy còn có số
 * trang, dòng "Unauthorized copying…" và phần Directions của Part tiếp theo.
 * Đo được: đáp án D của câu 147 dài ra thành "It has been on sale for six
 * months. 12 Unauthorized copying or re exts… Select the A), (B), (C), or (D)
 * on your answer sheet." — người thi đọc vào là biết ngay câu này bất thường.
 *
 * Khớp theo MẢNH chữ chứ không khớp cả câu: cắt cột làm dòng footer đứt đôi,
 * nên "Unauthorized copying or reuse of this page is illegal" không bao giờ
 * xuất hiện nguyên vẹn.
 */
const PAGE_JUNK =
  /Unauthorized copying|use of this page|Directions:|GO ON TO THE NEXT PAGE|time is called|Do NOT turn|Stop!|end of the test|Questions\s+\d{3}/i;

function cutPageJunk(body) {
  const m = body.match(PAGE_JUNK);
  if (!m) return body;
  // Lùi về đầu dòng chứa mảnh rác, để không cắt giữa chừng một câu hợp lệ.
  const lineStart = body.lastIndexOf('\n', m.index);
  return body.slice(0, lineStart > 0 ? lineStart : m.index);
}

const clean = (s) =>
  s
    .replace(/Unauthorized copying or reuse of this page is illegal\./g, '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

/** Trang in hai cột nên một câu có thể bị bắt hai lần; giữ bản dài hơn. */
function dedupe(items) {
  const best = new Map();
  for (const q of items) {
    const old = best.get(q.no);
    if (!old || q.stem.length > old.stem.length) best.set(q.no, q);
  }
  return [...best.values()].sort((a, b) => a.no - b.no);
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
