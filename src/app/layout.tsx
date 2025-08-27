
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppHeader } from '@/components/app-header';
import { LoadingProvider } from '@/context/loading-context';
import { LoadingIndicator } from '@/components/loading-indicator';

export const metadata: Metadata = {
  title: 'Al-Masria E-Quotes',
  description: 'نظام عروض الأسعار والمقايسة - المصرية للمقاولات الكهروميكانيكية',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <LoadingProvider>
          <div className="relative flex min-h-screen flex-col bg-background" id="main-container">
            <AppHeader />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
          <LoadingIndicator />
        </LoadingProvider>
      </body>
    </html>
  );
}
