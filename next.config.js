const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,

  // Performance optimizations
  swcMinify: true,
  compress: true,

  // Image optimization (Requirements: 16.4)
  images: {
    formats: ['image/avif', 'image/webp'], // AVIF first for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://*.firebaseio.com https://*.firebasedatabase.app https://*.google.com https://*.perplexity.ai https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.perplexity.ai; img-src 'self' data: blob: https://*.googleusercontent.com https://*.firebase.com https://*.firebaseapp.com https://firebasestorage.googleapis.com https://*.perplexity.ai; font-src 'self' https://fonts.gstatic.com https://*.perplexity.ai; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://*.firebasedatabase.app wss://*.firebasedatabase.app https://www.googletagmanager.com https://www.google-analytics.com; frame-src 'self' https://*.firebaseapp.com; worker-src 'self' blob:;",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },

        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Disable static generation for problematic pages
  trailingSlash: false,
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      'date-fns',
    ],
  },

  // Webpack optimizations for code splitting (Requirements: 16.2)
  webpack: (config, { dev }) => {

    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 200000, // Limit chunk size to 200KB for faster loading
          minSize: 20000,  // Minimum chunk size 20KB
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            default: false,
            defaultVendors: false,
            // Core framework chunks
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              name: 'framework',
              chunks: 'all',
              priority: 40,
              enforce: true,
            },
            // Firebase SDK - separate chunk for lazy loading
            firebase: {
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              name: 'firebase',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // UI library chunks
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 25,
            },
            // Animation libraries
            animations: {
              test: /[\\/]node_modules[\\/](framer-motion|@motionone)[\\/]/,
              name: 'animations',
              chunks: 'all',
              priority: 20,
            },
            // Utility libraries
            utils: {
              test: /[\\/]node_modules[\\/](lodash|date-fns|clsx|class-variance-authority)[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 15,
            },
            // All other vendor code
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Common app code
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }

    return config
  },
}

// Sentry disabled for performance
// const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withBundleAnalyzer(nextConfig);
