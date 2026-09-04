#!/usr/bin/env node
// Nhập một buổi học từ Google Drive về repo.
//
//   node scripts/import-day.mjs <link-drive-folder> [--slug day-1]
//
// Kết quả:
//   public/assets/<slug>/images/p<trang>-<i>.jpg   ảnh bóc từ PDF
//   public/assets/<slug>/audio/<tên file>.mp3      audio tải từ Drive
//   content/<slug>.raw.json                         text + inventory để dựng nội dung

import { mkdir, writeFile, readFile, rm, readdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import * as fsp from 'node:fs/promises';
import { parseFolderId, walkFolder, downloadFile } from './drive.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');

const AUDIO_EXT = /\.(mp3|m4a|wav|aac|ogg)$/i;
const PDF_EXT = /\.pdf$/i;
// Ảnh lẻ nằm rải trong folder audio nhìn như rác, nhưng ở DAY 1 chính là BẢNG ĐÁP ÁN
// (IMG_0292.PNG). Luôn tải về để người/agent xem, đừng lọc bỏ.
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

/** Cây thư mục Drive → một đoạn đường dẫn an toàn, vd "practice-1-file-1-1". */
function slugifyTrail(trail) {
  return trail
    .slice(1) // bỏ tầng "AUDIO DAY 1" ngoài cùng, không mang thông tin
    .join('-')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function flatten(tree, trail = []) {
  return tree.flatMap((node) =>
    node.type === 'folder'
      ? flatten(node.children, [...trail, node.name])
      : [{ ...node, trail }],
  );
}

/** pdfimages đặt tên theo số thứ tự toàn cục; ta đổi lại thành p<trang>-<idx>. */
async function extractImages(pdfPath, outDir) {
  await mkdir(outDir, { recursive: true });
  const tmp = path.join(outDir, '.tmp');
  await mkdir(tmp, { recursive: true });
  await run('pdfimages', ['-j', '-p', pdfPath, path.join(tmp, 'img')]);

  const { stdout } = await run('pdfimages', ['-list', pdfPath]);
  const pages = stdout
    .trim()
    .split('\n')
    .slice(2)
    .map((line) => Number(line.trim().split(/\s+/)[0]));

  // PDF hay cắt một tấm ảnh thành nhiều dải ngang xếp chồng. Nếu để nguyên thì
  // một câu hỏi tự nhiên có 2-3 "ảnh" vụn. Ghép lại các dải liền nhau cùng bề rộng.
  const dims = stdout
    .trim()
    .split('\n')
    .slice(2)
    .map((line) => {
      const c = line.trim().split(/\s+/);
      return { page: Number(c[0]), w: Number(c[3]), h: Number(c[4]) };
    });

  const files = (await readdir(tmp)).filter((f) => f.startsWith('img')).sort();

  const groups = [];
  for (const [i, file] of files.entries()) {
    const d = dims[i] || { page: pages[i] ?? 0, w: 0, h: 0 };
    const prev = groups[groups.length - 1];
    // Cùng trang + cùng bề rộng + đều là dải ngang dẹt (rộng gấp >2 lần cao)
    // → gần như chắc chắn là các mảnh của cùng một tấm ảnh.
    const isStrip = d.w > 0 && d.w / d.h > 2;
    if (prev && prev.page === d.page && prev.w === d.w && prev.isStrip && isStrip) {
      prev.files.push(file);
    } else {
      groups.push({ page: d.page, w: d.w, isStrip, files: [file] });
    }
  }

  const perPage = new Map();
  const result = [];
  for (const g of groups) {
    const n = (perPage.get(g.page) ?? 0) + 1;
    perPage.set(g.page, n);
    const name = `p${String(g.page).padStart(2, '0')}-${n}.jpg`;
    const dest = path.join(outDir, name);

    if (g.files.length === 1) {
      await rename(path.join(tmp, g.files[0]), dest);
    } else {
      // ffmpeg vstack ghép dọc các dải theo đúng thứ tự xuất hiện trong PDF.
      const inputs = g.files.flatMap((f) => ['-i', path.join(tmp, f)]);
      await run('ffmpeg', [
        '-y',
        ...inputs,
        '-filter_complex',
        `vstack=inputs=${g.files.length}`,
        dest,
      ]);
      console.log(`    ghép ${g.files.length} dải → ${name}`);
    }
    result.push({ page: g.page, name });
  }

  await rm(tmp, { recursive: true, force: true });
  return result;
}

async function extractText(pdfPath) {
  const { stdout } = await run('pdftotext', ['-layout', pdfPath, '-']);
  // pdftotext ngăn trang bằng form feed.
  return stdout.split('\f').map((t) => t.replace(/\s+$/, ''));
}

async function main() {
  const [link, ...rest] = process.argv.slice(2);
  if (!link) {
    console.error('Cách dùng: node scripts/import-day.mjs <link-drive-folder> [--slug day-1]');
    process.exit(1);
  }
  const slugFlag = rest.indexOf('--slug');
  const slug = slugFlag >= 0 ? rest[slugFlag + 1] : null;

  const folderId = parseFolderId(link);
  console.log(`→ Quét folder ${folderId} ...`);
  const tree = await walkFolder(folderId);
  const files = flatten(tree);
  console.log(`  thấy ${files.length} file trong ${countFolders(tree)} folder`);

  const daySlug =
    slug ??
    (await guessSlug(files)) ??
    `day-${new Date().toISOString().slice(0, 10)}`;

  const assetDir = path.join(ROOT, 'public', 'assets', daySlug);
  const imgDir = path.join(assetDir, 'images');
  const audioDir = path.join(assetDir, 'audio');
  const cacheDir = path.join(ROOT, '.cache', daySlug);
  await mkdir(cacheDir, { recursive: true });
  await mkdir(audioDir, { recursive: true });

  const loose = path.join(assetDir, 'extra');
  await mkdir(loose, { recursive: true });

  const documents = [];
  const audio = [];
  const looseImages = [];

  for (const file of files) {
    const isPdf = PDF_EXT.test(file.name);
    const isAudio = AUDIO_EXT.test(file.name);
    const isImage = IMAGE_EXT.test(file.name);
    if (!isPdf && !isAudio && !isImage) {
      console.log(`  bỏ qua ${file.name}`);
      continue;
    }

    if (isImage) {
      const safe = file.name.replace(/[^\w.\- ]+/g, '_');
      const dest = path.join(loose, safe);
      if (!existsSync(dest)) {
        process.stdout.write(`  ↓ ảnh rời ${file.name} ... `);
        const { bytes } = await downloadFile(file.id, dest, fsp);
        console.log(`${(bytes / 1024).toFixed(0)} KB`);
      }
      looseImages.push({
        group: file.trail.join(' / '),
        name: file.name,
        src: `/assets/${daySlug}/extra/${safe}`,
      });
      continue;
    }

    if (isAudio) {
      // PHẢI giữ nguyên cây thư mục của Drive. Tên file trùng nhau giữa các folder
      // (1.mp3 có ở cả File 1.1, File 1.2, HOMEWORK 1, HOMEWORK 2) nên đổ phẳng vào
      // một chỗ là ghi đè mất nhau — 43 file rút còn 17.
      const folder = slugifyTrail(file.trail);
      const safe = file.name.replace(/[^\w.\- ]+/g, '_');
      const destDir = path.join(audioDir, folder);
      const dest = path.join(destDir, safe);
      if (!existsSync(dest)) {
        await mkdir(destDir, { recursive: true });
        process.stdout.write(`  ↓ audio ${folder}/${file.name} ... `);
        const { bytes } = await downloadFile(file.id, dest, fsp);
        console.log(`${(bytes / 1024 / 1024).toFixed(1)} MB`);
      }
      audio.push({
        group: file.trail.join(' / '),
        folder,
        label: file.name.replace(AUDIO_EXT, ''),
        src: `/assets/${daySlug}/audio/${folder}/${safe}`,
      });
      continue;
    }

    const local = path.join(cacheDir, file.name.replace(/[^\w.\- ]+/g, '_'));
    if (!existsSync(local)) {
      process.stdout.write(`  ↓ pdf ${file.name} ... `);
      const { bytes } = await downloadFile(file.id, local, fsp);
      console.log(`${(bytes / 1024 / 1024).toFixed(1)} MB`);
    }
    const docSlug = file.name.replace(PDF_EXT, '').replace(/[^\w]+/g, '-').toLowerCase();
    const images = await extractImages(local, path.join(imgDir, docSlug));
    const pages = await extractText(local);
    documents.push({
      name: file.name,
      slug: docSlug,
      pages: pages.map((text, i) => ({
        page: i + 1,
        text,
        images: images
          .filter((im) => im.page === i + 1)
          .map((im) => `/assets/${daySlug}/images/${docSlug}/${im.name}`),
      })),
    });
    console.log(`    ${pages.length} trang, ${images.length} ảnh`);
  }

  const out = path.join(ROOT, 'content', `${daySlug}.raw.json`);
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(
    out,
    JSON.stringify({ slug: daySlug, source: link, documents, audio, looseImages }, null, 2),
  );
  console.log(`✓ ${path.relative(ROOT, out)}`);
  console.log(`  ${documents.length} tài liệu, ${audio.length} audio, ${looseImages.length} ảnh rời`);
  if (looseImages.length) {
    console.log('  ⚠ Xem kỹ ảnh rời — ở DAY 1 đây chính là bảng đáp án:');
    for (const im of looseImages) console.log(`    ${im.group} / ${im.name}`);
  }
}

function countFolders(tree) {
  return tree.reduce(
    (n, node) => (node.type === 'folder' ? n + 1 + countFolders(node.children) : n),
    0,
  );
}

async function guessSlug(files) {
  const pdf = files.find((f) => PDF_EXT.test(f.name));
  if (!pdf) return null;
  const m = pdf.name.match(/day\s*(\d+)/i);
  return m ? `day-${m[1]}` : null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
