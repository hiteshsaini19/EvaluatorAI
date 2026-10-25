'use client';

import { usePathname } from 'next/navigation';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { isAuthenticated } from '@/lib/auth';
import { useEffect, useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(isAuthenticated());
  }, [pathname]);

  const isCandidatePage = pathname?.startsWith('/candidate');
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  // Don't show sidebar on login/sign-up pages, candidate pages, or the public landing page (logged out)
  const showSidebar = mounted && isLoggedIn && !isAuthPage && !isCandidatePage;

  return (
    <html lang="en">
      <body className={inter.className}>
        {showSidebar ? (
          <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-64 bg-gray-50 min-h-screen">
              {children}
            </main>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}