// Crawl một public Google Drive folder mà không cần API key.
// Trang folder của Drive render sẵn HTML: mỗi item là một <tr data-id="..."> kèm aria-label
// dạng "<tên> <loại> Shared". Ta parse trực tiếp từ đó.

const FOLDER_URL = (id) => `https://drive.google.com/drive/folders/${id}`;
const DOWNLOAD_URL = (id) =>
  `https://drive.usercontent.google.com/download?id=${id}&export=download`;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** Tách folder id ra khỏi link Drive ở mọi dạng thường gặp. */
export function parseFolderId(input) {
  const m =
    input.match(/\/folders\/([-\w]{10,})/) ||
    input.match(/[?&]id=([-\w]{10,})/) ||
    input.match(/^([-\w]{25,})$/);
  if (!m) throw new Error(`Không nhận ra folder id từ: ${input}`);
  return m[1];
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

// aria-label trông như: "DAY 1.pdf PDF Shared" / "AUDIO DAY 1 Shared folder".
// Bỏ đuôi metadata để lấy lại tên gốc, và suy ra đây là folder hay file.
function readLabel(label) {
  const isFolder = /\bfolder\b/i.test(label);
  const name = label
    .replace(/\s*Shared\s*folder\s*$/i, '')
    .replace(/\s*folder\s*$/i, '')
    .replace(/\s*Shared\s*$/i, '')
    .replace(/\s+(PDF|Audio|Video|Image|PNG|JPEG|MP3|Text)\s*$/i, '')
    .trim();
  return { name, isFolder };
}

/** Danh sách item trực tiếp trong một folder. */
export async function listFolder(folderId) {
  const html = await fetchText(FOLDER_URL(folderId));
  const rowRe = /<tr[^>]*data-id="([^"]+)"[^>]*data-target="[^"]*"/g;
  const items = [];
  const seen = new Set();
  let m;
  while ((m = rowRe.exec(html))) {
    const id = m[1];
    if (id === folderId || seen.has(id)) continue;
    seen.add(id);
    // aria-label nằm trong cùng row; row của Drive rất dài nên quét một cửa sổ rộng.
    const window = html.slice(m.index, m.index + 12000);
    const label = window.match(/aria-label="([^"]+)"/);
    if (!label) continue;
    const { name, isFolder } = readLabel(label[1]);
    items.push({ id, name, type: isFolder ? 'folder' : 'file' });
  }
  return items;
}

/** Duyệt đệ quy, trả về cây folder/file. */
export async function walkFolder(folderId, name = '') {
  const children = await listFolder(folderId);
  const out = [];
  for (const item of children) {
    if (item.type === 'folder') {
      out.push({ ...item, children: await walkFolder(item.id, item.name) });
    } else {
      out.push(item);
    }
  }
  return out;
}

/** Tải một file Drive về đường dẫn chỉ định. Trả về tên file thật do Drive khai báo. */
export async function downloadFile(fileId, destPath, fs) {
  const res = await fetch(DOWNLOAD_URL(fileId), { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`Tải ${fileId} lỗi: ${res.status}`);
  const disposition = res.headers.get('content-disposition') || '';
  const named = disposition.match(/filename="([^"]+)"/);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
  return { realName: named ? named[1] : null, bytes: buf.length };
}
