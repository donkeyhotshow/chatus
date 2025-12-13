
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Do not ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
