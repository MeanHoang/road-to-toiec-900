// Lesson media (audio, images, PDFs) lives on the Hugging Face dataset below, not in git.
//
// New media is first written to public/assets/... (gitignored, local staging) and the
// JSON points at "/assets/...". `npm run push-assets` uploads it, rewrites those refs to
// MEDIA_BASE URLs and deletes the local copies. Tests check refs with mediaChecker().

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MEDIA_REPO = 'mhoang0000/toeic900-assets';
// Same value as shared/lib/media.js (the app side).
export const MEDIA_BASE = `https://huggingface.co/datasets/${MEDIA_REPO}/resolve/main/`;
export const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const LOCAL_MEDIA_DIR = path.join(ROOT, 'public', 'assets');
const MANIFEST_CACHE = path.join(ROOT, '.cache', 'media-manifest.json');
const MANIFEST_MAX_AGE_MS = 10 * 60 * 1000;
const DOWNLOAD_DIR = path.join(ROOT, '.cache', 'media');

/** Sync checker for tests: true when a "/assets/..." or CDN ref exists locally or on the CDN. */
export async function mediaChecker() {
  const manifest = await loadMediaManifest();
  return (ref) => {
    const relPath = mediaPathOf(ref);
    if (!relPath) return false;
    return manifest.has(relPath) || existsSync(path.join(LOCAL_MEDIA_DIR, relPath));
  };
}

/** A local file for a media ref, downloading the CDN copy into .cache/media when needed. */
export async function getLocalMediaFilePath(ref) {
  const relPath = mediaPathOf(ref);
  if (!relPath) return null;
  const staged = path.join(LOCAL_MEDIA_DIR, relPath);
  if (existsSync(staged)) return staged;
  const cached = path.join(DOWNLOAD_DIR, relPath);
  if (existsSync(cached)) return cached;
  const response = await fetch(mediaUrl(relPath));
  if (!response.ok) return null;
  await mkdir(path.dirname(cached), { recursive: true });
  await writeFile(cached, Buffer.from(await response.arrayBuffer()));
  return cached;
}

/** Every file path in the dataset, e.g. "day-1/audio/a.mp3". Cached for 10 minutes. */
export async function loadMediaManifest({ refresh = false } = {}) {
  if (!refresh && existsSync(MANIFEST_CACHE)) {
    const cached = JSON.parse(await readFile(MANIFEST_CACHE, 'utf8'));
    if (Date.now() - cached.fetchedAt < MANIFEST_MAX_AGE_MS) return new Set(cached.files);
  }
  const files = [];
  let url = `https://huggingface.co/api/datasets/${MEDIA_REPO}/tree/main?recursive=true&expand=false`;
  while (url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Hugging Face file list failed: ${response.status} ${await response.text()}`);
    for (const entry of await response.json()) if (entry.type === 'file') files.push(entry.path);
    url = nextPageUrl(response.headers.get('link'));
  }
  await mkdir(path.dirname(MANIFEST_CACHE), { recursive: true });
  await writeFile(MANIFEST_CACHE, JSON.stringify({ fetchedAt: Date.now(), files }));
  return new Set(files);
}

/** "/assets/day-1/a b.mp3" or the CDN URL -> "day-1/a b.mp3"; anything else -> null. */
export function mediaPathOf(ref) {
  if (typeof ref !== 'string') return null;
  if (ref.startsWith('/assets/')) return ref.slice('/assets/'.length);
  if (ref.startsWith(MEDIA_BASE)) return decodeURIComponent(ref.slice(MEDIA_BASE.length));
  return null;
}

export const mediaUrl = (relPath) => MEDIA_BASE + relPath.split('/').map(encodeURIComponent).join('/');

const nextPageUrl = (link) => link?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
