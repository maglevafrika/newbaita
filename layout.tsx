import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider, AppThemeProvider } from '@/context/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { I18nextProvider } from './src/app/i18n-provider';

export const metadata: Metadata = {
  title: 'Bait Al Oud',
  description: 'The House of the Oud Music Academy Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AppThemeProvider>
            <I18nextProvider>
              <Toaster />
              {children}
            </I18nextProvider>
          </AppThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}