
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Не игнорировать ошибки ESLint во время билда
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Не игнорировать ошибки TypeScript во время билда
  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: true,
};

module.exports = nextConfig;
