#!/usr/bin/env node
// Move new lesson media from public/assets (local staging) to the Hugging Face CDN.
//
//   npm run push-assets
//
// Run after an import / voice script. Only new or changed files are uploaded, one file
// at a time is fine — nothing else has to be on this machine. Needs `hf auth login` once.
// After this, run `npm run push-content <day>` so Firestore gets the CDN URLs too.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { LOCAL_MEDIA_DIR, MEDIA_REPO, ROOT, loadMediaManifest, mediaPathOf, mediaUrl } from './lib/media.mjs';

// Loose images downloaded from Drive (raw answer keys, album art) are never published.
const NEVER_UPLOAD = ['*/extra/*', '_headers', '.cache/*', '.DS_Store', '**/.DS_Store'];
const DELETE_LOCAL_AFTER_UPLOAD = true;

async function run() {
  // Step 1: upload whatever is staged locally.
  const staged = existsSync(LOCAL_MEDIA_DIR) ? await listFiles(LOCAL_MEDIA_DIR) : [];
  const publishable = staged.filter((relPath) => !/(^|\/)extra\//.test(relPath) && !relPath.endsWith('.DS_Store') && relPath !== '_headers');
  if (publishable.length) uploadFolder();
  else console.log('No staged media in public/assets.');

  // Step 2: confirm every staged file is on the CDN before touching anything.
  const manifest = await loadMediaManifest({ refresh: true });
  const missing = publishable.filter((relPath) => !manifest.has(relPath));
  if (missing.length) throw new Error(`${missing.length} files are not on the CDN yet, e.g. ${missing[0]}. Nothing rewritten or deleted.`);

  // Step 3: point content JSON at the CDN.
  const rewritten = await rewriteContentRefs(manifest);
  console.log(`Content: ${rewritten.refs} refs rewritten in ${rewritten.files} files.`);

  // Step 4: drop the local copies that are now on the CDN.
  if (DELETE_LOCAL_AFTER_UPLOAD) {
    for (const relPath of publishable) await rm(path.join(LOCAL_MEDIA_DIR, relPath));
    await removeEmptyDirs(LOCAL_MEDIA_DIR);
    console.log(`Deleted ${publishable.length} local files from public/assets.`);
  }
  console.log('Next: npm run push-content <day> (and push-exam <form>) so Firestore has the new URLs.');
}

/** Replace every "/assets/<path>" string that exists on the CDN with its CDN URL. */
async function rewriteContentRefs(manifest) {
  let files = 0;
  let refs = 0;
  for (const relFile of await listFiles(path.join(ROOT, 'content'))) {
    if (!relFile.endsWith('.json')) continue;
    const file = path.join(ROOT, 'content', relFile);
    const before = await readFile(file, 'utf8');
    const after = before.replace(/"(\/assets\/[^"]+)"/g, (match, ref) => {
      const relPath = mediaPathOf(ref);
      if (!manifest.has(relPath)) return match;
      refs++;
      return JSON.stringify(mediaUrl(relPath));
    });
    if (after !== before) {
      files++;
      await writeFile(file, after);
    }
  }
  return { files, refs };
}

function uploadFolder() {
  const excludes = NEVER_UPLOAD.flatMap((pattern) => ['--exclude', pattern]);
  const upload = spawnSync('hf', ['upload', MEDIA_REPO, LOCAL_MEDIA_DIR, '.', '--repo-type', 'dataset',
    ...excludes, '--commit-message', 'Upload lesson media'], { stdio: 'inherit' });
  if (upload.status !== 0) throw new Error(`hf upload failed (exit ${upload.status}). Run \`hf auth login\` if not logged in.`);
}

async function listFiles(dir, prefix = '') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...await listFiles(path.join(dir, entry.name), relPath));
    else out.push(relPath);
  }
  return out;
}

async function removeEmptyDirs(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) await removeEmptyDirs(path.join(dir, entry.name));
  }
  if (dir !== LOCAL_MEDIA_DIR && (await readdir(dir)).length === 0) await rmdir(dir);
}

run().catch((error) => {
  console.error(`✖ ${error.message}`);
  process.exit(1);
});
