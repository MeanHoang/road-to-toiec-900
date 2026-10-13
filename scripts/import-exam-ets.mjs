#!/usr/bin/env node
// Chuyển ĐỀ THI ĐẦY ĐỦ của ETS (200 câu, 7 Part) thành một đề trong phòng thi.
//
//   npm run import-exam            bóc chữ, ảnh, đáp án, script → content/exam/ets-full-1.json
//   npm run voice-exam             sinh audio phần Nghe từ script (bước sau, file riêng)
//
// Nguồn: "TOEIC Listening and Reading — A Complete Practice Test developed by
// ETS" (PDF 64 trang, © ETS 2017), bản Đại học Hà Nội đăng lại công khai. Đề có
// đủ câu hỏi, tranh, bảng đáp án và SCRIPT phần Nghe, nhưng KHÔNG có file
// audio — audio do `voice-exam` đọc từ chính script này.
//
// Một file = MỘT đề trọn vẹn. Không trộn câu với đề khác, không mượn câu từ
// bài tập các buổi: hai đề không bao giờ chung câu nào.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// --- cấu hình -----------------------------------------------------------------
const PDF_URL =
  'https://siteresources.blob.core.windows.net/siteresourcescontainer/hauportal/media/root/orfeas/ets/toeic/toeic_sample-test_a4_64pg_v30.pdf';
const PDF_PATH = '.cache/ets-full-1.pdf';
const FORM_ID = 'ets-full-1';
const PAPER_NO = 1; // "Đề số 1". Đề sau lấy số kế tiếp, không đánh lại số đề cũ.
const OUT_FILE = `content/exam/${FORM_ID}.json`;
const ASSET_DIR = `public/assets/exam/${FORM_ID}`;
const ASSET_URL = `/assets/exam/${FORM_ID}`;

// Trang của từng phần trong PDF (đếm từ 1).
const PHOTO_PAGES = [3, 4, 5]; // tranh Part 1
const LISTENING_PAGES = [7, 8, 9, 10, 11, 12, 13]; // câu hỏi Part 3-4
const READING_PAGES = range(14, 41); // Part 5-7
const SCRIPT_PAGES = range(48, 63);

const PAGE_WIDTH = 595;
const PAGE_TOP = 36; // dưới lề trên, trên chữ đầu tiên của trang
const COLUMN_SPLIT = 296; // số câu cột phải bắt đầu ở x≈300, cột trái kết thúc trước đó
const RENDER_DPI = 150;

// Bảng đáp án chép từ ẢNH trang 45, KHÔNG bóc từ lớp chữ: trang đó có hai lớp
// chữ chồng nhau, lớp ẩn là bản cũ (câu 107 lớp ẩn ghi B, bản in ghi C). Đã
// đối chiếu từng câu với lớp chữ — chỉ lệch đúng những ô hai lớp khác nhau —
// và câu 90 khớp script ("January twenty-fifth" = D).
const KEY = [
  'DBCAABBCAC', 'ACBAACBACB', 'ABACBBCCBA', 'CCBDBABDBA', 'DCACABCBDD', //   1-50
  'BDDACADBCA', 'CABDDABCBC', 'BCACDBADBB', 'CDADCDABAD', 'CDACCBDADB', //  51-100
  'CBCADACCBD', 'DCADBABBDA', 'BDDCBDAAAC', 'DCBBCDABBC', 'ADACDACBBA', // 101-150
  'ABCADCDCAD', 'BCABCDCBDA', 'BADBCCADBB', 'DBACDCDACB', 'CACADDCBAD', // 151-200
].join('');

const PARTS = [
  { part: 1, from: 1, to: 6 },
  { part: 2, from: 7, to: 31 },
  { part: 3, from: 32, to: 70 },
  { part: 4, from: 71, to: 100 },
  { part: 5, from: 101, to: 130 },
  { part: 6, from: 131, to: 146 },
  { part: 7, from: 147, to: 200 },
];

