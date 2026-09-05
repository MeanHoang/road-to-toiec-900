// Chuẩn bị file Lottie tải về cho lớp phủ lễ hội.
//
//   node scripts/prep-lottie.mjs [thư-mục-nguồn]      (mặc định: ~/Downloads)
//
// Làm ba việc, chạy MỘT LẦN lúc nhập file, không phải lúc app chạy:
//   1. Giải nén .lottie (thực chất là file zip) lấy JSON bên trong.
//   2. Xoá những lớp không dùng — chữ nhúng sẵn, bóng đổ xuống đất.
//   3. Đổi màu về tông Trung Thu.
//
// Vì sao đổi màu ở đây chứ không phải bằng CSS filter lúc chạy: Lottie cất màu
// dưới dạng số [r,g,b,a] thang 0-1 nên sửa được từng chi tiết, còn filter thì
// nhuộm cả bức. Và làm sẵn thì máy người học không phải tính gì.
//
// Kết quả ghi vào public/assets/event/mid-autumn/, có commit vào repo — file
// nguồn trong Downloads không cần giữ.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { join } from 'node:path';
import { homedir } from 'node:os';

const OUT_DIR = 'public/assets/event/mid-autumn';

/** So tên khoan dung: bỏ đuôi, gộp mọi ký tự lạ thành '-', không phân biệt hoa
 *  thường. Nhờ vậy "Red Lantern.lottie", "red-lantern.json" đều khớp 'red-lantern'. */
