import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'ЧАТ ДЛЯ НАС',
    description: 'A real-time chat application',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <div className="min-h-screen bg-black text-white">
                    {children}
                </div>
            </body>
        </html>
    );
}