async function main() {
  // Bước 1: có PDF chưa, chưa thì tải.
  await downloadPdfIfMissing();
  if (KEY.length !== 200) throw new Error(`bảng đáp án có ${KEY.length} ô, phải là 200`);
  rmSync(join(ASSET_DIR, 'images'), { recursive: true, force: true });
  mkdirSync(join(ASSET_DIR, 'images'), { recursive: true });

  // Bước 2: toạ độ từng chữ của cả file — để cắt ảnh đúng chỗ.
  const words = readWords();

  // Bước 3: script phần Nghe → lời từng câu Part 1-2 và từng bài Part 3-4.
  const script = parseScript();
  console.log(`✓ script: ${script.items.length} câu Part 1-2, ${script.talks.length} bài Part 3-4`);

  // Bước 4: chữ câu hỏi in trong đề (Part 3-7).
  const printed = parsePrintedQuestions([...LISTENING_PAGES, ...READING_PAGES], words);
  console.log(`✓ câu hỏi in trong đề: ${Object.keys(printed).length} câu`);

  // Bước 5: ảnh — tranh Part 1, hình minh hoạ Part 3-4, đoạn văn Part 6-7.
  const photos = cropPhotos();
  const graphics = cropGraphics(words, script.talks);
  const passages = cropPassages(words);
  console.log(`✓ ảnh: ${photos.length} tranh, ${Object.keys(graphics).length} hình minh hoạ, ${passages.length} bộ đoạn văn`);

  // Bước 6: ghép thành một đề và ghi ra.
  const file = buildFile({ script, printed, photos, graphics, passages });
  writeFileSync(OUT_FILE, `${JSON.stringify(file, null, 2)}\n`);
  report(file);
}

// --- ghép đề ------------------------------------------------------------------

function buildFile({ script, printed, photos, graphics, passages }) {
  const sets = [];
  const q = (no, extra) => ({ id: `${FORM_ID}-q${no}`, no, part: partOf(no), answer: KEY[no - 1], ...extra });

  // Part 1: không in lời trong đề, chỉ có tranh và tiếng.
  sets.push({
    id: `${FORM_ID}-p1`,
    part: 1,
    questions: script.items
      .filter((it) => partOf(it.no) === 1)
      .map((it) => q(it.no, { image: photos[it.no - 1], audio: null, script: it.lines })),
  });

  // Part 2: không in gì cả, chỉ nghe. Ba lựa chọn A-C.
  sets.push({
    id: `${FORM_ID}-p2`,
    part: 2,
    choices: ['A', 'B', 'C'],
    questions: script.items
      .filter((it) => partOf(it.no) === 2)
      .map((it) => q(it.no, { audio: null, script: it.lines })),
  });

  // Part 3-4: mỗi bài nói là một bộ, MỘT file audio cho cả ba câu — đúng như
  // băng thật: nghe hội thoại xong, người dẫn đọc từng câu hỏi rồi nghỉ.
  for (const talk of script.talks) {
    sets.push({
      id: `${FORM_ID}-p${partOf(talk.from)}-${talk.from}`,
      part: partOf(talk.from),
      title: talk.intro,
      audio: null,
      graphic: graphics[talk.from] || null,
      script: talk.lines,
      questions: range(talk.from, talk.to).map((no) => q(no, printed[no])),
    });
  }

  // Part 5: câu đứng một mình.
  sets.push({
    id: `${FORM_ID}-p5`,
    part: 5,
    questions: range(101, 130).map((no) => q(no, printed[no])),
  });

  // Part 6-7: mỗi đoạn (hoặc cụm đoạn) là một bộ. Đoạn văn là ẢNH cắt từ đề:
  // thư, biểu mẫu, bảng giá, tin nhắn — chép ra chữ là mất bố cục, mà bố cục
  // chính là thứ câu hỏi hỏi tới ("trong bảng, cột nào…").
  for (const p of passages) {
    sets.push({
      id: `${FORM_ID}-p${partOf(p.from)}-${p.from}`,
      part: partOf(p.from),
      title: p.intro,
      passage: { kind: p.kind, text: null, images: p.images },
      questions: range(p.from, p.to).map((no) => q(no, printed[no])),
    });
  }

  return {
    collection: 'exam',
    form: FORM_ID,
    no: PAPER_NO,
    title: `Đề số ${PAPER_NO}`,
    source: 'ETS — TOEIC Listening and Reading: A Complete Practice Test (© ETS 2017)',
    note:
      'Câu hỏi, tranh, đáp án và lời thoại lấy nguyên từ đề ETS. Audio phần Nghe do máy ' +
      'đọc lại từ script của đề (giọng macOS), không phải băng gốc. Chỉ dùng để tự ôn.',
    schemaVersion: 2,
    sets,
  };
}

