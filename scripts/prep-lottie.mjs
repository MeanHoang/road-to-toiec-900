// Chuẩn bị file Lottie tải về cho lớp phủ lễ hội.
//
//   node scripts/prep-lottie.mjs <sự-kiện> [thư-mục-nguồn]   (mặc định: ~/Downloads)
//
// Làm ba việc, chạy MỘT LẦN lúc nhập file, không phải lúc app chạy:
//   1. Giải nén .lottie (thực chất là file zip) lấy JSON bên trong.
//   2. Xoá những lớp không dùng — chữ nhúng sẵn, bóng đổ xuống đất.
//   3. Đổi màu về tông của sự kiện.
//
// Vì sao đổi màu ở đây chứ không phải bằng CSS filter lúc chạy: Lottie cất màu
// dưới dạng số [r,g,b,a] thang 0-1 nên sửa được từng chi tiết, còn filter thì
// nhuộm cả bức. Và làm sẵn thì máy người học không phải tính gì.
//
// Kết quả ghi vào public/assets/event/<sự-kiện>/, có commit vào repo — file
// nguồn trong Downloads không cần giữ.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { join } from 'node:path';
import { homedir } from 'node:os';

/** So tên khoan dung: bỏ đuôi, gộp mọi ký tự lạ thành '-', không phân biệt hoa
 *  thường. Nhờ vậy "Red Lantern.lottie", "red-lantern.json" đều khớp 'red-lantern'. */
const slug = (s) =>
  s
    .replace(/\.(lottie|json)$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Một bảng công thức cho MỖI sự kiện, khoá là đúng cái tên dùng trong
 * ACTIVE_EVENT và trong tên file CSS — nên biết tên sự kiện là biết tìm ở đâu.
 *
 * Mỗi mục: file nguồn (khớp theo tên, không cần đuôi), tên xuất ra, các lớp cần
 * bỏ, và bảng đổi màu hex → hex.
 */
const EVENTS = {};

EVENTS['mid-autumn'] = [
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

// 20/10 — NGÀY PHỤ NỮ VIỆT NAM. Nguồn: lottiefiles.com, bản miễn phí.
//   cherry-blossom   /free-animation/cherry-blossom-dZ3c1KjOBv
//   flowers-bouquet  /free-animation/flowers-bouquet-animation-bniOKamcLr
//   simple-rose      /free-animation/a-simple-rose-GqwmcL3eSl
//   referral-gift    /free-animation/referral-gift-wrnR6uNcE4
EVENTS['women-day'] = [
  {
    from: 'cherry-blossom',
    to: 'petal',
    // Hồng anh đào gốc quá ngọt và quá nhạt: thả 20 cánh cỡ nhỏ lên nền kem
    // thì chúng biến mất. Kéo cả ba bậc về họ hồng-đỏ của --brand, giữ nguyên
    // khoảng cách sáng tối giữa chúng để cánh hoa còn thấy được hình khối.
    colors: { e85a7a: 'c2304f', ff91a9: 'e2798d', ffb7c5: 'f4bcc6' },
  },
  {
    from: 'flowers-bouquet',
    to: 'bouquet',
    // Hoa coral → đỏ hoa hồng. Giấy gói xanh ngọc là màu lạc duy nhất trong
    // bảng ấm → vàng ô-liu, đúng --accent.
    colors: {
      f27875: 'c23a52',
      ff938d: 'e07186',
      '82d0d8': 'a99a63',
      '98deea': 'c4b684',
      f9b995: 'e8c9a4',
      ffd3b6: 'f3dcc3',
    },
  },
  {
    from: 'simple-rose',
    to: 'rose',
    // Lá gốc màu xanh da trời — sai cả về thực vật lẫn bảng màu → xanh ô-liu.
    // Thân và đài #580a2d vốn đã là nâu mận, giữ nguyên.
    colors: { fe4242: 'b91c3c', fa918a: 'e28096', b2d6fe: '9aa865' },
  },
  {
    from: 'referral-gift',
    to: 'gift',
    // Hộp quà. Gốc đã là hồng nên chỉ cần kéo về đúng bốn bậc của bảng màu:
    // thân hộp lấy luôn --brand, nơ và dải sáng nhạt dần, bóng đậm nhất là mận.
    colors: {
      ff0f57: 'b91c3c',
      ff8bae: 'e8849c',
      ff8fb1: 'e07186',
      ffb9ce: 'f4bcc6',
      e07091: 'c2546f',
      ba0800: '7d2342',
    },
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

/**
 * Mảng chốt màu của một gradient: [vị-trí, r,g,b, vị-trí, r,g,b, ...] thang 0-1,
 * và SAU đó có thể còn một dãy chốt độ mờ [vị-trí, a, ...]. `p` là số chốt màu,
 * nên chỉ được đụng vào 4*p số đầu — quét quá là ăn vào dãy độ mờ và bức tranh
 * thủng lỗ chỗ.
 */
function recolorStops(stops, count, map, seen) {
  for (let i = 0; i + 3 < count * 4; i += 4) {
    const want = map[toHex(stops.slice(i + 1, i + 4))];
    if (!want) continue;
    const [r, g, b] = toRgb(want);
    stops[i + 1] = r;
    stops[i + 2] = g;
    stops[i + 3] = b;
    seen.n += 1;
  }
}

/**
 * Đi khắp cây, đổi mọi màu khớp bảng. Trả về số chỗ đã đổi.
 *
 * Ba chỗ cất màu, không phải một: tô đặc (fl), nét (st), và chốt màu của
 * gradient (gf/gs). Bỏ sót gradient là bỏ sót đúng những mảng màu lớn nhất —
 * cánh bướm của file này nằm cả trong gradient, nên quét thiếu thì báo "54 chỗ
 * đổi màu" mà con bướm vẫn xanh nguyên.
 */
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

  if ((node.ty === 'gf' || node.ty === 'gs') && Array.isArray(node.g?.k?.k)) {
    recolorStops(node.g.k.k, node.g.p, map, seen);
  }

  for (const k of Object.keys(node)) recolor(node[k], map, seen);
  return seen.n;
}

// --- chạy --------------------------------------------------------------------
const event = process.argv[2];
const RECIPES = EVENTS[event];
if (!RECIPES) {
  console.error(`Dùng: node scripts/prep-lottie.mjs <${Object.keys(EVENTS).join('|')}> [thư-mục-nguồn]`);
  process.exit(1);
}

const srcDir = process.argv[3] || join(homedir(), 'Downloads');
if (!existsSync(srcDir)) {
  console.error(`Không thấy thư mục nguồn: ${srcDir}`);
  process.exit(1);
}

const OUT_DIR = `public/assets/event/${event}`;
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
