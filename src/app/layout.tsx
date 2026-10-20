import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Custom UTM Tracking & Analytics System | Next.js App Router',
  description: 'First-party, zero-third-party UTM attribution tracking and telemetry analytics platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