// --- script phần Nghe -----------------------------------------------------------

/**
 * Script cuối file: mỗi lượt nói mở bằng nhãn người nói — `(N)` người dẫn,
 * `(M-Au)` nam giọng Úc, `(W-Br)` nữ giọng Anh… Dòng thụt vào không có nhãn là
 * nối tiếp lượt trước. `[5 seconds]` là khoảng nghỉ trên băng.
 *
 * Trả về:
 *   items: Part 1-2, mỗi câu một mục { no, lines }
 *   talks: Part 3-4, mỗi bài một mục { from, to, intro, lines }
 * `lines` = [{ voice, text, pause }] — đúng thứ `voice-exam` cần để đọc.
 */
function parseScript() {
  const text = SCRIPT_PAGES.map((p) => stripFooter(pdfText(p))).join('\n');

  // Bỏ phần hướng dẫn chung đầu mỗi Part và câu ví dụ: chỉ lấy từ câu 1.
  const start = text.search(/^1\.\s+\(N\)/m);
  const body = text.slice(start);

  // Gom thành từng lượt nói. Lượt không đánh số thuộc về câu đánh số gần
  // nhất (Part 1-2: người đọc phương án), trừ khi đã sang một bài Part 3-4
  // ("Questions … refer to…") — khi đó nó là lời trong bài.
  const turns = [];
  let no = null;
  for (const raw of body.split('\n')) {
    let text = raw.trim();
    if (!text) continue;
    const num = text.match(/^(\d{1,3})\.\s+/);
    if (num) {
      no = Number(num[1]);
      text = text.slice(num[0].length);
    }
    const tag = text.match(/^\((N|[MW]-[A-Za-z]+)\)\s*/);
    if (tag) {
      const say = text.slice(tag[0].length);
      if (/^Questions \d+ through/.test(say)) no = null;
      turns.push({ no, voice: tag[1], text: say });
    } else if (turns.length) {
      turns[turns.length - 1].text += ` ${text}`;
    }
  }

  const items = [];
  const talks = [];
  let talk = null;

  for (const t of turns) {
    const say = tidy(t.text);

    // Hướng dẫn Part, "Go on to the next page", "This is the end…" — băng thật
    // có, nhưng phòng thi đã in sẵn luật lên màn hình nên không đọc lại.
    if (t.voice === 'N' && /^(PART \w+|Go on to|Now let us begin|Now Part|This is the end)/.test(say)) continue;

    const header = say.match(/^Questions (\d+) through (\d+) refer to (.*)$/);
    if (header) {
      talk = { from: Number(header[1]), to: Number(header[2]), intro: say, lines: [line('N', say)] };
      talks.push(talk);
      continue;
    }

    if (t.no && partOf(t.no) <= 2) {
      let item = items.find((x) => x.no === t.no);
      if (!item) {
        item = { no: t.no, lines: [line('N', `Number ${t.no}.`)] };
        items.push(item);
      }
      // "Look at the picture marked number 1…" — trên màn hình tranh đã hiện
      // sẵn, câu này chỉ chiếm giờ. "Number 1." ở trên là đủ mốc.
      if (t.voice !== 'N') item.lines.push(...splitOptions(t.voice, say));
    } else if (!talk) {
      throw new Error(`lượt nói "${say.slice(0, 40)}" không thuộc câu nào`);
    } else if (t.no) {
      // Người dẫn đọc câu hỏi rồi nghỉ 8 giây (12 giây nếu phải nhìn hình).
      talk.lines.push(line('N', `Number ${t.no}. ${dropPause(say)}`, pauseOf(say)));
    } else {
      talk.lines.push(line(t.voice, dropPause(say), pauseOf(say)));
    }
  }

  // Lượt nói cuối của mỗi câu Part 1-2 mang khoảng nghỉ `[5 seconds]`.
  for (const it of items) {
    const last = it.lines[it.lines.length - 1];
    last.pause = Math.max(last.pause, 5);
  }
  return { items, talks };
}

