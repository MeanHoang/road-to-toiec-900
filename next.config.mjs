import { MEDIA_BASE } from './shared/lib/media.js';

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Keep verification builds separate from a running local preview.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  // Content stores CDN URLs. Any "/assets/..." ref still left (Firestore docs not re-pushed,
  // freshly imported media before `npm run push-assets`) is sent to the CDN on Vercel;
  // locally it is served from public/assets.
  async redirects() {
    if (!process.env.VERCEL) return [];
    return [{ source: '/assets/:path*', destination: `${MEDIA_BASE}:path*`, permanent: false }];
  },
};
