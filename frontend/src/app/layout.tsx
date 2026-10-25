import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EvaluatorAI · Free AI test generator for candidate screening',
  description:
    'Create a timed multiple-choice test for candidates in minutes. Pick subjects and difficulty, let AI write the questions, share one link and see scored results.',
  applicationName: 'EvaluatorAI',
  keywords: ['candidate assessment', 'online test', 'MCQ generator', 'AI test generator', 'hiring', 'screening'],
  openGraph: {
    title: 'EvaluatorAI',
    description: 'Free AI-generated, timed candidate tests. Pick subjects, share a link, see scored results.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
