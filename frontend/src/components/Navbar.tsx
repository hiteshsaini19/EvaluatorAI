'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, removeToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check auth only on client side
  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(isAuthenticated());
  }, [pathname]); // Re-check when path changes

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    router.push('/login');
  };

  // Don't show navbar on login page
  if (pathname === '/login') {
    return null;
  }

  // Don't render until mounted (prevents hydration error)
  if (!mounted) {
    return (
      <nav className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex gap-6 items-center justify-between">
          <div className="font-bold text-xl">Interview Platform</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex gap-6 items-center justify-between">
        <div className="flex gap-6 items-center">
          <Link href="/" className="font-bold text-xl hover:text-blue-200">
            Interview Platform
          </Link>
          
          {isLoggedIn && (
            <>
              <Link href="/categories" className="hover:text-blue-200">
                Categories
              </Link>
              <Link href="/questions" className="hover:text-blue-200">
                Questions
              </Link>
              <Link href="/tests" className="hover:text-blue-200">
                Tests
              </Link>
              <Link href="/results" className="hover:text-blue-200">
                Results
              </Link>
            </>
          )}
        </div>
        
        <div>
          {isLoggedIn && (
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
            >
              Logout
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}