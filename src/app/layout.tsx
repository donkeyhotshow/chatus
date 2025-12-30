import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SafeClientLayout } from '@/components/layout/SafeClientLayout';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
});

const APP_NAME = "ChatUs";
const APP_DESCRIPTION = "Приватный чат 1 на 1 с рисованием и играми";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
  themeColor: '#7C3AED',
  viewportFit: 'cover',
  height: 'device-height',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://chatus-omega.vercel.app'),
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: ["чат", "общение", "рисование", "игры", "приватный", "PWA"],
  authors: [{ name: "ChatUs Team" }],
  creator: "ChatUs",
  publisher: "ChatUs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/safari-pinned-tab.svg", color: "#7C3AED" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />

        {/* P0 Performance: Preconnect to Firebase services */}
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://firebaseio.com" />

        {/* DNS prefetch for faster resolution */}
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebaseio.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  // Register main SW for caching and offline support
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('[SW] Main SW registered');
                    })
                    .catch(function(err) {
                      console.error('[SW] Main SW failed:', err);
                    });

                  // Register Firebase messaging SW
                  navigator.serviceWorker.register('/firebase-messaging-sw.js')
                    .then(function(reg) {
                      console.log('[SW] Firebase SW registered');
                    })
                    .catch(function(err) {
                      console.warn('[SW] Firebase SW failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        {/* BUG-014 FIX: Fallback for disabled JavaScript */}
        <noscript>
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0D0D0D',
            color: '#ffffff',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            zIndex: 9999
          }}>
            <div style={{ maxWidth: '400px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                borderRadius: '16px',
                margin: '0 auto 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'white' }}>
                  <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
                </svg>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>JavaScript Required</h1>
              <p style={{ color: '#D1D5DB', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                ChatUs — это интерактивное приложение, которому требуется JavaScript для работы чата, рисования и игр в реальном времени.
              </p>
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                padding: '1.25rem', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: '1.5rem'
              }}>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Нет возможности включить JavaScript?
                </p>
                <a 
                  href="https://chatus-omega.vercel.app/download" 
                  style={{ 
                    display: 'inline-block',
                    backgroundColor: '#7C3AED',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Скачать мобильное приложение
                </a>
              </div>
              <p style={{ color: '#6B7280', fontSize: '0.75rem' }}>
                ChatUs requires JavaScript to function. Please enable it in your browser settings or use our mobile app.
              </p>
            </div>
          </div>
        </noscript>
        <SafeClientLayout>
          {children}
        </SafeClientLayout>
      </body>
    </html>
  );
}
