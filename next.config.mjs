/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Keep verification builds separate from a running local preview.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
};