/**
 * "(A) He's writing… (B) He's reading…" trong cùng một lượt → mỗi phương án một
 * dòng, để máy đọc ngắt nghỉ giữa các phương án như băng thật. Phần trước (A)
 * (câu hỏi Part 2) là lượt của chính người hỏi.
 */
function splitOptions(voice, say) {
  const parts = say.split(/\s*\(([A-D])\)\s*/);
  const out = [];
  if (parts[0].trim()) out.push(line(voice, dropPause(parts[0])));
  for (let i = 1; i < parts.length; i += 2) {
    out.push(line(voice, `${parts[i]}. ${dropPause(parts[i + 1])}`, pauseOf(parts[i + 1])));
  }
  return out;
}

const line = (voice, text, pause = 0) => ({ voice, text, pause });

const pauseOf = (s) => Number((s.match(/[[(](\d+) seconds[\])]/) || [])[1] || 0);
const dropPause = (s) => s.replace(/\s*[[(]\d+ seconds[\])]/g, '').trim();

/**
 * Dọn chữ script cho máy đọc:
 *   `//…//`  dấu nhấn giọng của ETS → bỏ dấu, giữ chữ
 *   `89.5 [eighty-nine point five]` → giữ cách ĐỌC trong ngoặc vuông
 */
function tidy(s) {
  return s
    .replace(/\/\//g, '')
    .replace(/\S+\s+\[(?!\d+ seconds)([^\]]+)\]/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// --- câu hỏi in trong đề ----------------------------------------------------------

/**
 * Chữ câu hỏi và bốn phương án, Part 3-7. Đọc từng trang theo CỘT (trái rồi
 * phải) vì đề in hai cột — đọc ngang thì câu 32 và câu 38 dính một dòng.
 * Duyệt theo số câu có trong bảng đáp án, nên thiếu câu nào là biết ngay.
 */
function parsePrintedQuestions(pages, words) {
  const text = pages.map((p) => `${columnText(p, 0, words)}\n${columnText(p, 1, words)}`).join('\n');
  const out = {};
  for (let no = 32; no <= 200; no++) {
    const block = questionBlock(text, no);
    if (!block) continue;
    const options = {};
    for (const [, letter, body] of block.body.matchAll(/\(([A-D])\)\s([\s\S]*?)(?=\n\s*\([A-D]\)|$)/g)) {
      // Phương án hết ở dòng trống đầu tiên. Sau (D) cuối trang là hướng dẫn
      // Part sau, chữ của đoạn văn cột bên — không có dòng trống chặn lại thì
      // nó dính hết vào (D).
      // Chỉ lấy lần ĐẦU mỗi chữ cái. Khối câu cuối trang chạy sang trang sau,
      // nơi dòng hướng dẫn "(A), (B), (C), or (D) on your answer sheet" ghi
      // đè (D) thật của câu 130.
      if (!options[letter]) options[letter] = clean(cutPageJunk(body.split(/\n[ \t]*\n/)[0]));
    }
    out[no] = { stem: clean(block.stem) || null, options };
  }
  return out;
}

/**
 * Khối của MỘT câu: từ `NN.` tới hết phương án (D). Một số có thể xuất hiện
 * nhiều lần (dấu chỗ trống trong đoạn Part 6, số trang), nên chỉ nhận lần nào
 * có phương án (A) theo ngay sau.
 */
function questionBlock(text, no) {
  const re = new RegExp(`^[ \\t]*${no}\\.(?=[ \\t])`, 'gm');
  for (const m of text.matchAll(re)) {
    const after = text.slice(m.index, m.index + 1600);
    const firstOption = after.search(/\(A\)\s/);
    if (firstOption < 0) continue;
    const stem = after.slice(after.indexOf('.') + 1, firstOption);
    if (/^\s*\d{2,3}\.\s/m.test(stem)) continue; // (A) này là của câu sau
    const rest = after.slice(firstOption);
    const stop = rest.search(/\n\s*\d{2,3}\.\s/);
    return { stem, body: stop > 0 ? rest.slice(0, stop) : rest };
  }
  return null;
}

// --- ảnh ----------------------------------------------------------------------------

/**
 * Tranh Part 1: lấy NGUYÊN tấm ảnh gốc trong PDF, không cắt theo vùng — cắt
 * vùng thì dính cả khoảng trắng và mũi tên "GO ON TO THE NEXT PAGE".
 *
 * `pdftohtml -xml` cho biết mỗi ảnh nằm ở đâu trên trang; ảnh của câu N là ảnh
 * nằm ngay dưới nhãn "N." Không suy theo thứ tự ảnh trong file: ở trang 3, ảnh
 * của câu 2 được lưu TRƯỚC ảnh của câu 1.
 */
function cropPhotos() {
  const tmp = '.cache/ets-full-1-photos';
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  const out = [];

  for (const page of PHOTO_PAGES) {
    execFileSync('pdftohtml', ['-xml', '-q', '-f', String(page), '-l', String(page), PDF_PATH, join(tmp, `p${page}`)]);
    const xml = readFileSync(join(tmp, `p${page}.xml`), 'utf8');
    const images = [...xml.matchAll(/<image top="(\d+)" left="\d+" width="\d+" height="\d+" src="([^"]+)"/g)].map(
      (m) => ({ top: Number(m[1]), src: m[2] }),
    );
    for (const m of xml.matchAll(/<text top="(\d+)"[^>]*>(?:<b>)?([1-6])\.(?:<\/b>)?<\/text>/g)) {
      const top = Number(m[1]);
      const below = images.filter((i) => i.top >= top - 10).sort((a, b) => a.top - b.top)[0];
      if (!below) throw new Error(`trang ${page}: không thấy tranh dưới nhãn ${m[2]}.`);
      const name = `p1-q${m[2]}.jpg`;
      copyFileSync(below.src, join(ASSET_DIR, 'images', name));
      out[Number(m[2]) - 1] = `${ASSET_URL}/images/${name}`;
    }
  }
  if (out.filter(Boolean).length !== 6) throw new Error(`Part 1 cần 6 tranh, lấy được ${out.filter(Boolean).length}`);
  return out;
}

/**
 * Hình minh hoạ Part 3-4 (bảng giá, lịch, bản đồ…). Bài nào có hình thì dòng
 * "Questions … refer to the following conversation AND MAP" nói ra. Hình nằm
 * ngay trên câu đầu của bài, trong cùng cột.
 */
function cropGraphics(words, talks) {
  const out = {};
  for (const t of talks) {
    if (!/ and [a-z ]+\.?$/i.test(t.intro)) continue;
    const head = words.find(
      (w) => LISTENING_PAGES.includes(w.page) && w.t === `${t.from}.` && isQuestionStart(words, w),
    );
    if (!head) throw new Error(`không thấy câu ${t.from} để cắt hình minh hoạ`);
    const left = head.x < COLUMN_SPLIT;
    const x = left ? 40 : COLUMN_SPLIT;
    out[t.from] = crop(
      head.page,
      { x, y: PAGE_TOP, w: left ? COLUMN_SPLIT - 40 : PAGE_WIDTH - 36 - COLUMN_SPLIT, h: head.y - 6 - PAGE_TOP },
      `p${partOf(t.from)}-${t.from}-graphic`,
    );
  }
  return out;
}

/**
 * Đoạn văn Part 6-7, cắt thành ảnh. Đi qua các trang theo thứ tự từ trên
 * xuống, như người đọc:
 *   - dòng "Questions N-M refer to…" mở một bộ mới, đoạn văn bắt đầu ngay dưới
 *   - câu hỏi đầu tiên của bộ đóng đoạn văn lại
 *   - hết trang mà chưa gặp câu hỏi → đoạn văn chảy sang trang sau
 * Bộ nhiều đoạn (double/triple passage) vì thế ra nhiều ảnh.
 */
function cropPassages(words) {
  const sets = [];
  let open = null; // bộ đang đọc đoạn văn, chưa tới câu hỏi

  for (const page of READING_PAGES) {
    const events = [];
    for (const w of words.filter((x) => x.page === page)) {
      if (w.t === 'Questions' && /^\d{3}-\d{3}$/.test(nextWord(words, w)?.t || '')) {
        events.push({ kind: 'header', y: w.y, w });
      } else if (/^\d{3}\.$/.test(w.t) && isQuestionStart(words, w)) {
        events.push({ kind: 'question', y: w.y, no: Number(w.t.slice(0, -1)) });
      }
    }
    events.sort((a, b) => a.y - b.y);

    let top = PAGE_TOP;
    const close = (bottom) => {
      if (open && bottom - top > 30) {
        const n = open.images.length + 1;
        open.images.push(crop(page, { x: 36, y: top, w: PAGE_WIDTH - 72, h: bottom - top }, `p${partOf(open.from)}-${open.from}-${n}`));
      }
    };

    for (const e of events) {
      if (e.kind === 'header') {
        close(e.y - 4);
        const [from, to] = nextWord(words, e.w).t.split('-').map(Number);
        const intro = lineText(words, e.w);
        open = { from, to, intro, kind: intro.replace(/^.*refer to the following\s*/, '').replace(/\.$/, ''), images: [] };
        sets.push(open);
        top = lineBottom(words, e.w) + 4;
      } else if (open && e.no >= open.from && e.no <= open.to) {
        close(e.y - 6);
        open = null;
      }
    }
    close(footerY(words, page));
  }

  // Part 5 không có đoạn văn; mọi bộ còn lại phải có ít nhất một ảnh.
  for (const s of sets) if (!s.images.length) throw new Error(`bộ ${s.from}-${s.to} không cắt được đoạn văn`);
  return sets;
}

/**
 * Một số là ĐẦU câu hỏi thật khi đủ hai điều:
 *   - ngay sau nó trên cùng dòng có chữ (phần dẫn, hoặc "(A)" với Part 6)
 *   - ngay dưới, trong cùng cột, có "(A)"
 * Số đánh dấu chỗ trống trong đoạn Part 6 ("140." dưới chỗ trống) đứng trơ
 * một mình trên dòng — thiếu điều đầu. Chỉ xét điều sau thì đoạn văn câu
 * 139-142 bị cắt cụt ở dấu "140.", vì (A) của câu 139 nằm ngay bên dưới.
 */
function isQuestionStart(words, w) {
  const followed = words.some(
    (o) => o.page === w.page && Math.abs(o.y - w.y) < 2 && o.x > w.x && o.x - w.xMax < 15,
  );
  return followed && words.some(
    (o) =>
      o.page === w.page &&
      o.t === '(A)' &&
      o.y >= w.y - 2 &&
      o.y - w.y < 70 &&
      o.x > w.x - 4 &&
      o.x - w.x < 200,
  );
}

const nextWord = (words, w) => words[words.indexOf(w) + 1];

/** Chữ trên cùng dòng, bắt đầu từ từ `w`. */
function lineText(words, w) {
  return words
    .filter((o) => o.page === w.page && Math.abs(o.y - w.y) < 2 && o.x >= w.x)
    .sort((a, b) => a.x - b.x)
    .map((o) => o.t)
    .join(' ');
}

const lineBottom = (words, w) =>
  Math.max(...words.filter((o) => o.page === w.page && Math.abs(o.y - w.y) < 2).map((o) => o.yMax));

/** Chân trang: dòng "TOEIC … Practice Test" hoặc mũi tên "GO ON TO THE NEXT PAGE". */
function footerY(words, page) {
  const marks = words.filter(
    (w) => w.page === page && w.y > 700 && (w.t === 'TOEIC' || w.t === 'GO' || w.t === 'Stop!'),
  );
  return (marks.length ? Math.min(...marks.map((w) => w.y)) : 800) - 6;
}

/** Cắt một vùng (đơn vị pt) của trang ra PNG xám. Trả về đường dẫn cho app. */
function crop(page, box, name) {
  const s = RENDER_DPI / 72;
  const prefix = join(ASSET_DIR, 'images', name);
  execFileSync('pdftoppm', [
    '-f', String(page), '-l', String(page), '-r', String(RENDER_DPI), '-gray', '-png', '-singlefile',
    '-x', String(Math.round(box.x * s)), '-y', String(Math.round(box.y * s)),
    '-W', String(Math.round(box.w * s)), '-H', String(Math.round(box.h * s)),
    PDF_PATH, prefix,
  ]);
  return `${ASSET_URL}/images/${name}.png`;
}

// --- đọc PDF ---------------------------------------------------------------------

/** Mọi chữ của file, kèm trang và toạ độ (pt). */
function readWords() {
  const html = execFileSync('pdftotext', ['-bbox', PDF_PATH, '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const words = [];
  html.split('<page').slice(1).forEach((chunk, i) => {
    for (const m of chunk.matchAll(/xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</g)) {
      words.push({ page: i + 1, x: +m[1], y: +m[2], xMax: +m[3], yMax: +m[4], t: decode(m[5]) });
    }
  });
  return words;
}

function pdfText(page, x, w) {
  const args = ['-layout', '-f', String(page), '-l', String(page)];
  if (x !== undefined) args.push('-x', String(x), '-y', '0', '-W', String(w), '-H', '842');
  args.push(PDF_PATH, '-');
  return execFileSync('pdftotext', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

/**
 * Một cột của trang. Ranh giới cột tính theo TỪNG TRANG — số câu cột phải ở
 * trang 20 bắt đầu từ x=294, ở trang 13 là x=319; một mốc cố định cắt nhầm
 * chữ "146." làm đôi.
 *
 * Bỏ thêm một hai ký tự lẻ ở đầu dòng cột phải: chữ cuối dòng cột trái thò
 * qua ranh giới ("e   118. Kohler Gas…", "o (C) At a printing shop").
 */
function columnText(page, col, words) {
  const split = columnSplit(words, page);
  if (col === 0) return pdfText(page, 0, split);
  return pdfText(page, split, PAGE_WIDTH - split).replace(/^[ \t]{0,2}\S{1,2}(?=[ \t]{2,})/gm, '');
}

function columnSplit(words, page) {
  const right = words.filter((w) => w.page === page && /^\d{2,3}\.$/.test(w.t) && w.x > 250 && isQuestionStart(words, w));
  return right.length ? Math.floor(Math.min(...right.map((w) => w.x))) - 2 : COLUMN_SPLIT;
}

async function downloadPdfIfMissing() {
  if (existsSync(PDF_PATH)) return console.log(`• dùng lại ${PDF_PATH}`);
  mkdirSync('.cache', { recursive: true });
  console.log('• tải đề ETS …');
  const res = await fetch(PDF_URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`tải PDF hỏng: HTTP ${res.status}`);
  writeFileSync(PDF_PATH, Buffer.from(await res.arrayBuffer()));
}

// --- báo cáo -------------------------------------------------------------------------

function report(file) {
  console.log(`\n→ ${OUT_FILE}`);
  const all = file.sets.flatMap((s) => s.questions);
  for (const p of PARTS) {
    const have = all.filter((q) => q.part === p.part).length;
    console.log(`   Part ${p.part}: ${have}/${p.to - p.from + 1} câu`);
  }
  // Câu in trong đề (Part 3-7) phải có đủ 4 phương án.
  const broken = all.filter((q) => q.part >= 3 && Object.keys(q.options || {}).length !== 4);
  if (broken.length) console.log(`   ⚠ thiếu phương án: ${broken.map((q) => q.no).join(', ')}`);
  const long = all.filter((q) => Object.values(q.options || {}).some((v) => v.length > 150));
  if (long.length) console.log(`   ⚠ phương án dài bất thường: ${long.map((q) => q.no).join(', ')}`);
  if (all.length !== 200) throw new Error(`đề có ${all.length} câu, phải là 200`);
}

// --- tiện ích nhỏ ---------------------------------------------------------------------

function partOf(no) {
  return PARTS.find((p) => no >= p.from && no <= p.to).part;
}

function range(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

const stripFooter = (t) => t.replace(/^.*TOEIC ® Listening and Reading Practice Test.*$/gm, '');

const PAGE_JUNK = /Unauthorized copying|GO ON TO THE NEXT PAGE|Stop! This is the end|TOEIC ® Listening|Questions\s+\d{2,3}/i;

/** Phương án cuối chạy tới hết khối — cắt rác chân trang dính theo. */
function cutPageJunk(body) {
  const m = body.match(PAGE_JUNK);
  if (!m) return body;
  const lineStart = body.lastIndexOf('\n', m.index);
  return body.slice(0, lineStart > 0 ? lineStart : m.index);
}

const clean = (s) => s.replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
