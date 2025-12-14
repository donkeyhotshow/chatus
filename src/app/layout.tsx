
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { MessageSquareDashed } from 'lucide-react';
import { FirebaseProvider } from '@/components/firebase/FirebaseProvider';
import { BackgroundChanger } from '@/components/layout/BackgroundChanger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ClientLayout } from '@/components/layout/ClientLayout';

const APP_NAME = "ЧАТ ДЛЯ НАС";
const APP_DESCRIPTION = "A real-time chat application with collaborative features.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseProvider>
            <ClientLayout>
              <div className="flex flex-col h-dvh w-full bg-black text-neutral-200 font-sans selection:bg-white selection:text-black overflow-hidden">
                <header className="h-14 shrink-0 border-b border-white/10 flex items-center px-6 bg-neutral-950 z-50">
                  <div className="flex items-center gap-3 select-none group cursor-default">
                    <div className="p-1.5 bg-white text-black rounded-lg group-hover:scale-105 transition-transform">
                      <MessageSquareDashed className="w-5 h-5" />
                    </div>
                    <span className="font-mono font-bold text-lg tracking-[0.2em] text-white">
                      ЧАТ ДЛЯ НАС
                    </span>
                  </div>
                </header>

                <BackgroundChanger />

                <div className="relative z-10 flex w-full h-[calc(100vh_-_3.5rem)]">
                  {children}
                </div>
              </div>
              <Toaster />
            </ClientLayout>
          </FirebaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
