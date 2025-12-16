
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { MessageSquareDashed } from 'lucide-react';
import { FirebaseProvider } from '@/components/firebase/FirebaseProvider';
import { BackgroundChanger } from '@/components/layout/BackgroundChanger';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundaryWrapper';
import { ClientLayout } from '@/components/layout/ClientLayout';
// Script import removed as it's not used
// import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';

const APP_NAME = "ЧАТ ДЛЯ НАС";
const APP_DESCRIPTION = "A real-time chat application with collaborative features.";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
  themeColor: '#080808',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_NAME,
      template: `%s - ${APP_NAME}`,
    },
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#080808" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body suppressHydrationWarning>
        {/* Temporarily disabled viewport height script to fix hydration */}
        {/* <Script id="vh-fix" strategy="beforeInteractive">
          {`
            (function() {
              function setVH() {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', vh + 'px');
              }
              setVH();
              window.addEventListener('resize', setVH);
              window.addEventListener('orientationchange', setVH);
            })();
          `}
        </Script> */}
        <ErrorBoundaryWrapper>
          {/* <PerformanceMonitor /> */}
          <FirebaseProvider>
            <ClientLayout>
              <div className="flex flex-col w-full bg-black text-neutral-200 font-sans selection:bg-cyan-400 selection:text-black overflow-hidden min-h-screen min-h-[100dvh] supports-[height:100dvh]:min-h-[100dvh]">
                <header className="h-12 sm:h-14 shrink-0 border-b border-white/10 flex items-center px-3 sm:px-4 lg:px-6 bg-gradient-to-r from-neutral-950 to-black z-50 shadow-lg">
                  <div className="flex items-center gap-2 sm:gap-3 select-none group cursor-default">
                    <div className="p-1 sm:p-1.5 bg-gradient-to-br from-cyan-400 to-blue-500 text-black rounded-lg group-hover:scale-105 transition-transform duration-200 shadow-lg">
                      <MessageSquareDashed className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="font-mono font-bold text-sm sm:text-lg tracking-[0.1em] sm:tracking-[0.2em] text-white">
                      ЧАТ ДЛЯ НАС
                    </span>
                  </div>
                </header>

                <BackgroundChanger />

                <div className="relative z-10 flex w-full flex-1 overflow-hidden min-h-0">
                  {children}
                </div>
              </div>
              <Toaster />
            </ClientLayout>
          </FirebaseProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html >
  );
}
