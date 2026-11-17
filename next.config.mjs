// Lesson audio, images and PDFs live on Cloudflare Pages, not in git (`npm run push-assets`).
// Content keeps its `/assets/...` paths; on Vercel they redirect to the CDN copy.
// Locally the files are still read from public/assets, so a fresh import works before upload.
const ASSET_CDN = 'https://toeic900-assets.pages.dev';

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Keep verification builds separate from a running local preview.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  async redirects() {
    if (!process.env.VERCEL) return [];
    return [{ source: '/assets/:path*', destination: `${ASSET_CDN}/:path*`, permanent: false }];
  },
};