const slug = (s) =>
  s
    .replace(/\.(lottie|json)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Mỗi mục: file nguồn (khớp theo tên, không cần đuôi), tên xuất ra, các lớp cần
 * bỏ, và bảng đổi màu hex → hex.
 */
const RECIPES = [
  {
    from: 'Clouds',
    to: 'cloud',
    // Mây gốc màu xanh da trời. Đổi sang NGÀ NHẠT chứ không phải cam đậm:
    // màu ấm đậm phủ mờ lên nền tím ban đêm sẽ ra nâu bùn. Ngà nhạt ở độ mờ
    // thấp mới cho ra vệt mây mỏng, và ban ngày vẫn hợp nền giấy dó.
    colors: { ceeffa: 'f4e7d8', '9ee2f8': 'e0cdb6' },
  },
  {
    from: 'Red-Lantern',
    to: 'lantern',
    // Thân đỏ giữ nguyên, chỉ có cái nắp xanh navy là lạc quẻ → đổi thành vàng đồng.
    colors: { '063d65': 'd4a017' },
  },
  {
    from: 'lunar-lamp',
    to: 'lantern-small',
    // Đỏ nguyên chất chói quá; viền đen chìm mất trên nền đêm → nâu ấm.
    colors: { ff0000: 'e0472e', ff6763: 'ff9a6a', '000000': '4a1f12' },
  },
  {
    from: 'Eid-Crescent-Moon-Girl',
    to: 'moon-girl',
    // "Shadow Outlines" là bóng đổ xuống đất — treo giữa trời trông rất sai.
    // "Body Shadow Outlines" là bóng trên người, giữ lại.
    dropLayers: ['Shadow Outlines'],
    // Trăng sáng lên, váy ô liu → đỏ mận cho hợp lễ hội.
    colors: {
      d1aa0b: 'e8b83a',
      fcecc0: 'fff4d6',
      647549: 'b8324a',
      '53632b': '8a2338',
    },
  },
  {
    from: 'rabbit',
    to: 'rabbit',
    // Thỏ ngọc. Lông gốc màu xanh bạc hà — đổi sang ngà ấm. Phải ĐỦ ĐẬM: ngà
    // quá nhạt thì ban ngày nó tàng hình trên nền giấy dó, mà ban đêm vẫn sáng
    // dư. Mũi và mắt nâu giữ nguyên.
    colors: { c7e1d8: 'e9d3b2', cee5dd: 'd8bd97', dcece7: 'f4e6cf' },
  },
  {
    from: 'Remix of Rabbit Hi Without Statemachine',
    to: 'rabbit-wave',
    // Thỏ vẫy tay, gốc là xanh navy + xanh biển. Cả hai đều lạc hẳn khỏi bảng
    // màu ấm nên phải kéo về nâu đất và be. Màu của file này nằm trong precomp,
    // không phải ở `layers` — xem chú thích chỗ gọi recolor.
    colors: { '003049': '5c3a2a', '669bbc': 'e0bd93', '780000': '8a2338' },
  },
  {
    from: 'Rabbit Kick Scooter',
    to: 'rabbit-scooter',
    // Không đổi màu: file này vốn đã vàng kem và nâu đất, khớp sẵn bảng màu.
  },
];

// --- đọc .lottie: zip, mỗi entry một local file header ------------------------
// Dùng zlib có sẵn của Node thay vì thêm một dependency chỉ để mở một file zip.
function jsonFromDotLottie(buf) {
  const files = {};
  let p = 0;
  while (p + 4 <= buf.length && buf.readUInt32LE(p) === 0x04034b50) {
    const method = buf.readUInt16LE(p + 8);
    const compSize = buf.readUInt32LE(p + 18);
    const nameLen = buf.readUInt16LE(p + 26);
    const extraLen = buf.readUInt16LE(p + 28);
    const name = buf.toString('utf8', p + 30, p + 30 + nameLen);
    const dataAt = p + 30 + nameLen + extraLen;
    const raw = buf.subarray(dataAt, dataAt + compSize);
    if (compSize > 0) files[name] = method === 8 ? inflateRawSync(raw) : raw;
    p = dataAt + compSize;
  }

  const key = Object.keys(files).find((k) => k.startsWith('animations/') && k.endsWith('.json'));
  if (!key) throw new Error('không thấy animations/*.json trong file .lottie');
  return JSON.parse(files[key].toString('utf8'));
}

// --- đổi màu -----------------------------------------------------------------
const toHex = (k) =>
  k
    .slice(0, 3)
    .map((v) => Math.round(v * 255).toString(16).padStart(2, '0'))
    .join('');

const toRgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/** Đi khắp cây, đổi mọi mảng tô (fl) và nét (st) khớp bảng màu. Trả về số chỗ đã đổi. */
function recolor(node, map, seen = { n: 0 }) {
  if (!node || typeof node !== 'object') return seen.n;
  if (Array.isArray(node)) {
    node.forEach((x) => recolor(x, map, seen));
    return seen.n;
  }

  if ((node.ty === 'fl' || node.ty === 'st') && node.c && Array.isArray(node.c.k)) {
    const want = map[toHex(node.c.k)];
    if (want) {
      const [r, g, b] = toRgb(want);
      node.c.k = [r, g, b, node.c.k[3] ?? 1];
      seen.n += 1;
    }
  }

  for (const k of Object.keys(node)) recolor(node[k], map, seen);
  return seen.n;
}

// --- chạy --------------------------------------------------------------------
const srcDir = process.argv[2] || join(homedir(), 'Downloads');
if (!existsSync(srcDir)) {
  console.error(`Không thấy thư mục nguồn: ${srcDir}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });
const pool = readdirSync(srcDir);
let made = 0;

for (const r of RECIPES) {
  const hit = pool.find((f) => slug(f) === slug(r.from));
  if (!hit) {
    console.warn(`⚠  bỏ qua "${r.from}" — không có trong ${srcDir}`);
    continue;
  }

  const buf = readFileSync(join(srcDir, hit));
  const anim = hit.endsWith('.lottie') ? jsonFromDotLottie(buf) : JSON.parse(buf.toString('utf8'));

  const before = anim.layers.length;
  if (r.dropLayers) anim.layers = anim.layers.filter((l) => !r.dropLayers.includes(l.nm));
  const dropped = before - anim.layers.length;

  // Duyệt cả `assets`: hình của nhiều file nằm trong precomp chứ không nằm
  // thẳng ở `layers`. Quét thiếu chỗ đó là tưởng file không có màu nào để đổi.
  const changed = recolor([anim.layers, anim.assets], r.colors || {});

  const out = join(OUT_DIR, `${r.to}.json`);
  writeFileSync(out, JSON.stringify(anim));
  made += 1;

  const kb = (readFileSync(out).length / 1024).toFixed(0);
  console.log(
    `✓ ${r.to}.json  ${anim.w}×${anim.h}  ${anim.layers.length} lớp` +
      `${dropped ? ` (bỏ ${dropped})` : ''}  ${changed} chỗ đổi màu  ${kb}KB`,
  );
}

console.log(`\n${made}/${RECIPES.length} file → ${OUT_DIR}`);
