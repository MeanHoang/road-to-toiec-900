#!/usr/bin/env node
// Upload public/assets to the Cloudflare Pages project that serves lesson media.
//
//   npm run push-assets
//
// Pages keeps a full snapshot per deploy but only uploads files whose hash is new,
// so re-running after an import sends just the new audio/images.
// Needs `npx wrangler login` once on this machine.

import { mkdtemp, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'public', 'assets');
const PAGES_PROJECT = 'toeic900-assets';
// CORS: the event scenes load Lottie JSON with fetch from the app's own domain.
const HEADERS_FILE = '/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=86400\n';

async function run() {
  // Step 1: CORS + cache headers ride along with the upload.
  await writeFile(path.join(ASSETS_DIR, '_headers'), HEADERS_FILE);
  // Step 2: deploy from an empty folder. Run inside the repo, wrangler detects
  // Next.js and rewrites the project for Workers instead of uploading files.
  const cwd = await mkdtemp(path.join(tmpdir(), 'push-assets-'));
  const wranglerDeploy = spawnSync('npx', ['-y', 'wrangler', 'pages', 'deploy', ASSETS_DIR,
    '--project-name', PAGES_PROJECT, '--branch', 'main', '--commit-dirty=true'], { cwd, stdio: 'inherit' });
  process.exit(wranglerDeploy.status ?? 1);
}

run();
