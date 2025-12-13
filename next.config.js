
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Игнорировать ошибки ESLint во время билда
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Игнорировать ошибки TypeScript во время билда
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true, // оставляем для dev
};

module.exports = nextConfig;
