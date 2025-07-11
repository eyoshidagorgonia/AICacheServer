import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SiteHeader } from '@/components/layout/site-header';
import { cn } from '@/lib/utils';
import fs from 'fs/promises';
import path from 'path';

export const metadata: Metadata = {
  title: 'AICache',
  description: 'An intelligent caching proxy for AI models.',
};

async function getBuildNumber() {
  try {
    const buildInfoPath = path.join(process.cwd(), 'data', 'build-info.json');
    const data = await fs.readFile(buildInfoPath, 'utf-8');
    const { build } = JSON.parse(data);
    return build.toFixed(3);
  } catch (error) {
    console.error("Could not read build number:", error);
    return "0.000";
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const buildNumber = await getBuildNumber();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Vollkorn:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("min-h-screen bg-background font-body antialiased")}>
        <div className="relative flex min-h-dvh flex-col">
          <SiteHeader buildNumber={buildNumber} />
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
