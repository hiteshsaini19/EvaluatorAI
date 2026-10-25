'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ServerWakeBanner from '@/components/ServerWakeBanner';
import { useIsClient, useIsLoggedIn } from '@/lib/auth';

// Page frame: the sidebar for logged-in pages (a slide-in menu on phones), nothing extra on the
// landing, login, sign-up and candidate pages. The "waking up the server" notice shows everywhere.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isClient = useIsClient();
  const isLoggedIn = useIsLoggedIn();
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  // The menu closes by itself on navigation, because it only stays open for the page it was opened on
  const menuOpen = menuOpenFor === pathname;

  const isCandidatePage = pathname?.startsWith('/candidate');
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const showSidebar = isClient && isLoggedIn && !isAuthPage && !isCandidatePage;

  if (!showSidebar) {
    return (
      <>
        <ServerWakeBanner />
        <main>{children}</main>
      </>
    );
  }

  return (
    <div className="md:flex">
      <ServerWakeBanner />

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Phone top bar and slide-in menu */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-indigo-900 text-white px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="w-7 h-7 bg-white rounded-md flex items-center justify-center text-indigo-900 text-xs">EA</span>
          EvaluatorAI
        </Link>
        <button
          onClick={() => setMenuOpenFor(menuOpen ? null : pathname)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="p-2 -mr-2"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpenFor(null)} />
          <div className="relative h-full w-64">
            <Sidebar onNavigate={() => setMenuOpenFor(null)} />
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 md:ml-64 bg-gray-50 min-h-screen">
        {children}
      </main>
    </div>
  );
}
